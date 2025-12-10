import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getPbiById,
  createAttachment,
  listAttachmentsByPbi,
} from '@/lib/db';
import {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  generateS3Key,
  isAllowedFileType,
  isAllowedFileSize,
  MAX_FILE_SIZE,
} from '@/lib/s3';

// GET /api/pbis/[id]/attachments - List attachments for a PBI
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const pbi = await getPbiById(id);

    if (!pbi) {
      return NextResponse.json({ error: 'PBI not found' }, { status: 404 });
    }

    // Check access
    if (
      session.user.role !== 'flowency_admin' &&
      session.user.clientId !== pbi.clientId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const attachments = await listAttachmentsByPbi(id);

    // Add download URLs to each attachment
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => ({
        ...attachment,
        downloadUrl: await getDownloadPresignedUrl(attachment.s3Key),
      }))
    );

    return NextResponse.json(attachmentsWithUrls);
  } catch (error) {
    console.error('Error listing attachments:', error);
    return NextResponse.json(
      { error: 'Failed to list attachments' },
      { status: 500 }
    );
  }
}

// POST /api/pbis/[id]/attachments - Request upload URL or confirm upload
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const pbi = await getPbiById(id);

    if (!pbi) {
      return NextResponse.json({ error: 'PBI not found' }, { status: 404 });
    }

    // Check access
    if (
      session.user.role !== 'flowency_admin' &&
      session.user.clientId !== pbi.clientId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, filename, contentType, sizeBytes, s3Key } = body;

    // Request upload URL
    if (action === 'request-upload') {
      if (!filename || !contentType || !sizeBytes) {
        return NextResponse.json(
          { error: 'filename, contentType, and sizeBytes are required' },
          { status: 400 }
        );
      }

      if (!isAllowedFileType(contentType)) {
        return NextResponse.json(
          { error: 'File type not allowed' },
          { status: 400 }
        );
      }

      if (!isAllowedFileSize(sizeBytes)) {
        return NextResponse.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      const key = generateS3Key(pbi.clientId, id, filename);
      const uploadUrl = await getUploadPresignedUrl(key, contentType);

      return NextResponse.json({
        uploadUrl,
        s3Key: key,
        expiresIn: 300, // 5 minutes
      });
    }

    // Confirm upload (create attachment record)
    if (action === 'confirm-upload') {
      if (!filename || !contentType || !sizeBytes || !s3Key) {
        return NextResponse.json(
          { error: 'filename, contentType, sizeBytes, and s3Key are required' },
          { status: 400 }
        );
      }

      const attachment = await createAttachment({
        pbiId: id,
        filename,
        s3Key,
        contentType,
        sizeBytes,
        uploadedBy: session.user.id,
      });

      // Add download URL
      const downloadUrl = await getDownloadPresignedUrl(s3Key);

      return NextResponse.json(
        { ...attachment, downloadUrl },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "request-upload" or "confirm-upload"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling attachment:', error);
    return NextResponse.json(
      { error: 'Failed to handle attachment' },
      { status: 500 }
    );
  }
}
