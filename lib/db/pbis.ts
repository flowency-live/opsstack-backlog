import prisma from '@/lib/prisma';
import type { Pbi, PbiType, PbiStatus, Effort, Prisma } from '@prisma/client';

export type PbiWithDetails = Pbi & {
  creator: { id: string; name: string; avatarUrl: string | null };
  _count: { comments: number; attachments: number };
};

/**
 * Create a new PBI
 */
export async function createPbi(data: {
  clientId: string;
  title: string;
  description?: string;
  type: PbiType;
  status?: PbiStatus;
  effort?: Effort;
  createdBy: string;
}): Promise<Pbi> {
  // Get the next stack position for this client
  const maxPosition = await prisma.pbi.aggregate({
    where: { clientId: data.clientId },
    _max: { stackPosition: true },
  });

  const nextPosition = (maxPosition._max.stackPosition ?? 0) + 1;

  return prisma.pbi.create({
    data: {
      clientId: data.clientId,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status || 'todo',
      effort: data.effort,
      stackPosition: nextPosition,
      createdBy: data.createdBy,
    },
  });
}

/**
 * Get PBI by ID with details
 */
export async function getPbiById(id: string): Promise<PbiWithDetails | null> {
  return prisma.pbi.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
      _count: {
        select: { comments: true, attachments: true },
      },
    },
  });
}

/**
 * Get PBI with full details including comments and attachments
 */
export async function getPbiWithFullDetails(id: string) {
  return prisma.pbi.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
      comments: {
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      attachments: {
        include: {
          uploader: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

/**
 * List PBIs for a client
 */
export async function listPbisByClient(
  clientId: string,
  options?: {
    status?: PbiStatus | PbiStatus[];
    type?: PbiType | PbiType[];
    search?: string;
  }
): Promise<PbiWithDetails[]> {
  const where: Prisma.PbiWhereInput = { clientId };

  if (options?.status) {
    where.status = Array.isArray(options.status)
      ? { in: options.status }
      : options.status;
  }

  if (options?.type) {
    where.type = Array.isArray(options.type)
      ? { in: options.type }
      : options.type;
  }

  if (options?.search) {
    where.OR = [
      { title: { contains: options.search, mode: 'insensitive' } },
      { description: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  return prisma.pbi.findMany({
    where,
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
      _count: {
        select: { comments: true, attachments: true },
      },
    },
    orderBy: { stackPosition: 'asc' },
  });
}

/**
 * Update PBI
 */
export async function updatePbi(
  id: string,
  data: {
    title?: string;
    description?: string;
    type?: PbiType;
    status?: PbiStatus;
    effort?: Effort | null;
  }
): Promise<Pbi> {
  return prisma.pbi.update({
    where: { id },
    data,
  });
}

/**
 * Delete PBI
 */
export async function deletePbi(id: string): Promise<void> {
  const pbi = await prisma.pbi.findUnique({
    where: { id },
    select: { clientId: true, stackPosition: true },
  });

  if (!pbi) return;

  await prisma.$transaction([
    // Delete the PBI
    prisma.pbi.delete({ where: { id } }),
    // Shift positions of items below
    prisma.pbi.updateMany({
      where: {
        clientId: pbi.clientId,
        stackPosition: { gt: pbi.stackPosition },
      },
      data: {
        stackPosition: { decrement: 1 },
      },
    }),
  ]);
}

/**
 * Reorder PBIs - move a PBI to a new position
 */
export async function reorderPbi(
  id: string,
  newPosition: number
): Promise<void> {
  const pbi = await prisma.pbi.findUnique({
    where: { id },
    select: { clientId: true, stackPosition: true },
  });

  if (!pbi) throw new Error('PBI not found');

  const oldPosition = pbi.stackPosition;
  if (oldPosition === newPosition) return;

  // Get the max position
  const maxPosition = await prisma.pbi.aggregate({
    where: { clientId: pbi.clientId },
    _max: { stackPosition: true },
  });

  // Clamp new position to valid range
  const clampedNewPosition = Math.max(
    1,
    Math.min(newPosition, maxPosition._max.stackPosition ?? 1)
  );

  if (oldPosition === clampedNewPosition) return;

  await prisma.$transaction(async (tx) => {
    // Temporarily set to 0 to avoid unique constraint
    await tx.pbi.update({
      where: { id },
      data: { stackPosition: 0 },
    });

    if (oldPosition < clampedNewPosition) {
      // Moving down: shift items up
      await tx.pbi.updateMany({
        where: {
          clientId: pbi.clientId,
          stackPosition: { gt: oldPosition, lte: clampedNewPosition },
        },
        data: { stackPosition: { decrement: 1 } },
      });
    } else {
      // Moving up: shift items down
      await tx.pbi.updateMany({
        where: {
          clientId: pbi.clientId,
          stackPosition: { gte: clampedNewPosition, lt: oldPosition },
        },
        data: { stackPosition: { increment: 1 } },
      });
    }

    // Set final position
    await tx.pbi.update({
      where: { id },
      data: { stackPosition: clampedNewPosition },
    });
  });
}

/**
 * Bulk reorder PBIs - set exact positions
 */
export async function bulkReorderPbis(
  clientId: string,
  orderedIds: string[]
): Promise<void> {
  // First verify all PBIs belong to this client
  const pbis = await prisma.pbi.findMany({
    where: {
      id: { in: orderedIds },
      clientId,
    },
    select: { id: true },
  });

  const validIds = new Set(pbis.map((p) => p.id));
  const invalidIds = orderedIds.filter((id) => !validIds.has(id));

  if (invalidIds.length > 0) {
    throw new Error(`PBIs not found or don't belong to this client: ${invalidIds.join(', ')}`);
  }

  // Update positions using individual updates (id is the unique primary key)
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.pbi.update({
        where: { id },
        data: { stackPosition: index + 1 },
      })
    )
  );
}
