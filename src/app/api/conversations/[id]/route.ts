import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/conversations/[id]
// Body: { userToken: string, status: 'ACCEPTED' | 'DECLINED' }
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    let body: { userToken?: string; status?: 'ACCEPTED' | 'DECLINED' };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Μη έγκυρα δεδομένα JSON.' },
        { status: 400 }
      );
    }

    const { userToken, status } = body;

    if (!userToken || !status || !['ACCEPTED', 'DECLINED'].includes(status)) {
      return NextResponse.json(
        { error: 'Απαιτείται έγκυρο userToken και κατάσταση (ACCEPTED ή DECLINED).' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        confession: {
          select: { id: true, content: true, category: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Η συνομιλία δεν βρέθηκε.' },
        { status: 404 }
      );
    }

    // Only participants can respond, and specifically only the recipient (user2Token)
    // or participant can accept/decline.
    if (conversation.user1Token !== userToken && conversation.user2Token !== userToken) {
      return NextResponse.json(
        { error: 'Δεν έχετε δικαίωμα τροποποίησης αυτής της συνομιλίας.' },
        { status: 403 }
      );
    }

    // Update status
    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        confession: {
          select: { id: true, content: true, category: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json({ conversation: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating conversation status:', error);
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή κατά την ενημέρωση της συνομιλίας.' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id]?token=<userToken>
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Το αναγνωριστικό χρήστη είναι απαραίτητο.' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Η συνομιλία δεν βρέθηκε.' },
        { status: 404 }
      );
    }

    if (conversation.user1Token !== token && conversation.user2Token !== token) {
      return NextResponse.json(
        { error: 'Δεν έχετε δικαίωμα διαγραφής αυτής της συνομιλίας.' },
        { status: 403 }
      );
    }

    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή κατά τη διαγραφή της συνομιλίας.' },
      { status: 500 }
    );
  }
}
