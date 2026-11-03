import { z } from 'zod';

export const CardTypeEnum = z.enum([
  'basic',
  'cloze',
  'mcq',
  'true_false',
  'short_answer',
  'ordering',
  'matching',
]);

export const SourceRefSchema = z.object({
  page: z.number().int().optional(),
  slide: z.number().int().optional(),
  startSec: z.number().optional(),
  quote: z.string().max(300).optional(),
  section: z.string().max(150).optional(),
});

export const GeneratedCardSchema = z.object({
  type: CardTypeEnum.default('basic'),
  front: z.string().min(3).max(300),
  back: z.string().min(1).max(500),
  choices: z.array(z.string().max(200)).max(6).optional(),
  correctIndex: z.number().int().min(0).max(5).optional(),
  hint: z.string().max(150).optional(),
  explanation: z.string().max(400).optional(),
  sourceRef: SourceRefSchema.optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tags: z.array(z.string().max(30)).max(5).default([]),
});

export const GenerateCardsResponseSchema = z.object({
  cards: z.array(GeneratedCardSchema),
  topicSummary: z.string().max(600).optional(),
});

export const CriticEvaluationSchema = z.object({
  cardIndex: z.number().int(),
  verdict: z.enum(['keep', 'fix', 'drop']),
  reason: z.string().max(200),
  fixedCard: GeneratedCardSchema.optional(),
});

export const CriticResponseSchema = z.object({
  evaluations: z.array(CriticEvaluationSchema),
});

export const ShortAnswerGradingSchema = z.object({
  verdict: z.enum(['correct', 'partial', 'incorrect']),
  score: z.number().min(0).max(1), // 0 to 1
  feedback: z.string().max(300),
  missingPoints: z.array(z.string()).max(5),
});

export const CreateDeckSchema = z.object({
  title: z.string().min(1, 'Deck title is required').max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']).default('PRIVATE'),
  language: z.string().default('en'),
  tags: z.array(z.string().max(30)).max(10).default([]),
  color: z.string().max(30).optional(),
  icon: z.string().max(30).optional(),
});

export const CreateCardSchema = z.object({
  deckId: z.string().min(1),
  type: CardTypeEnum.default('basic'),
  front: z.string().min(1, 'Front is required').max(500),
  back: z.string().min(1, 'Back is required').max(1000),
  choices: z.array(z.string()).optional(),
  correctIndex: z.number().int().optional(),
  hint: z.string().max(200).optional(),
  explanation: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
});

export const SubmitReviewSchema = z.object({
  cardId: z.string().min(1),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  responseMs: z.number().int().min(0).optional(),
});

export const UserSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2).max(50),
  birthYear: z.number().int().min(1920).max(2025).optional(),
  guestToken: z.string().optional(), // For upgrading guest accounts seamlessly
});

export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
