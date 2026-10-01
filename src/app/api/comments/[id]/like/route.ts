import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/comments/[id]/like
// Body: { userToken: string }
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await context.params;

    let body: {
      userToken?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Μη έγκυρα δεδομένα JSON.' },
        { status: 400 }
      );
    }

    const { userToken } = body;

    if (!userToken || typeof userToken !== 'string') {
      return NextResponse.json(
        { error: 'Απαιτείται αναγνωριστικό χρήστη (userToken).' },
        { status: 401 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Το σχόλιο δεν βρέθηκε.' },
        { status: 404 }
      );
    }

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userToken: {
          commentId,
          userToken,
        },
      },
    });

    if (existingLike) {
      // Toggle Unlike
      const [_, updated] = await prisma.$transaction([
        prisma.commentLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: {
            likesCount: { decrement: 1 },
          },
        }),
      ]);

      const finalCount = Math.max(0, updated.likesCount);

      return NextResponse.json(
        {
          liked: false,
          likesCount: finalCount,
        },
        { status: 200 }
      );
    } else {
      // Add Like
      const [_, updated] = await prisma.$transaction([
        prisma.commentLike.create({
          data: {
            commentId,
            userToken,
          },
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: {
            likesCount: { increment: 1 },
          },
        }),
      ]);

      return NextResponse.json(
        {
          liked: true,
          likesCount: updated.likesCount,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή κατά το like στο σχόλιο.' },
      { status: 500 }
    );
  }
}
