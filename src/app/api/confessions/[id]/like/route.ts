import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/confessions/[id]/like
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Μη έγκυρο αναγνωριστικό (ID) εξομολόγησης.' },
        { status: 400 }
      );
    }

    // Atomically increment likes
    const updated = await prisma.confession.update({
      where: { id },
      data: {
        likes: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: updated.id,
        likes: updated.likes,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error?.code === 'P2025') {
      // Record not found in Prisma
      return NextResponse.json(
        { error: 'Η εξομολόγηση δεν βρέθηκε.' },
        { status: 404 }
      );
    }

    console.error('Error liking confession:', error);
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή κατά την προσθήκη like.' },
      { status: 500 }
    );
  }
}
