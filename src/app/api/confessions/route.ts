import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkProfanity } from '@/lib/bad-words';
import { ConfessionCategory } from '@/types/confession';

const VALID_CATEGORIES: ConfessionCategory[] = ['Γενικά', 'ΠΑΜΑΚ', 'ΑΠΘ', 'ΔΙΠΑΕ', 'Events'];

// GET /api/confessions
// Query parameters: category (optional), sort (optional: 'newest' | 'likes'), userToken (optional)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryParam = searchParams.get('category');
    const sortParam = searchParams.get('sort') || 'newest';
    const userToken = searchParams.get('userToken') || undefined;

    const whereClause: { category?: string } = {};
    if (categoryParam && categoryParam !== 'All' && categoryParam !== 'Όλα' && categoryParam !== 'Γενικά') {
      whereClause.category = categoryParam;
    }

    const orderByClause =
      sortParam === 'likes'
        ? [{ likes: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const confessionsRaw = await prisma.confession.findMany({
      where: whereClause,
      orderBy: orderByClause,
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            likes: userToken ? { where: { userToken } } : false,
          },
        },
        pollVotes: userToken ? { where: { userToken } } : false,
        _count: {
          select: { comments: true },
        },
      },
    });

    const confessions = confessionsRaw.map((c) => {
      // Determine if current user voted on this poll
      const userVote = c.pollVotes && c.pollVotes.length > 0 ? c.pollVotes[0].selectedOption : null;

      // Group comments hierarchically
      const allComments = (c.comments || []).map((cmt) => ({
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

      // Map top-level comments and attach replies
      const topLevelComments: typeof allComments = [];
      const commentMap = new Map<string, typeof allComments[0]>();

      for (const cmt of allComments) {
        commentMap.set(cmt.id, cmt);
      }

      for (const cmt of allComments) {
        if (cmt.parentId && commentMap.has(cmt.parentId)) {
          commentMap.get(cmt.parentId)!.replies.push(cmt);
        } else {
          topLevelComments.push(cmt);
        }
      }

      const { pollVotes, ...rest } = c;

      return {
        ...rest,
        createdAt: c.createdAt.toISOString(),
        userVotedOption: userVote as 'A' | 'B' | null,
        comments: topLevelComments,
      };
    });

    return NextResponse.json({ confessions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching confessions:', error);
    return NextResponse.json(
      { error: 'Αποτυχία ανάκτησης των εξομολογήσεων. Παρακαλώ δοκιμάστε ξανά.' },
      { status: 500 }
    );
  }
}

// POST /api/confessions
// Body: { content: string, category: string, authorToken?: string, authorName?: string, authorAvatar?: string, isPoll?: boolean, pollOptionA?: string, pollOptionB?: string }
export async function POST(request: NextRequest) {
  try {
    let body: {
      content?: string;
      category?: string;
      authorToken?: string;
      authorName?: string;
      authorAvatar?: string;
      isPoll?: boolean;
      pollOptionA?: string;
      pollOptionB?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Μη έγκυρα δεδομένα JSON.' },
        { status: 400 }
      );
    }

    const {
      content,
      category,
      authorToken,
      authorName,
      authorAvatar,
      isPoll = false,
      pollOptionA,
      pollOptionB,
    } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Το κείμενο της δημοσίευσης είναι υποχρεωτικό.' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: 'Το μήνυμα δεν μπορεί να είναι κενό.' },
        { status: 400 }
      );
    }

    if (trimmedContent.length < 5) {
      return NextResponse.json(
        { error: 'Η δημοσίευση είναι πολύ μικρή (τουλάχιστον 5 χαρακτήρες).' },
        { status: 400 }
      );
    }

    if (trimmedContent.length > 300) {
      return NextResponse.json(
        { error: `Η δημοσίευση υπερβαίνει το όριο των 300 χαρακτήρων (${trimmedContent.length}/300).` },
        { status: 400 }
      );
    }

    // Validate category
    if (!category || !VALID_CATEGORIES.includes(category as ConfessionCategory)) {
      return NextResponse.json(
        { error: `Μη έγκυρη κατηγορία. Επιλέξτε μία από τις: ${VALID_CATEGORIES.join(', ')}.` },
        { status: 400 }
      );
    }

    // Bad words filter on content
    const profanityResult = checkProfanity(trimmedContent);
    if (profanityResult.hasProfanity) {
      return NextResponse.json(
        {
          error:
            'Η δημοσίευση περιέχει ακατάλληλη λέξη ή προσβλητικό περιεχόμενο. Παρακαλούμε διατηρήστε το περιεχόμενο κόσμιο!',
        },
        { status: 400 }
      );
    }

    // Validate Poll if enabled
    let optA: string | null = null;
    let optB: string | null = null;

    if (isPoll) {
      if (!pollOptionA || !pollOptionB) {
        return NextResponse.json(
          { error: 'Για τη δημοσκόπηση απαιτούνται και οι 2 επιλογές.' },
          { status: 400 }
        );
      }

      optA = pollOptionA.trim().slice(0, 50);
      optB = pollOptionB.trim().slice(0, 50);

      if (!optA || !optB) {
        return NextResponse.json(
          { error: 'Οι επιλογές της δημοσκόπησης δεν μπορούν να είναι κενές.' },
          { status: 400 }
        );
      }

      if (checkProfanity(optA).hasProfanity || checkProfanity(optB).hasProfanity) {
        return NextResponse.json(
          { error: 'Οι επιλογές της δημοσκόπησης περιέχουν ακατάλληλο περιεχόμενο.' },
          { status: 400 }
        );
      }
    }

    // Save to database
    const confession = await prisma.confession.create({
      data: {
        content: trimmedContent,
        category,
        likes: 0,
        authorToken: authorToken || null,
        authorName: authorName || 'Anonymous',
        authorAvatar: authorAvatar || '🦊',
        isPoll: Boolean(isPoll),
        pollOptionA: optA,
        pollOptionB: optB,
        pollVotesA: 0,
        pollVotesB: 0,
      },
      include: {
        comments: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Η δημοσίευση αναρτήθηκε επιτυχώς!',
        confession: {
          ...confession,
          createdAt: confession.createdAt.toISOString(),
          userVotedOption: null,
          comments: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating confession:', error);
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή κατά την αποθήκευση της δημοσίευσης.' },
      { status: 500 }
    );
  }
}
