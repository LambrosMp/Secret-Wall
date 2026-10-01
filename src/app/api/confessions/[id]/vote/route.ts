import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/confessions/[id]/vote
// Body: { option: 'A' | 'B', userToken: string }
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    let body: {
      option?: string;
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

    const { option, userToken } = body;

    if (!userToken || typeof userToken !== 'string') {
      return NextResponse.json(
        { error: 'Απαιτείται αναγνωριστικό χρήστη (userToken).' },
        { status: 401 }
      );
    }

    if (option !== 'A' && option !== 'B') {
      return NextResponse.json(
        { error: 'Μη έγκυρη επιλογή. Επιτρέπεται μόνο "A" ή "B".' },
        { status: 400 }
      );
    }

    const confession = await prisma.confession.findUnique({
      where: { id },
    });

    if (!confession) {
      return NextResponse.json(
        { error: 'Η δημοσίευση δεν βρέθηκε.' },
        { status: 404 }
      );
    }

    if (!confession.isPoll) {
      return NextResponse.json(
        { error: 'Αυτή η δημοσίευση δεν περιέχει δημοσκόπηση.' },
        { status: 400 }
      );
    }

    // Check if user already voted
    const existing = await prisma.pollVote.findUnique({
      where: {
        confessionId_userToken: {
          confessionId: id,
          userToken,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'Έχετε ήδη ψηφίσει σε αυτή τη δημοσκόπηση.',
          pollVotesA: confession.pollVotesA,
          pollVotesB: confession.pollVotesB,
          userVotedOption: existing.selectedOption,
        },
        { status: 409 }
      );
    }

    // Save vote & increment counter atomically
    const [_, updatedConfession] = await prisma.$transaction([
      prisma.pollVote.create({
        data: {
          confessionId: id,
          userToken,
          selectedOption: option,
        },
      }),
      prisma.confession.update({
        where: { id },
        data: {
          pollVotesA: option === 'A' ? { increment: 1 } : undefined,
          pollVotesB: option === 'B' ? { increment: 1 } : undefined,
        },
      }),
    ]);

    return NextResponse.json(
      {
        message: 'Η ψήφος σας καταχωρήθηκε!',
        pollVotesA: updatedConfession.pollVotesA,
        pollVotesB: updatedConfession.pollVotesB,
        userVotedOption: option,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error voting in poll:', error);
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή κατά την καταχώρηση της ψήφου.' },
      { status: 500 }
    );
  }
}
