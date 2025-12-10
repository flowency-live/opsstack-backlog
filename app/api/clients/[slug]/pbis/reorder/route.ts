import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getClientBySlug, bulkReorderPbis } from '@/lib/db';

// POST /api/clients/[slug]/pbis/reorder - Bulk reorder PBIs
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const client = await getClientBySlug(slug);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check access
    if (
      session.user.role !== 'flowency_admin' &&
      session.user.clientId !== client.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { orderedIds } = body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds array is required' },
        { status: 400 }
      );
    }

    if (orderedIds.length === 0) {
      return NextResponse.json(
        { error: 'orderedIds cannot be empty' },
        { status: 400 }
      );
    }

    await bulkReorderPbis(client.id, orderedIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering PBIs:', error);
    return NextResponse.json(
      { error: 'Failed to reorder PBIs' },
      { status: 500 }
    );
  }
}
