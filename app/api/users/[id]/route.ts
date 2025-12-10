import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserById, updateUser, deleteUser } from '@/lib/db';
import type { UserRole } from '@prisma/client';

// GET /api/users/[id] - Get user details
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
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check access
    if (
      session.user.role !== 'flowency_admin' &&
      session.user.id !== id &&
      session.user.clientId !== user.clientId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user
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
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, avatarUrl, role } = body;

    // Check access for role changes
    if (role !== undefined) {
      // Only flowency admins can change roles
      if (session.user.role !== 'flowency_admin') {
        return NextResponse.json(
          { error: 'Only Flowency admins can change user roles' },
          { status: 403 }
        );
      }

      // Can't change a flowency admin's role
      if (user.role === 'flowency_admin') {
        return NextResponse.json(
          { error: 'Cannot change Flowency admin roles' },
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
    }

    // Check access for other changes
    if (name !== undefined || avatarUrl !== undefined) {
      // Users can update their own name/avatar, admins can update anyone
      if (
        session.user.role !== 'flowency_admin' &&
        session.user.id !== id
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const updateData: { name?: string; avatarUrl?: string; role?: UserRole } = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (role !== undefined) updateData.role = role as UserRole;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updated = await updateUser(id, updateData);

    // Remove sensitive data
    const { passwordHash, ...safeUser } = updated;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only flowency admins can delete users
    if (session.user.role !== 'flowency_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Can't delete yourself
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Can't delete other flowency admins
    if (user.role === 'flowency_admin') {
      return NextResponse.json(
        { error: 'Cannot delete Flowency admin accounts' },
        { status: 400 }
      );
    }

    await deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
