import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getClientWithStats,
  updateClient,
  archiveClient,
  isSlugAvailable,
} from '@/lib/db';

// GET /api/clients/[slug] - Get client details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const client = await getClientWithStats(slug);

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

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error getting client:', error);
    return NextResponse.json(
      { error: 'Failed to get client' },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/[slug] - Update client (Flowency admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'flowency_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    const client = await getClientWithStats(slug);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug: newSlug, logoUrl, description } = body;

    // Validate new slug if changing
    if (newSlug && newSlug !== slug) {
      const available = await isSlugAvailable(newSlug, client.id);
      if (!available) {
        return NextResponse.json(
          { error: 'Slug is already taken' },
          { status: 400 }
        );
      }
    }

    const updated = await updateClient(client.id, {
      name,
      slug: newSlug,
      logoUrl,
      description,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[slug] - Archive client (Flowency admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'flowency_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    const client = await getClientWithStats(slug);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await archiveClient(client.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving client:', error);
    return NextResponse.json(
      { error: 'Failed to archive client' },
      { status: 500 }
    );
  }
}
