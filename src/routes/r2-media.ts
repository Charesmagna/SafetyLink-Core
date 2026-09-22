import { Router, Request, Response } from 'express';
import {
  listR2Media,
  getR2ObjectStream,
  uploadIncidentEvidence,
  formatBytes,
  getFileCategory,
  r2Client,
} from '../services/r2-storage';
import { syncR2Manifest } from '../services/r2-manifest';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export const r2Router = Router();

const MIME_MAP: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  json: 'application/json',
  apk: 'application/vnd.android.package-archive',
  zip: 'application/zip',
  exe: 'application/x-msdownload',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
};

/**
 * GET /api/r2/assets
 * Lists all assets in the Cloudflare R2 bucket with category grouping
 */
r2Router.get('/assets', async (req: Request, res: Response) => {
  try {
    const prefix = typeof req.query.prefix === 'string' ? req.query.prefix : 'Safetylink/';
    const assets = await listR2Media(prefix);

    const categories: Record<string, number> = {};
    assets.forEach((a) => {
      categories[a.category] = (categories[a.category] || 0) + 1;
    });

    res.json({
      success: true,
      bucket: process.env.R2_BUCKET || 'media',
      prefix,
      totalCount: assets.length,
      categories,
      assets,
    });
  } catch (err: any) {
    console.error('[R2 Router] Error fetching assets:', err.message);
    res.status(500).json({ error: 'Failed to retrieve R2 assets', details: err.message });
  }
});

/**
 * GET /api/r2/manifest
 * Returns or triggers manifest generation
 */
r2Router.get('/manifest', async (req: Request, res: Response) => {
  try {
    const manifest = await syncR2Manifest();
    res.json({ success: true, manifest });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate manifest', details: err.message });
  }
});

/**
 * GET /api/r2/download/apk
 * Direct download for the verified functional Android APK in R2
 */
r2Router.get('/download/apk', async (req: Request, res: Response) => {
  const apkKey = 'Safetylink/SafetyLink.apk';
  const BUCKET = process.env.R2_BUCKET || 'media';

  try {
    const head = await r2Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: apkKey }));
    const s3Stream = await getR2ObjectStream(apkKey);

    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="SafetyLink-1.0.2.apk"');
    if (head.ContentLength) {
      res.setHeader('Content-Length', head.ContentLength);
    }

    if (s3Stream.Body instanceof Readable) {
      s3Stream.Body.pipe(res);
    } else {
      const chunks: any[] = [];
      for await (const chunk of s3Stream.Body as any) {
        chunks.push(chunk);
      }
      res.end(Buffer.concat(chunks));
    }
  } catch (err: any) {
    console.error('[R2 Router] Error downloading APK:', err.message);
    res.status(404).json({ error: 'SafetyLink APK not found in R2 storage', details: err.message });
  }
});

/**
 * GET /api/r2/stream/*
 * Streams any media asset (supports byte-range for MP4 videos and audio)
 */
r2Router.get('/stream/{*key}', async (req: Request, res: Response) => {
  const paramVal = req.params.key;
  if (!paramVal) return res.status(400).json({ error: 'Missing object key' });

  let rawKey = Array.isArray(paramVal) ? paramVal.join('/') : String(paramVal);
  rawKey = rawKey.replace(/^\/+/, '');
  let key = decodeURIComponent(rawKey);
  if (!key.startsWith('Safetylink/')) {
    key = 'Safetylink/' + key;
  }
  const BUCKET = process.env.R2_BUCKET || 'media';
  const ext = key.split('.').pop()?.toLowerCase() || '';
  const contentType = MIME_MAP[ext] || 'application/octet-stream';

  try {
    const range = req.headers.range;
    const head = await r2Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    const totalSize = head.ContentLength || 0;

    if (range) {
      // Byte range request (essential for video timeline scrub/play)
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunkSize = end - start + 1;

      const s3Stream = await getR2ObjectStream(key, `bytes=${start}-${end}`);

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      });

      if (s3Stream.Body instanceof Readable) {
        s3Stream.Body.pipe(res);
      } else {
        const chunks: any[] = [];
        for await (const chunk of s3Stream.Body as any) chunks.push(chunk);
        res.end(Buffer.concat(chunks));
      }
    } else {
      const s3Stream = await getR2ObjectStream(key);

      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
      });

      if (s3Stream.Body instanceof Readable) {
        s3Stream.Body.pipe(res);
      } else {
        const chunks: any[] = [];
        for await (const chunk of s3Stream.Body as any) chunks.push(chunk);
        res.end(Buffer.concat(chunks));
      }
    }
  } catch (err: any) {
    console.error(`[R2 Router] Stream error for ${key}:`, err.message);
    res.status(404).json({ error: 'File not found or inaccessible', key });
  }
});

/**
 * GET /api/r2/download/*
 * Forces download attachment header for any R2 object
 */
r2Router.get('/download/{*key}', async (req: Request, res: Response) => {
  const paramVal = req.params.key;
  if (!paramVal) return res.status(400).json({ error: 'Missing object key' });

  let rawKey = Array.isArray(paramVal) ? paramVal.join('/') : String(paramVal);
  rawKey = rawKey.replace(/^\/+/, '');
  let key = decodeURIComponent(rawKey);
  if (!key.startsWith('Safetylink/')) {
    key = 'Safetylink/' + key;
  }
  const BUCKET = process.env.R2_BUCKET || 'media';
  const fileName = key.split('/').pop() || 'download';
  const ext = key.split('.').pop()?.toLowerCase() || '';
  const contentType = MIME_MAP[ext] || 'application/octet-stream';

  try {
    const head = await r2Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    const s3Stream = await getR2ObjectStream(key);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    if (head.ContentLength) res.setHeader('Content-Length', head.ContentLength);

    if (s3Stream.Body instanceof Readable) {
      s3Stream.Body.pipe(res);
    } else {
      const chunks: any[] = [];
      for await (const chunk of s3Stream.Body as any) chunks.push(chunk);
      res.end(Buffer.concat(chunks));
    }
  } catch (err: any) {
    console.error(`[R2 Router] Download error for ${key}:`, err.message);
    res.status(404).json({ error: 'File not found', key });
  }
});
