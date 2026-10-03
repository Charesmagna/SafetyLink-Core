/**
 * Cloudinary Media Service
 * Handles image optimization, transformation, and delivery
 */

import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

export interface CloudinaryUploadResult {
  success: boolean;
  publicId: string;
  url: string;
  secureUrl: string;
  size: number;
  format: string;
  width?: number;
  height?: number;
}

class CloudinaryService {
  private initialized: boolean = false;

  constructor() {
    if (env.CLOUDINARY_CLOUD && env.CLOUDINARY_API_KEY) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      });
      this.initialized = true;
      console.log('[Cloudinary] Initialized');
    } else {
      console.warn('[Cloudinary] Not configured. Set CLOUDINARY_CLOUD, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    }
  }

  /**
   * Upload image to Cloudinary
   */
  async uploadImage(
    fileBuffer: Buffer,
    fileName: string,
    folder: string = 'safetylink'
  ): Promise<CloudinaryUploadResult> {
    if (!this.initialized) {
      throw new Error('Cloudinary not configured');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: fileName.replace(/\.[^.]+$/, ''),
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          tags: ['safetylink', 'incident-evidence'],
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary] Upload error:', error.message);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
            return;
          }

          if (!result) {
            reject(new Error('Cloudinary returned no result'));
            return;
          }

          resolve({
            success: true,
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            size: result.bytes,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Get optimized image URL with transformations
   */
  getOptimizedUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: 'auto' | 'low' | 'medium' | 'high';
      format?: 'webp' | 'jpg' | 'png';
      crop?: 'fill' | 'fit' | 'thumb';
    }
  ): string {
    if (!this.initialized) {
      return '';
    }

    const transformations: any[] = [];

    if (options?.width || options?.height) {
      transformations.push({
        width: options.width,
        height: options.height,
        crop: options.crop || 'fit',
      });
    }

    if (options?.quality) {
      transformations.push({
        quality: options.quality,
      });
    }

    if (options?.format) {
      transformations.push({
        fetch_format: options.format,
      });
    }

    return cloudinary.url(publicId, {
      transformations,
      secure: true,
    });
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`[Cloudinary] Deleted ${publicId}:`, result.result);
      return result.result === 'ok';
    } catch (error: any) {
      console.error('[Cloudinary] Delete failed:', error.message);
      return false;
    }
  }

  /**
   * Generate thumbnail
   */
  getThumbnailUrl(
    publicId: string,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): string {
    const dimensions = {
      small: { width: 100, height: 100 },
      medium: { width: 300, height: 300 },
      large: { width: 500, height: 500 },
    };

    return this.getOptimizedUrl(publicId, {
      ...dimensions[size],
      crop: 'thumb',
      quality: 'auto',
      format: 'webp',
    });
  }
}

export const cloudinaryService = new CloudinaryService();
