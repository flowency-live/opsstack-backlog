import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getClientBySlug,
  createPbi,
  listPbisByClient,
} from '@/lib/db';
import type { PbiType, PbiStatus, Effort } from '@prisma/client';

// GET /api/clients/[slug]/pbis - List PBIs for a client
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

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const options: {
      status?: PbiStatus | PbiStatus[];
      type?: PbiType | PbiType[];
      search?: string;
    } = {};

    if (status) {
      const statuses = status.split(',') as PbiStatus[];
      options.status = statuses.length === 1 ? statuses[0] : statuses;
    }

    if (type) {
      const types = type.split(',') as PbiType[];
      options.type = types.length === 1 ? types[0] : types;
    }

    if (search) {
      options.search = search;
    }

    const pbis = await listPbisByClient(client.id, options);
    return NextResponse.json(pbis);
  } catch (error) {
    console.error('Error listing PBIs:', error);
    return NextResponse.json(
      { error: 'Failed to list PBIs' },
      { status: 500 }
    );
  }
}

// POST /api/clients/[slug]/pbis - Create a new PBI
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
    const { title, description, type, status, effort } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }

    // Validate type
    const validTypes: PbiType[] = ['feature', 'bug', 'tweak', 'idea'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: feature, bug, tweak, or idea' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses: PbiStatus[] = ['todo', 'in_progress', 'done', 'blocked'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be: todo, in_progress, done, or blocked' },
          { status: 400 }
        );
      }
    }

    // Validate effort if provided
    if (effort) {
      const validEfforts: Effort[] = ['XS', 'S', 'M', 'L', 'XL'];
      if (!validEfforts.includes(effort)) {
        return NextResponse.json(
          { error: 'Invalid effort. Must be: XS, S, M, L, or XL' },
          { status: 400 }
        );
      }
    }

    const pbi = await createPbi({
      clientId: client.id,
      title,
      description,
      type: type as PbiType,
      status: status as PbiStatus | undefined,
      effort: effort as Effort | undefined,
      createdBy: session.user.id,
    });

    return NextResponse.json(pbi, { status: 201 });
  } catch (error) {
    console.error('Error creating PBI:', error);
    return NextResponse.json(
      { error: 'Failed to create PBI' },
      { status: 500 }
    );
  }
}
