export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'mastery' | 'creation' | 'speed';
  xpReward: number;
}

export const ALL_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_review',
    name: 'First Spark',
    description: 'Review your very first flashcard with FSRS-4.5',
    icon: '⚡',
    category: 'mastery',
    xpReward: 25,
  },
  {
    id: 'deck_architect',
    name: 'Deck Architect',
    description: 'Create or AI-generate your first study deck',
    icon: '🏗️',
    category: 'creation',
    xpReward: 35,
  },
  {
    id: 'century_reviews',
    name: 'Century Club',
    description: 'Complete 100 total active recall reviews',
    icon: '💯',
    category: 'mastery',
    xpReward: 100,
  },
  {
    id: 'perfect_quiz',
    name: 'Flawless Victory',
    description: 'Score 100% accuracy on a Speed Quiz or Mock Test',
    icon: '🎯',
    category: 'mastery',
    xpReward: 50,
  },
  {
    id: 'streak_7_day',
    name: 'Electric Habit',
    description: 'Reach a continuous 7-day study streak',
    icon: '🔥',
    category: 'streak',
    xpReward: 75,
  },
  {
    id: 'streak_30_day',
    name: 'Unstoppable Momentum',
    description: 'Maintain a 30-day active learning streak',
    icon: '👑',
    category: 'streak',
    xpReward: 250,
  },
  {
    id: 'podium_champ',
    name: 'Podium Finisher',
    description: 'Claim 1st place in a live multiplayer quiz showdown',
    icon: '🏆',
    category: 'mastery',
    xpReward: 150,
  },
];
