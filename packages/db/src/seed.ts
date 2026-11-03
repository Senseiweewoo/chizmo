import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

function hashContent(front: string, back: string): string {
  return crypto.createHash('sha256').update(`${front.trim()}|${back.trim()}`).digest('hex');
}

async function main() {
  console.log('⚡ Starting Chizmo database seed...');

  // 1. Seed Core Achievements
  const achievements = [
    {
      id: 'first_deck',
      name: 'Deck Architect',
      description: 'Created your very first study deck.',
      icon: 'sparkles',
      xpReward: 50,
    },
    {
      id: 'streak_7_day',
      name: 'Unstoppable Momentum',
      description: 'Maintained a 7-day study streak.',
      icon: 'flame',
      xpReward: 100,
    },
    {
      id: 'review_100_cards',
      name: 'Centurion Scholar',
      description: 'Completed 100 flashcard reviews.',
      icon: 'zap',
      xpReward: 75,
    },
    {
      id: 'perfect_quiz',
      name: 'Sharp Shooter',
      description: 'Scored 100% on any practice quiz.',
      icon: 'target',
      xpReward: 60,
    },
    {
      id: 'podium_champ',
      name: 'Live Podium King',
      description: 'Won 1st place in a live multiplayer match.',
      icon: 'trophy',
      xpReward: 150,
    },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { id: ach.id },
      update: ach,
      create: ach,
    });
  }
  console.log(`✅ Seeded ${achievements.length} achievements.`);

  // 2. Seed Demo User
  const demoEmail = 'demo@chizmo.app';
  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      displayName: 'Alex Scholar',
      isGuest: false,
      birthYear: 2007, // 17 years old
      timezone: 'America/New_York',
      dayRolloverHour: 4,
      profile: {
        create: {
          bio: 'Prepping for AP Biology and SAT exams with Chizmo! ⚡',
          targetExams: ['AP Biology', 'SAT Math & Verbal'],
          studyGoalMins: 20,
          soundEnabled: true,
          hapticsEnabled: true,
        },
      },
      subscription: {
        create: {
          plan: 'PRO',
          status: 'ACTIVE',
        },
      },
      entitlement: {
        create: {
          dailyGenerationsUsed: 0,
          maxDecks: 100,
          maxUploadMb: 100,
        },
      },
    },
  });

  console.log(`✅ Created Demo User: ${demoUser.email} (${demoUser.id})`);

  // 3. Seed AP Biology Deck
  const bioCards = [
    {
      front: 'What are the two primary energetic products of the light-dependent reactions of photosynthesis?',
      back: 'ATP and NADPH (oxygen is also released as a byproduct from water photolysis).',
      type: 'basic' as const,
      difficultyEstimate: 6,
      tags: ['photosynthesis', 'biochemistry', 'ap-bio'],
      sourceRef: { page: 142, quote: 'Light reactions generate ATP and NADPH to power the Calvin Cycle.' },
    },
    {
      front: 'Where specifically in eukaryotic cells does the Krebs (citric acid) cycle take place?',
      back: 'The mitochondrial matrix.',
      type: 'basic' as const,
      difficultyEstimate: 4,
      tags: ['cellular-respiration', 'mitochondria'],
      sourceRef: { page: 155, quote: 'The citric acid cycle occurs within the mitochondrial matrix.' },
    },
    {
      front: 'Which enzyme is responsible for catalyzing the fixation of carbon dioxide in the Calvin cycle?',
      back: 'RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase).',
      type: 'basic' as const,
      difficultyEstimate: 7,
      tags: ['calvin-cycle', 'enzymes'],
      sourceRef: { page: 147, quote: 'RuBisCO fixes inorganic carbon into 3-PGA.' },
    },
    {
      front: 'What serves as the final electron acceptor in the aerobic electron transport chain?',
      back: 'Molecular Oxygen (O₂), which combines with protons to form water (H₂O).',
      type: 'basic' as const,
      difficultyEstimate: 5,
      tags: ['electron-transport', 'respiration'],
      sourceRef: { page: 162, quote: 'Oxygen accepts electrons at complex IV, producing water.' },
    },
  ];

  const bioDeck = await prisma.deck.create({
    data: {
      ownerId: demoUser.id,
      title: 'AP Biology: Cellular Respiration & Photosynthesis',
      description: 'High-yield conceptual cards covering bioenergetics, light reactions, and oxidative phosphorylation.',
      visibility: 'PUBLIC',
      language: 'en',
      color: '#10B981',
      icon: 'leaf',
      tags: ['biology', 'ap-exam', 'science'],
      cards: {
        create: bioCards.map((c, idx) => ({
          ...c,
          position: idx,
          contentHash: hashContent(c.front, c.back),
          createdBy: 'AI',
        })),
      },
    },
    include: { cards: true },
  });

  console.log(`✅ Created AP Biology Deck with ${bioDeck.cards.length} cards.`);

  // 4. Seed SAT Vocabulary Deck
  const satCards = [
    {
      front: 'Ephemeral',
      back: 'Lasting for a very short time; fleeting or transitory.',
      hint: 'Think of ephemera or a fleeting blossom.',
      type: 'basic' as const,
      difficultyEstimate: 4,
      tags: ['sat-vocab', 'adjectives'],
    },
    {
      front: 'Ubiquitous',
      back: 'Present, appearing, or found everywhere; omnipresent.',
      hint: 'Smartphones in modern classrooms.',
      type: 'basic' as const,
      difficultyEstimate: 5,
      tags: ['sat-vocab', 'adjectives'],
    },
    {
      front: 'Pragmatic',
      back: 'Dealing with things sensibly and realistically based on practical rather than theoretical considerations.',
      hint: 'Practical and grounded.',
      type: 'basic' as const,
      difficultyEstimate: 4,
      tags: ['sat-vocab', 'adjectives'],
    },
  ];

  const satDeck = await prisma.deck.create({
    data: {
      ownerId: demoUser.id,
      title: 'SAT High-Yield Vocabulary',
      description: 'Essential recurring adjectives, verbs, and tonal words for the Digital SAT Reading & Writing section.',
      visibility: 'PUBLIC',
      language: 'en',
      color: '#6366F1',
      icon: 'book-open',
      tags: ['sat', 'vocabulary', 'english'],
      cards: {
        create: satCards.map((c, idx) => ({
          ...c,
          position: idx,
          contentHash: hashContent(c.front, c.back),
          createdBy: 'AI',
        })),
      },
    },
    include: { cards: true },
  });

  console.log(`✅ Created SAT Deck with ${satDeck.cards.length} cards.`);

  // 5. Seed FSRS CardStates for Demo User
  const now = new Date();
  for (const card of bioDeck.cards) {
    await prisma.cardState.create({
      data: {
        userId: demoUser.id,
        cardId: card.id,
        state: 'REVIEW',
        stability: 4.8,
        difficulty: 5.2,
        due: now, // Due today!
        lastReview: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        reps: 3,
        lapses: 0,
      },
    });

    await prisma.reviewLog.create({
      data: {
        userId: demoUser.id,
        cardId: card.id,
        rating: 3, // Good
        prevState: 'LEARNING',
        elapsedDays: 4.0,
        scheduledDays: 4.8,
        responseMs: 2400,
        reviewedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 6. Seed demo streak day
  await prisma.streakDay.create({
    data: {
      userId: demoUser.id,
      date: now,
      xp: 65,
      reviews: 12,
      isFrozen: false,
    },
  });

  console.log('✨ Chizmo database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
