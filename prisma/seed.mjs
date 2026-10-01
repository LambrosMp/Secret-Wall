import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleConfessions = [
  {
    content: 'Δίλημμα εξεταστικής: Ποια είναι η απόλυτη στρατηγική επιβίωσης πριν το τελικό διαγώνισμα;',
    category: 'Γενικά',
    likes: 72,
    authorToken: 'author-seed-poll',
    authorName: 'MidnightScholar #21',
    authorAvatar: '🦉',
    createdAt: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
    isPoll: true,
    pollOptionA: 'Πρωινό διάβασμα με καφέ',
    pollOptionB: 'Ολονυχτία (3:00 π.μ. mode)',
    pollVotesA: 42,
    pollVotesB: 67,
  },
  {
    content: 'Στο κυλικείο του ΠΑΜΑΚ στις 12:00 δεν βρίσκεις ούτε σκαμπό να κάτσεις. Όποιος κρατάει τραπέζι με μία μολυβοθήκη και φεύγει για 2 ώρες, σε βλέπω.',
    category: 'ΠΑΜΑΚ',
    likes: 34,
    authorToken: 'author-seed-pamak',
    authorName: 'NeonFox #18',
    authorAvatar: '🦊',
    createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    isPoll: false,
  },
  {
    content: 'Χάθηκα στα υπόγεια της Πολυτεχνικής προσπαθώντας να βρω το αμφιθέατρο 3. Βγήκα κατά λάθος στο τμήμα Αρχιτεκτόνων και απλά προσποιήθηκα ότι κοιτάζω μακέτες.',
    category: 'ΑΠΘ',
    likes: 62,
    authorToken: 'author-seed-auth',
    authorName: 'CosmicOwl #77',
    authorAvatar: '🦉',
    createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    isPoll: false,
  },
  {
    content: 'Το 52 για Σίνδο σήμερα το πρωί ήταν σαν κονσέρβα με σαρδέλες. Πώς ακριβώς θα αντέξουμε μέχρι την εξεταστική του Ιουνίου;',
    category: 'ΔΙΠΑΕ',
    likes: 49,
    authorToken: 'author-seed-dipae',
    authorName: 'GhostCoder #42',
    authorAvatar: '👻',
    createdAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    isPoll: false,
  },
  {
    content: 'Ποιοι ψήνονται για το μεγάλο πάρτι την Παρασκευή στα γρασίδια; Θα μαζευτούμε μεγάλη παρέα από νωρίς με μουσική και επιτραπέζια!',
    category: 'Events',
    likes: 88,
    authorToken: 'author-seed-events',
    authorName: 'StormPanda #99',
    authorAvatar: '🐼',
    createdAt: new Date(Date.now() - 1000 * 60 * 300), // 5 hours ago
    isPoll: false,
  },
];

async function main() {
  console.log('Seeding initial confessions, polls & nested comments into SQLite...');

  // Clean existing tables in correct order
  await prisma.commentLike.deleteMany({});
  await prisma.pollVote.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.confession.deleteMany({});

  for (const confession of sampleConfessions) {
    const created = await prisma.confession.create({
      data: confession,
    });
    console.log(`Created confession [${created.category}] (isPoll: ${created.isPoll}): ${created.id}`);

    // Sample comments & nested replies for ΠΑΜΑΚ
    if (created.category === 'ΠΑΜΑΚ') {
      const parentComment = await prisma.comment.create({
        data: {
          confessionId: created.id,
          authorName: 'PixelCat #07',
          authorAvatar: '🐱',
          authorToken: 'commenter-seed-1',
          content: 'Κλασικό ΠΑΜΑΚ! Ειδικά όταν έχει διάλειμμα στις μεγάλες αίθουσες δεν πέφτει καρφίτσα.',
          createdAt: new Date(Date.now() - 1000 * 60 * 25),
          likesCount: 6,
        },
      });

      // Nested reply 1
      await prisma.comment.create({
        data: {
          confessionId: created.id,
          authorName: 'CyberWolf #15',
          authorAvatar: '🐺',
          authorToken: 'commenter-seed-2',
          content: 'Και μη μιλήσουμε για την ουρά στον καφέ, φτάνει μέχρι έξω!',
          parentId: parentComment.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 18),
          likesCount: 3,
        },
      });

      // Nested reply 2
      await prisma.comment.create({
        data: {
          confessionId: created.id,
          authorName: 'NeonFox #18',
          authorAvatar: '🦊',
          authorToken: 'commenter-seed-3',
          content: 'Πραγματικά, καλύτερα να πάρεις θερμός από το σπίτι 😂',
          parentId: parentComment.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 10),
          likesCount: 2,
        },
      });
    }

    // Sample comments for ΑΠΘ
    if (created.category === 'ΑΠΘ') {
      await prisma.comment.create({
        data: {
          confessionId: created.id,
          authorName: 'ShadowWolf #12',
          authorAvatar: '🐺',
          authorToken: 'commenter-seed-4',
          content: 'Μην ανησυχείς, είμαι στο 4ο έτος και ακόμα συμβουλεύομαι χάρτη για τα κτίρια!',
          createdAt: new Date(Date.now() - 1000 * 60 * 60),
          likesCount: 4,
        },
      });
    }

    // Sample comments for Poll
    if (created.isPoll) {
      await prisma.comment.create({
        data: {
          confessionId: created.id,
          authorName: 'AstralNomad #83',
          authorAvatar: '🚀',
          authorToken: 'commenter-seed-5',
          content: 'Η ολονυχτία με lo-fi beats είναι άλλη εμπειρία, αλλά την επόμενη μέρα είσαι zombie!',
          createdAt: new Date(Date.now() - 1000 * 60 * 12),
          likesCount: 5,
        },
      });
    }
  }

  console.log('Seeding finished successfully with Campus Polls and Nested Comments!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
