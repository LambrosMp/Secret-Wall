import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkProfanity } from '@/lib/bad-words';

// GET /api/conversations?token=<userToken>
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Το αναγνωριστικό χρήστη (token) είναι απαραίτητο.' },
        { status: 400 }
      );
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Token: token }, { user2Token: token }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        confession: {
          select: {
            id: true,
            content: true,
            category: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const formatted = conversations.map((conv) => ({
      ...conv,
      lastMessage: conv.messages[0] || null,
    }));

    return NextResponse.json({ conversations: formatted }, { status: 200 });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Σφάλμα κατά την ανάκτηση των συνομιλιών.' },
      { status: 500 }
    );
  }
}

// POST /api/conversations
// Body: { confessionId: string, userToken: string, userName: string, initialMessage?: string }
export async function POST(request: NextRequest) {
  try {
    let body: {
      confessionId?: string;
      userToken?: string;
      userName?: string;
      initialMessage?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Μη έγκυρα δεδομένα JSON.' },
        { status: 400 }
      );
    }

    const { confessionId, userToken, userName, initialMessage } = body;

    if (!confessionId || !userToken) {
      return NextResponse.json(
        { error: 'Τα πεδία confessionId και userToken είναι υποχρεωτικά.' },
        { status: 400 }
      );
    }

    // Find the confession to get author token
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
    });

    if (!confession) {
      return NextResponse.json(
        { error: 'Η εξομολόγηση δεν βρέθηκε.' },
        { status: 404 }
      );
    }

    const authorToken = confession.authorToken || `author_${confession.id.slice(-6)}`;
    const authorName = confession.authorName || 'Ανώνυμος Συντάκτης';

    // Cannot DM yourself
    if (confession.authorToken && confession.authorToken === userToken) {
      return NextResponse.json(
        { error: 'Δεν μπορείτε να στείλετε προσωπικό μήνυμα στη δική σας εξομολόγηση!' },
        { status: 400 }
      );
    }

    // Check if conversation already exists between these two users for this confession
    let conversation = await prisma.conversation.findFirst({
      where: {
        confessionId,
        OR: [
          { user1Token: userToken, user2Token: authorToken },
          { user1Token: authorToken, user2Token: userToken },
        ],
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

    if (!conversation) {
      // Create new conversation - Direct and immediately ACCEPTED (Free DMs)
      conversation = await prisma.conversation.create({
        data: {
          confessionId,
          user1Token: userToken,
          user1Name: userName || 'Anonymous Reader',
          user2Token: authorToken,
          user2Name: authorName,
          status: 'ACCEPTED',
        },
        include: {
          confession: {
            select: { id: true, content: true, category: true },
          },
          messages: true,
        },
      });
    } else if (conversation.status !== 'ACCEPTED') {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'ACCEPTED' },
        include: {
          confession: {
            select: { id: true, content: true, category: true },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    // If an initial message was provided, add it
    if (initialMessage && initialMessage.trim().length > 0) {
      const trimmedMsg = initialMessage.trim();
      const profanity = checkProfanity(trimmedMsg);
      if (profanity.hasProfanity) {
        return NextResponse.json(
          {
            error:
              'Το μήνυμα περιέχει ακατάλληλο περιεχόμενο. Παρακαλούμε διατηρήστε το κόσμιο!',
          },
          { status: 400 }
        );
      }

      const newMsg = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderToken: userToken,
          text: trimmedMsg,
        },
      });

      // Update conversation updatedAt
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      conversation.messages = [...(conversation.messages || []), newMsg];
    }

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή κατά την εκκίνηση της συνομιλίας.' },
      { status: 500 }
    );
  }
}
