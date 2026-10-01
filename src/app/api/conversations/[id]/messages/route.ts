import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkProfanity } from '@/lib/bad-words';

// GET /api/conversations/[id]/messages?token=<userToken>
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Το αναγνωριστικό χρήστη (token) είναι απαραίτητο.' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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

    // Verify user is a participant
    if (conversation.user1Token !== token && conversation.user2Token !== token) {
      return NextResponse.json(
        { error: 'Δεν έχετε δικαίωμα πρόσβασης σε αυτή τη συνομιλία.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        conversation,
        messages: conversation.messages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return NextResponse.json(
      { error: 'Σφάλμα κατά την ανάκτηση των μηνυμάτων.' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages
// Body: { senderToken: string, text: string }
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params;

    let body: { senderToken?: string; text?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Μη έγκυρα δεδομένα JSON.' },
        { status: 400 }
      );
    }

    const { senderToken, text } = body;

    if (!senderToken || !text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Το μήνυμα και το αναγνωριστικό αποστολέα είναι υποχρεωτικά.' },
        { status: 400 }
      );
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return NextResponse.json(
        { error: 'Το μήνυμα δεν μπορεί να είναι κενό.' },
        { status: 400 }
      );
    }

    if (trimmed.length > 500) {
      return NextResponse.json(
        { error: 'Το μήνυμα δεν μπορεί να υπερβαίνει τους 500 χαρακτήρες.' },
        { status: 400 }
      );
    }

    // Profanity check
    const profanity = checkProfanity(trimmed);
    if (profanity.hasProfanity) {
      return NextResponse.json(
        {
          error:
            'Το μήνυμα περιέχει ακατάλληλο περιεχόμενο. Παρακαλούμε διατηρήστε το κόσμιο!',
        },
        { status: 400 }
      );
    }

    // Verify conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Η συνομιλία δεν βρέθηκε.' },
        { status: 404 }
      );
    }

    if (conversation.user1Token !== senderToken && conversation.user2Token !== senderToken) {
      return NextResponse.json(
        { error: 'Δεν έχετε δικαίωμα αποστολής σε αυτή τη συνομιλία.' },
        { status: 403 }
      );
    }

    // Free DMs: Auto-ensure conversation is accepted
    if (conversation.status !== 'ACCEPTED') {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'ACCEPTED' },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderToken,
        text: trimmed,
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή κατά την αποστολή του μηνύματος.' },
      { status: 500 }
    );
  }
}
