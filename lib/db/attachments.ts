import prisma from '@/lib/prisma';
import type { Attachment } from '@prisma/client';

export type AttachmentWithUploader = Attachment & {
  uploader: { id: string; name: string };
};

/**
 * Create attachment record
 */
export async function createAttachment(data: {
  pbiId: string;
  filename: string;
  s3Key: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string;
}): Promise<Attachment> {
  return prisma.attachment.create({
    data: {
      pbiId: data.pbiId,
      filename: data.filename,
      s3Key: data.s3Key,
      contentType: data.contentType,
      sizeBytes: data.sizeBytes,
      uploadedBy: data.uploadedBy,
    },
  });
}

/**
 * Get attachment by ID
 */
export async function getAttachmentById(
  id: string
): Promise<AttachmentWithUploader | null> {
  return prisma.attachment.findUnique({
    where: { id },
    include: {
      uploader: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * List attachments for a PBI
 */
export async function listAttachmentsByPbi(
  pbiId: string
): Promise<AttachmentWithUploader[]> {
  return prisma.attachment.findMany({
    where: { pbiId },
    include: {
      uploader: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete attachment record
 */
export async function deleteAttachment(id: string): Promise<Attachment> {
  return prisma.attachment.delete({ where: { id } });
}

/**
 * Get attachment with PBI info (for access control)
 */
export async function getAttachmentWithPbi(id: string) {
  return prisma.attachment.findUnique({
    where: { id },
    include: {
      pbi: {
        select: { clientId: true },
      },
    },
  });
}
