/**
 * Core Domain Types for Chizmo
 * Strictly pure definitions with zero external I/O
 */

export type LearnState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';

export type Rating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export type CardType =
  | 'basic'
  | 'cloze'
  | 'mcq'
  | 'true_false'
  | 'short_answer'
  | 'ordering'
  | 'matching';

export type CardDifficulty = 'easy' | 'medium' | 'hard';

export interface SourceReference {
  page?: number;
  slide?: number;
  startSec?: number;
  quote?: string;
  section?: string;
}

export interface Card {
  id: string;
  deckId: string;
  type: CardType;
  front: string;
  back: string;
  choices?: string[];
  correctIndex?: number;
  hint?: string;
  explanation?: string;
  sourceRef?: SourceReference;
  difficultyEstimate?: number; // 1-10
  tags: string[];
  position: number;
  createdBy: 'AI' | 'USER';
  contentHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardState {
  userId: string;
  cardId: string;
  state: LearnState;
  stability: number; // Days until R drops to 0.90
  difficulty: number; // 1.0 to 10.0 scale
  due: Date;
  lastReview?: Date;
  reps: number;
  lapses: number;
}

export interface ReviewLogEntry {
  id?: string;
  userId: string;
  cardId: string;
  rating: Rating;
  prevState: LearnState;
  elapsedDays: number;
  scheduledDays: number;
  responseMs?: number;
  reviewedAt: Date;
}

export interface QueueItem {
  card: Card;
  state: CardState;
  isNew: boolean;
  retrievability: number;
}

export interface FSRSWeights {
  w: number[]; // 17 parameters for FSRS-4.5
}

export interface FSRSConfig {
  requestRetention: number; // e.g. 0.90
  maximumInterval: number; // e.g. 36500 (100 years)
  w: number[];
  learningSteps: number[]; // In minutes, e.g. [1, 10]
}

export type StudyMode =
  | 'FLASHCARD'
  | 'QUIZ'
  | 'WRITE'
  | 'LEARN'
  | 'MATCH'
  | 'TEST'
  | 'WEAK_SPOTS';

export type SourceType =
  | 'TOPIC'
  | 'TEXT'
  | 'PDF'
  | 'PPTX'
  | 'DOCX'
  | 'YOUTUBE'
  | 'AUDIO'
  | 'IMAGE_OCR'
  | 'QUIZLET'
  | 'ANKI'
  | 'WEB_URL';

export type SourceStatus =
  | 'PENDING'
  | 'EXTRACTING'
  | 'GENERATING'
  | 'REVIEW'
  | 'READY'
  | 'FAILED';

export interface UserStats {
  xp: number;
  level: number;
  streakDays: number;
  streakFrozen: boolean;
  freezesRemaining: number;
  cardsStudiedToday: number;
  lastStudyDate?: string; // YYYY-MM-DD
}
