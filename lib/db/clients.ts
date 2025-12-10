import prisma from '@/lib/prisma';
import type { Client, Prisma } from '@prisma/client';

/**
 * Create a new client
 */
export async function createClient(data: {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
}): Promise<Client> {
  return prisma.client.create({
    data: {
      name: data.name,
      slug: data.slug,
      logoUrl: data.logoUrl,
      description: data.description,
    },
  });
}

/**
 * Get client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
  return prisma.client.findUnique({
    where: { id },
  });
}

/**
 * Get client by slug
 */
export async function getClientBySlug(slug: string): Promise<Client | null> {
  return prisma.client.findUnique({
    where: { slug },
  });
}

/**
 * Get client with stats (PBI counts)
 */
export async function getClientWithStats(slug: string) {
  const client = await prisma.client.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          pbis: true,
          users: true,
        },
      },
    },
  });

  if (!client) return null;

  // Get PBI status counts
  const statusCounts = await prisma.pbi.groupBy({
    by: ['status'],
    where: { clientId: client.id },
    _count: true,
  });

  const stats = {
    totalPbis: client._count.pbis,
    totalUsers: client._count.users,
    todo: 0,
    inProgress: 0,
    done: 0,
    blocked: 0,
  };

  statusCounts.forEach((s) => {
    if (s.status === 'todo') stats.todo = s._count;
    if (s.status === 'in_progress') stats.inProgress = s._count;
    if (s.status === 'done') stats.done = s._count;
    if (s.status === 'blocked') stats.blocked = s._count;
  });

  return { ...client, stats };
}

/**
 * List all clients (for Flowency admin)
 */
export async function listClients(options?: {
  includeArchived?: boolean;
}): Promise<Client[]> {
  const where: Prisma.ClientWhereInput = {};

  if (!options?.includeArchived) {
    where.archivedAt = null;
  }

  return prisma.client.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

/**
 * List clients with stats (for dashboard)
 */
export async function listClientsWithStats() {
  const clients = await prisma.client.findMany({
    where: { archivedAt: null },
    include: {
      _count: {
        select: {
          pbis: true,
          users: true,
        },
      },
      pbis: {
        select: { status: true },
      },
      activities: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return clients.map((client) => {
    const statusCounts = {
      todo: 0,
      inProgress: 0,
      done: 0,
      blocked: 0,
    };

    client.pbis.forEach((pbi) => {
      if (pbi.status === 'todo') statusCounts.todo++;
      if (pbi.status === 'in_progress') statusCounts.inProgress++;
      if (pbi.status === 'done') statusCounts.done++;
      if (pbi.status === 'blocked') statusCounts.blocked++;
    });

    return {
      id: client.id,
      name: client.name,
      slug: client.slug,
      logoUrl: client.logoUrl,
      description: client.description,
      createdAt: client.createdAt,
      stats: {
        totalPbis: client._count.pbis,
        totalUsers: client._count.users,
        ...statusCounts,
      },
      lastActivity: client.activities[0]?.createdAt || client.createdAt,
    };
  });
}

/**
 * Update client
 */
export async function updateClient(
  id: string,
  data: {
    name?: string;
    slug?: string;
    logoUrl?: string;
    description?: string;
  }
): Promise<Client> {
  return prisma.client.update({
    where: { id },
    data,
  });
}

/**
 * Archive client (soft delete)
 */
export async function archiveClient(id: string): Promise<Client> {
  return prisma.client.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
}

/**
 * Restore archived client
 */
export async function restoreClient(id: string): Promise<Client> {
  return prisma.client.update({
    where: { id },
    data: { archivedAt: null },
  });
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.client.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!existing) return true;
  if (excludeId && existing.id === excludeId) return true;
  return false;
}

/**
 * Generate unique slug from name
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugAvailable(slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
