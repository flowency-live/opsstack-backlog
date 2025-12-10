import prisma from '@/lib/prisma';
import type { Invitation, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';

export type InvitationWithDetails = Invitation & {
  client: { name: string };
  inviter: { name: string };
};

/**
 * Create invitation
 */
export async function createInvitation(data: {
  email: string;
  clientId: string;
  role: UserRole;
  invitedBy: string;
  expiresInDays?: number;
}): Promise<Invitation> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

  return prisma.invitation.create({
    data: {
      email: data.email.toLowerCase(),
      clientId: data.clientId,
      role: data.role,
      token,
      invitedBy: data.invitedBy,
      expiresAt,
    },
  });
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(
  token: string
): Promise<InvitationWithDetails | null> {
  return prisma.invitation.findUnique({
    where: { token },
    include: {
      client: { select: { name: true } },
      inviter: { select: { name: true } },
    },
  });
}

/**
 * List pending invitations for a client
 */
export async function listPendingInvitationsByClient(
  clientId: string
): Promise<InvitationWithDetails[]> {
  return prisma.invitation.findMany({
    where: {
      clientId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      client: { select: { name: true } },
      inviter: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * List all invitations for a client (for admin view)
 */
export async function listInvitationsByClient(
  clientId: string
): Promise<InvitationWithDetails[]> {
  return prisma.invitation.findMany({
    where: { clientId },
    include: {
      client: { select: { name: true } },
      inviter: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Check if invitation exists for email + client
 */
export async function hasPendingInvitation(
  email: string,
  clientId: string
): Promise<boolean> {
  const invitation = await prisma.invitation.findFirst({
    where: {
      email: email.toLowerCase(),
      clientId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  return !!invitation;
}

/**
 * Delete invitation
 */
export async function deleteInvitation(id: string): Promise<void> {
  await prisma.invitation.delete({ where: { id } });
}

/**
 * Clean up expired invitations
 */
export async function cleanupExpiredInvitations(): Promise<number> {
  const result = await prisma.invitation.deleteMany({
    where: {
      acceptedAt: null,
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}
