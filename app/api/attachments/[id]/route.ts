import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getAttachmentById,
  getAttachmentWithPbi,
  deleteAttachment,
} from '@/lib/db';
import { getDownloadPresignedUrl, deleteFile } from '@/lib/s3';

// GET /api/attachments/[id] - Get attachment details with download URL
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
    const attachmentWithPbi = await getAttachmentWithPbi(id);

    if (!attachmentWithPbi) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Check access
    if (
      session.user.role !== 'flowency_admin' &&
      session.user.clientId !== attachmentWithPbi.pbi.clientId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const attachment = await getAttachmentById(id);
    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Add download URL
    const downloadUrl = await getDownloadPresignedUrl(attachment.s3Key);

    return NextResponse.json({ ...attachment, downloadUrl });
  } catch (error) {
    console.error('Error getting attachment:', error);
    return NextResponse.json(
      { error: 'Failed to get attachment' },
      { status: 500 }
    );
  }
}

// DELETE /api/attachments/[id] - Delete attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const attachmentWithPbi = await getAttachmentWithPbi(id);

    if (!attachmentWithPbi) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Check access - owner or flowency admin
    const isOwner = attachmentWithPbi.uploadedBy === session.user.id;
    if (session.user.role !== 'flowency_admin' && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from S3
    try {
      await deleteFile(attachmentWithPbi.s3Key);
    } catch (s3Error) {
      console.error('Error deleting file from S3:', s3Error);
      // Continue with DB deletion even if S3 fails
    }

    // Delete from database
    await deleteAttachment(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    );
  }
}
