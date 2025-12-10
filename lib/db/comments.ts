import prisma from '@/lib/prisma';
import type { Comment } from '@prisma/client';

export type CommentWithUser = Comment & {
  user: { id: string; name: string; avatarUrl: string | null };
};

/**
 * Create a new comment
 */
export async function createComment(data: {
  pbiId: string;
  userId: string;
  content: string;
}): Promise<CommentWithUser> {
  return prisma.comment.create({
    data: {
      pbiId: data.pbiId,
      userId: data.userId,
      content: data.content,
    },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });
}

/**
 * Get comment by ID
 */
export async function getCommentById(
  id: string
): Promise<CommentWithUser | null> {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });
}

/**
 * List comments for a PBI
 */
export async function listCommentsByPbi(
  pbiId: string
): Promise<CommentWithUser[]> {
  return prisma.comment.findMany({
    where: { pbiId },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update comment
 */
export async function updateComment(
  id: string,
  content: string
): Promise<Comment> {
  return prisma.comment.update({
    where: { id },
    data: { content },
  });
}

/**
 * Delete comment
 */
export async function deleteComment(id: string): Promise<void> {
  await prisma.comment.delete({ where: { id } });
}

/**
 * Check if user owns comment
 */
export async function userOwnsComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
  return comment?.userId === userId;
}
