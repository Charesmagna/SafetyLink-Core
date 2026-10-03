/**
 * Cloudflare R2 Media Service
 * Handles secure upload, download, and management of incident evidence
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { GetObjectCommand as GetCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { env } from '../config/env';

export interface R2UploadResult {
  success: boolean;
  key: string;
  url: string;
  publicUrl: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

export interface R2MediaAsset {
  key: string;
  name: string;
  size: number;
  sizeFormatted: string;
  url: string;
  uploadedAt: string;
}

class R2MediaService {
  private client: S3Client;
  private bucket: string;
  private prefix: string;
  private endpoint: string;

  constructor() {
    this.bucket = env.R2_BUCKET;
    this.prefix = env.R2_PREFIX;
    this.endpoint = env.R2_ENDPOINT;
    
    this.client = new S3Client({
      endpoint: this.endpoint,
      region: 'auto',
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Upload incident evidence (video, audio, photo)
   */
  async uploadEvidence(
    incidentId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<R2UploadResult> {
    // Sanitize filename
    const safeName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 255);
    
    const timestamp = Date.now();
    const key = `${this.prefix}evidence/${incidentId}/${timestamp}-${safeName}`;
    
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          Metadata: {
            'incident-id': incidentId,
            'uploaded-at': new Date().toISOString(),
          },
        })
      );
      
      const publicUrl = `${this.endpoint}/${this.bucket}/${key}`;
      const streamUrl = `/api/r2/stream/${encodeURIComponent(key)}`;
      
      console.log(`[R2] Uploaded evidence: ${key} (${fileBuffer.length} bytes)`);
      
      return {
        success: true,
        key,
        url: streamUrl,
        publicUrl,
        size: fileBuffer.length,
        contentType,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error(`[R2] Upload failed for ${key}:`, error.message);
      throw new Error(`Failed to upload evidence: ${error.message}`);
    }
  }

  /**
   * List all evidence for an incident
   */
  async listIncidentMedia(incidentId: string): Promise<R2MediaAsset[]> {
    const assets: R2MediaAsset[] = [];
    const prefix = `${this.prefix}evidence/${incidentId}/`;
    
    try {
      let continuationToken: string | undefined;
      
      do {
        const response = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          })
        );
        
        for (const obj of response.Contents || []) {
          if (!obj.Key || obj.Key.endsWith('/')) continue;
          
          assets.push({
            key: obj.Key,
            name: obj.Key.split('/').pop() || obj.Key,
            size: obj.Size || 0,
            sizeFormatted: this.formatBytes(obj.Size || 0),
            url: `/api/r2/stream/${encodeURIComponent(obj.Key)}`,
            uploadedAt: obj.LastModified?.toISOString() || new Date().toISOString(),
          });
        }
        
        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
      } while (continuationToken);
      
      return assets;
    } catch (error: any) {
      console.error(`[R2] List failed for incident ${incidentId}:`, error.message);
      return [];
    }
  }

  /**
   * Download/stream evidence file
   */
  async getObjectStream(key: string, range?: string) {
    try {
      const response = await this.client.send(
        new GetCommand({
          Bucket: this.bucket,
          Key: key,
          Range: range,
        })
      );
      
      return response;
    } catch (error: any) {
      console.error(`[R2] Stream failed for ${key}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete evidence file
   */
  async deleteEvidence(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      
      console.log(`[R2] Deleted: ${key}`);
      return true;
    } catch (error: any) {
      console.error(`[R2] Delete failed for ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getObjectMetadata(key: string) {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      
      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error: any) {
      console.error(`[R2] Metadata fetch failed for ${key}:`, error.message);
      throw error;
    }
  }

  /**
   * Format bytes to human-readable size
   */
  private formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

export const r2MediaService = new R2MediaService();
