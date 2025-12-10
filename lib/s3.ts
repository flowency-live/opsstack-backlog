import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'flowency-backlog-attachments';

/**
 * Generate a presigned URL for uploading a file
 */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300 // 5 minutes default
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading/viewing a file
 */
export async function getDownloadPresignedUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a unique S3 key for a file
 */
export function generateS3Key(
  clientId: string,
  pbiId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `attachments/${clientId}/${pbiId}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Get the public URL for a file (if bucket is public)
 * Note: We use presigned URLs instead for security
 */
export function getPublicUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-west-2'}.amazonaws.com/${key}`;
}

/**
 * Validate file type for upload
 */
export function isAllowedFileType(contentType: string): boolean {
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown',
    // Archives
    'application/zip',
  ];

  return allowedTypes.includes(contentType);
}

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate file size
 */
export function isAllowedFileSize(sizeBytes: number): boolean {
  return sizeBytes <= MAX_FILE_SIZE;
}
