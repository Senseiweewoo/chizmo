import { GamificationEvent } from './reducer.js';

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  isCompleted: boolean;
  type: 'review_count' | 'session_complete' | 'accuracy_target' | 'deck_creator';
  icon: string;
}

/**
 * Generate 3 deterministic daily quests for a user based on date seed
 */
export function generateDailyQuests(dateStr: string): Quest[] {
  // Simple deterministic seed based on date string
  const hash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const pool: Quest[] = [
    {
      id: 'daily_10_reviews',
      title: 'Active Recaller',
      description: 'Review at least 10 cards with FSRS-4.5',
      target: 10,
      current: 0,
      xpReward: 30,
      isCompleted: false,
      type: 'review_count',
      icon: '⚡',
    },
    {
      id: 'session_finisher',
      title: 'Deck Finisher',
      description: 'Complete 1 entire study or quiz session',
      target: 1,
      current: 0,
      xpReward: 25,
      isCompleted: false,
      type: 'session_complete',
      icon: '🎯',
    },
    {
      id: 'high_accuracy',
      title: 'Precision Master',
      description: 'Finish a study session with >= 90% accuracy',
      target: 1,
      current: 0,
      xpReward: 40,
      isCompleted: false,
      type: 'accuracy_target',
      icon: '🏹',
    },
    {
      id: 'daily_25_reviews',
      title: 'Knowledge Vault',
      description: 'Review 25 cards across any deck',
      target: 25,
      current: 0,
      xpReward: 50,
      isCompleted: false,
      type: 'review_count',
      icon: '📚',
    },
  ];

  // Pick 3 quests pseudo-randomly but deterministically
  const q1 = pool[hash % pool.length];
  const q2 = pool[(hash + 1) % pool.length];
  const q3 = pool[(hash + 2) % pool.length];

  // Ensure unique IDs
  const uniqueQuests = [q1];
  if (!uniqueQuests.some((q) => q.id === q2.id)) uniqueQuests.push(q2);
  if (!uniqueQuests.some((q) => q.id === q3.id)) uniqueQuests.push(q3);

  // If duplicate picked, fill from pool
  for (const item of pool) {
    if (uniqueQuests.length >= 3) break;
    if (!uniqueQuests.some((q) => q.id === item.id)) {
      uniqueQuests.push(item);
    }
  }

  return uniqueQuests.slice(0, 3).map((q) => ({ ...q }));
}

/**
 * Pure function to advance quest progress given a domain event
 */
export function evaluateQuestProgress(
  quests: Quest[],
  event: GamificationEvent
): { updatedQuests: Quest[]; newlyEarnedXp: number } {
  let newlyEarnedXp = 0;

  const updatedQuests = quests.map((q) => {
    if (q.isCompleted) return q;

    let newCurrent = q.current;

    switch (q.type) {
      case 'review_count':
        if (event.type === 'CARD_REVIEWED') {
          newCurrent += 1;
        }
        break;

      case 'session_complete':
        if (event.type === 'SESSION_COMPLETED' || event.type === 'QUIZ_FINISHED') {
          newCurrent += 1;
        }
        break;

      case 'accuracy_target':
        if (
          event.type === 'SESSION_COMPLETED' &&
          event.correctCount / Math.max(1, event.cardsCount) >= 0.9
        ) {
          newCurrent += 1;
        }
        break;

      case 'deck_creator':
        if (event.type === 'DECK_CREATED') {
          newCurrent += 1;
        }
        break;
    }

    const isCompleted = newCurrent >= q.target;
    if (isCompleted && !q.isCompleted) {
      newlyEarnedXp += q.xpReward;
    }

    return {
      ...q,
      current: Math.min(q.target, newCurrent),
      isCompleted,
    };
  });

  return {
    updatedQuests,
    newlyEarnedXp,
  };
}
