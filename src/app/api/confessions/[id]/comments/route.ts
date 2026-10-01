import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkProfanity } from '@/lib/bad-words';

// GET /api/confessions/[id]/comments
// Query: ?userToken=...
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userToken = request.nextUrl.searchParams.get('userToken') || undefined;

    const allComments = await prisma.comment.findMany({
      where: { confessionId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        likes: userToken ? { where: { userToken } } : false,
      },
    });

    const formattedComments = allComments.map((cmt) => ({
      id: cmt.id,
      confessionId: cmt.confessionId,
      authorName: cmt.authorName,
      authorAvatar: cmt.authorAvatar,
      authorToken: cmt.authorToken,
      content: cmt.content,
      createdAt: cmt.createdAt.toISOString(),
      likesCount: cmt.likesCount,
      parentId: cmt.parentId,
      hasLiked: Boolean(cmt.likes && cmt.likes.length > 0),
      replies: [] as any[],
    }));

    const topLevel: typeof formattedComments = [];
    const map = new Map<string, typeof formattedComments[0]>();

    for (const c of formattedComments) {
      map.set(c.id, c);
    }

    for (const c of formattedComments) {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.replies.push(c);
      } else {
        topLevel.push(c);
      }
    }

    return NextResponse.json({ comments: topLevel }, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Σφάλμα κατά την ανάκτηση των σχολίων.' },
      { status: 500 }
    );
  }
}

// POST /api/confessions/[id]/comments
// Body: { content: string, authorName?: string, authorAvatar?: string, authorToken?: string, parentId?: string | null }
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: confessionId } = await context.params;

    let body: {
      content?: string;
      authorName?: string;
      authorAvatar?: string;
      authorToken?: string;
      parentId?: string | null;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Μη έγκυρα δεδομένα JSON.' },
        { status: 400 }
      );
    }

    const { content, authorName, authorAvatar, authorToken, parentId } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Το σχόλιο δεν μπορεί να είναι κενό.' },
        { status: 400 }
      );
    }

    const trimmed = content.trim();

    if (trimmed.length < 2) {
      return NextResponse.json(
        { error: 'Το σχόλιο είναι πολύ σύντομο (τουλάχιστον 2 χαρακτήρες).' },
        { status: 400 }
      );
    }

    if (trimmed.length > 300) {
      return NextResponse.json(
        { error: 'Το σχόλιο δεν μπορεί να υπερβαίνει τους 300 χαρακτήρες.' },
        { status: 400 }
      );
    }

    // Bad words check
    const profanityResult = checkProfanity(trimmed);
    if (profanityResult.hasProfanity) {
      return NextResponse.json(
        {
          error:
            'Το σχόλιο περιέχει ακατάλληλη λέξη ή προσβλητικό περιεχόμενο. Παρακαλούμε διατηρήστε το περιεχόμενο κόσμιο!',
        },
        { status: 400 }
      );
    }

    // Verify confession exists
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
    });

    if (!confession) {
      return NextResponse.json(
        { error: 'Η δημοσίευση δεν βρέθηκε.' },
        { status: 404 }
      );
    }

    // If parentId is specified, verify parent comment exists
    let validParentId: string | null = null;
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (parentComment && parentComment.confessionId === confessionId) {
        // If the target is already a reply, link to its top-level parent to avoid infinite nesting depth
        validParentId = parentComment.parentId || parentComment.id;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        confessionId,
        content: trimmed,
        authorName: authorName || 'Anonymous',
        authorAvatar: authorAvatar || '💬',
        authorToken: authorToken || 'anon_token',
        parentId: validParentId,
        likesCount: 0,
      },
    });

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          confessionId: comment.confessionId,
          authorName: comment.authorName,
          authorAvatar: comment.authorAvatar,
          authorToken: comment.authorToken,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          likesCount: 0,
          parentId: comment.parentId,
          hasLiked: false,
          replies: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή κατά την αποθήκευση του σχολίου.' },
      { status: 500 }
    );
  }
}
