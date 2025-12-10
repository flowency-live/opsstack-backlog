import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getPbiById,
  createComment,
  listCommentsByPbi,
} from '@/lib/db';

// GET /api/pbis/[id]/comments - List comments for a PBI
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

    const comments = await listCommentsByPbi(id);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error listing comments:', error);
    return NextResponse.json(
      { error: 'Failed to list comments' },
      { status: 500 }
    );
  }
}

// POST /api/pbis/[id]/comments - Create a comment
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
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const comment = await createComment({
      pbiId: id,
      userId: session.user.id,
      content: content.trim(),
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
