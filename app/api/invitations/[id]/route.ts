import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// DELETE /api/invitations/[id] - Cancel/delete an invitation
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

    // Get the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      select: { id: true, clientId: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check access - flowency admin or client admin of the same client
    if (
      session.user.role !== 'flowency_admin' &&
      (session.user.role !== 'client_admin' ||
        session.user.clientId !== invitation.clientId)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.invitation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to delete invitation' },
      { status: 500 }
    );
  }
}
