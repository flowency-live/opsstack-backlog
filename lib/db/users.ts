import prisma from '@/lib/prisma';
import type { User, UserRole } from '@prisma/client';

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * List users for a client
 */
export async function listUsersByClient(clientId: string): Promise<User[]> {
  return prisma.user.findMany({
    where: { clientId },
    orderBy: { name: 'asc' },
  });
}

/**
 * List all Flowency admins
 */
export async function listFlowencyAdmins(): Promise<User[]> {
  return prisma.user.findMany({
    where: { role: 'flowency_admin' },
    orderBy: { name: 'asc' },
  });
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  data: {
    name?: string;
    avatarUrl?: string;
    role?: UserRole;
  }
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data,
  });
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}

/**
 * Create a Flowency admin user (for bootstrapping)
 */
export async function createFlowencyAdmin(data: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<User> {
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: 'flowency_admin',
      emailVerified: true,
    },
  });
}
