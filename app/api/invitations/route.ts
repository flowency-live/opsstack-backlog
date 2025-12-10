import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  createInvitation,
  hasPendingInvitation,
  getUserByEmail,
  getClientById,
} from '@/lib/db';
import type { UserRole } from '@prisma/client';

// POST /api/invitations - Create a new invitation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only flowency admins and client admins can invite
    if (
      session.user.role !== 'flowency_admin' &&
      session.user.role !== 'client_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, clientId, role } = body;

    if (!email || !clientId || !role) {
      return NextResponse.json(
        { error: 'email, clientId, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = ['client_admin', 'client_member'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be client_admin or client_member' },
        { status: 400 }
      );
    }

    // Check client exists
    const client = await getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Client admins can only invite to their own client
    if (
      session.user.role === 'client_admin' &&
      session.user.clientId !== clientId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser.clientId === clientId) {
      return NextResponse.json(
        { error: 'User is already a member of this client' },
        { status: 400 }
      );
    }

    // Check for pending invitation
    const hasPending = await hasPendingInvitation(email, clientId);
    if (hasPending) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email' },
        { status: 400 }
      );
    }

    const invitation = await createInvitation({
      email,
      clientId,
      role: role as UserRole,
      invitedBy: session.user.id,
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
