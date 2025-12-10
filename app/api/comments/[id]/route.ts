import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getCommentById,
  updateComment,
  deleteComment,
  userOwnsComment,
  getPbiById,
} from '@/lib/db';

// GET /api/comments/[id] - Get comment details
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
    const comment = await getCommentById(id);

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Get PBI to check access
    const pbi = await getPbiById(comment.pbiId);
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

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error getting comment:', error);
    return NextResponse.json(
      { error: 'Failed to get comment' },
      { status: 500 }
    );
  }
}

// PATCH /api/comments/[id] - Update comment (owner or admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const comment = await getCommentById(id);

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Get PBI to check access
    const pbi = await getPbiById(comment.pbiId);
    if (!pbi) {
      return NextResponse.json({ error: 'PBI not found' }, { status: 404 });
    }

    // Check access - must be owner or flowency admin
    const isOwner = await userOwnsComment(id, session.user.id);
    if (session.user.role !== 'flowency_admin' && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const updated = await updateComment(id, content.trim());
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Delete comment (owner or admin only)
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
    const comment = await getCommentById(id);

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Get PBI to check access
    const pbi = await getPbiById(comment.pbiId);
    if (!pbi) {
      return NextResponse.json({ error: 'PBI not found' }, { status: 404 });
    }

    // Check access - must be owner or flowency admin
    const isOwner = await userOwnsComment(id, session.user.id);
    if (session.user.role !== 'flowency_admin' && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteComment(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
