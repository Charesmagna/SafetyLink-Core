import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Cloudflare R2 credentials with environment fallback
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'd089bef8b0b58c5d9506b512ec2f63dc';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '375c7925df088e45da2409ccd00cbb07';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'c69466e33f32d39b1ab448df54e85f486412ce3e6b513a1962b3e8dd7057b281';
const R2_BUCKET = process.env.R2_BUCKET || 'media';
const R2_ENDPOINT = process.env.R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_PREFIX = process.env.R2_PREFIX || 'Safetylink/';
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.R2_API_TOKEN || 'cfat_tlHx1K8hOs4F2qIzQUSsc7CWGmudEORDrYc5DYcLa68f67f3';

export const r2Client = new S3Client({
  endpoint: R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const EXT_CATEGORIES: Record<string, string[]> = {
  images: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif', 'tiff'],
  videos: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'],
  documents: ['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'rtf', 'odt'],
  code: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'dart', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml', 'toml', 'sh', 'sql'],
  archives: ['zip', 'tar', 'gz', 'rar', '7z', 'bz2', 'xz', 'tgz', 'apk', 'exe', 'dmg', 'iso', 'deb', 'rpm', 'msi'],
  fonts: ['woff', 'woff2', 'ttf', 'otf', 'eot'],
};

export interface R2MediaAsset {
  key: string;
  name: string;
  category: string;
  extension: string;
  sizeBytes: number;
  sizeFormatted: string;
  lastModified?: string;
  streamUrl: string;
  downloadUrl: string;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileCategory(key: string): { category: string; ext: string } {
  const ext = key.split('.').pop()?.toLowerCase() || '';
  for (const [cat, exts] of Object.entries(EXT_CATEGORIES)) {
    if (exts.includes(ext)) return { category: cat, ext };
  }
  return { category: 'other', ext };
}

/**
 * List all media objects in Cloudflare R2
 */
export async function listR2Media(prefix: string = R2_PREFIX): Promise<R2MediaAsset[]> {
  const assets: R2MediaAsset[] = [];
  let continuationToken: string | undefined;

  try {
    do {
      const cmd: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });
      const res = await r2Client.send(cmd);

      for (const obj of res.Contents || []) {
        if (!obj.Key || obj.Key.endsWith('/')) continue; // Skip directory markers
        const { category, ext } = getFileCategory(obj.Key);
        const fileName = obj.Key.split('/').pop() || obj.Key;
        const size = obj.Size || 0;

        assets.push({
          key: obj.Key,
          name: fileName,
          category,
          extension: ext,
          sizeBytes: size,
          sizeFormatted: formatBytes(size),
          lastModified: obj.LastModified ? obj.LastModified.toISOString() : undefined,
          streamUrl: `/api/r2/stream/${encodeURIComponent(obj.Key)}`,
          downloadUrl: `/api/r2/download/${encodeURIComponent(obj.Key)}`,
        });
      }

      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);
  } catch (err: any) {
    console.error('[R2 Storage] Error listing objects:', err.message);
  }

  return assets;
}

/**
 * Fetch a single object stream from R2 with optional byte range support
 */
export async function getR2ObjectStream(key: string, range?: string) {
  const cmd = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Range: range,
  });

  return await r2Client.send(cmd);
}

/**
 * Store emergency evidence file or audio to R2
 */
export async function uploadIncidentEvidence(
  incidentId: string,
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${R2_PREFIX}evidence/${incidentId}/${Date.now()}-${safeName}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: `/api/r2/stream/${encodeURIComponent(key)}`,
  };
}

/**
 * Use Cloudflare Workers AI (Llava) to describe an image
 */
export async function describeImageWithAI(imageBuffer: Buffer): Promise<string> {
  if (!CF_API_TOKEN || !R2_ACCOUNT_ID) {
    throw new Error('Cloudflare API Token or Account ID missing');
  }

  const base64 = imageBuffer.toString('base64');
  const body = JSON.stringify({
    image: base64,
    prompt: 'Describe this image in 5 words or less. Focus on what the image IS (e.g. emergency alert map, armed guard vehicle, panic button interface). Do not say picture of. Just describe directly.',
  });

  const url = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/ai/run/@cf/llava-1.5-alpha-hf`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Cloudflare AI error ${resp.status}: ${text}`);
  }

  const data: any = await resp.json();
  const description = data.response || data.result?.response || '';
  return description.trim();
}
