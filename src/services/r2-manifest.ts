import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, listR2Media, R2MediaAsset } from './r2-storage';

const R2_BUCKET = process.env.R2_BUCKET || 'media';

export interface R2Manifest {
  generated: string;
  bucket: string;
  totalFiles: number;
  categories: Record<string, number>;
  files: Array<{
    key: string;
    name: string;
    type: string;
    extension: string;
    sizeFormatted: string;
    streamUrl: string;
    downloadUrl: string;
  }>;
}

/**
 * Builds and uploads manifest.json to the R2 bucket
 */
export async function syncR2Manifest(): Promise<R2Manifest> {
  const assets: R2MediaAsset[] = await listR2Media(''); // Scan all in bucket

  const categories: Record<string, number> = {};
  assets.forEach((a) => {
    categories[a.category] = (categories[a.category] || 0) + 1;
  });

  const manifest: R2Manifest = {
    generated: new Date().toISOString(),
    bucket: R2_BUCKET,
    totalFiles: assets.length,
    categories,
    files: assets.map((a) => ({
      key: a.key,
      name: a.name,
      type: a.category,
      extension: a.extension,
      sizeFormatted: a.sizeFormatted,
      streamUrl: a.streamUrl,
      downloadUrl: a.downloadUrl,
    })),
  };

  // Upload to R2 root
  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: 'manifest.json',
        Body: JSON.stringify(manifest, null, 2),
        ContentType: 'application/json',
      })
    );
    console.log('[R2 Manifest] manifest.json uploaded successfully to bucket:', R2_BUCKET);
  } catch (err: any) {
    console.error('[R2 Manifest] Failed to upload manifest.json:', err.message);
  }

  return manifest;
}
