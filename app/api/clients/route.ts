import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  listClientsWithStats,
  createClient,
  generateUniqueSlug,
  isSlugAvailable,
} from '@/lib/db';

// GET /api/clients - List all clients (Flowency admin only)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'flowency_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clients = await listClientsWithStats();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error listing clients:', error);
    return NextResponse.json(
      { error: 'Failed to list clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client (Flowency admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'flowency_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, logoUrl, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate or validate slug
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = await generateUniqueSlug(name);
    } else {
      const available = await isSlugAvailable(finalSlug);
      if (!available) {
        return NextResponse.json(
          { error: 'Slug is already taken' },
          { status: 400 }
        );
      }
    }

    const client = await createClient({
      name,
      slug: finalSlug,
      logoUrl,
      description,
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
