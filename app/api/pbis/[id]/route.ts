import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getPbiById,
  getPbiWithFullDetails,
  updatePbi,
  deletePbi,
  reorderPbi,
} from '@/lib/db';
import type { PbiType, PbiStatus, Effort } from '@prisma/client';

// GET /api/pbis/[id] - Get PBI details
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

    // Check if full details requested
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('include') === 'full';

    const pbi = includeDetails
      ? await getPbiWithFullDetails(id)
      : await getPbiById(id);

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

    return NextResponse.json(pbi);
  } catch (error) {
    console.error('Error getting PBI:', error);
    return NextResponse.json(
      { error: 'Failed to get PBI' },
      { status: 500 }
    );
  }
}

// PATCH /api/pbis/[id] - Update PBI
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
    const { title, description, type, status, effort, stackPosition } = body;

    // Validate type if provided
    if (type) {
      const validTypes: PbiType[] = ['feature', 'bug', 'tweak', 'idea'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: 'Invalid type. Must be: feature, bug, tweak, or idea' },
          { status: 400 }
        );
      }
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

    // Validate effort if provided (can be null to clear)
    if (effort !== undefined && effort !== null) {
      const validEfforts: Effort[] = ['XS', 'S', 'M', 'L', 'XL'];
      if (!validEfforts.includes(effort)) {
        return NextResponse.json(
          { error: 'Invalid effort. Must be: XS, S, M, L, or XL' },
          { status: 400 }
        );
      }
    }

    // Handle position change separately
    if (stackPosition !== undefined && stackPosition !== pbi.stackPosition) {
      await reorderPbi(id, stackPosition);
    }

    // Update other fields
    const updateData: {
      title?: string;
      description?: string;
      type?: PbiType;
      status?: PbiStatus;
      effort?: Effort | null;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type as PbiType;
    if (status !== undefined) updateData.status = status as PbiStatus;
    if (effort !== undefined) updateData.effort = effort as Effort | null;

    if (Object.keys(updateData).length > 0) {
      await updatePbi(id, updateData);
    }

    // Fetch fresh data to include position changes
    const freshPbi = await getPbiById(id);
    return NextResponse.json(freshPbi);
  } catch (error) {
    console.error('Error updating PBI:', error);
    return NextResponse.json(
      { error: 'Failed to update PBI' },
      { status: 500 }
    );
  }
}

// DELETE /api/pbis/[id] - Delete PBI
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

    await deletePbi(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting PBI:', error);
    return NextResponse.json(
      { error: 'Failed to delete PBI' },
      { status: 500 }
    );
  }
}
