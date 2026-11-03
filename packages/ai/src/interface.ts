import { z } from 'zod';
import {
  GeneratedCardSchema,
  GenerateCardsResponseSchema,
  CriticResponseSchema,
  ShortAnswerGradingSchema,
} from '@chizmo/core';

export type GeneratedCard = z.infer<typeof GeneratedCardSchema>;
export type GenerateCardsResponse = z.infer<typeof GenerateCardsResponseSchema>;
export type CriticResponse = z.infer<typeof CriticResponseSchema>;
export type ShortAnswerGrade = z.infer<typeof ShortAnswerGradingSchema>;

export interface GenerateCardsOptions {
  content: string;
  sourceType: 'TOPIC' | 'TEXT' | 'DOCUMENT';
  count?: number; // default ~10
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string;
  targetExam?: string;
}

export interface CriticOptions {
  cards: GeneratedCard[];
  sourceText?: string;
}

export interface SummarizeOptions {
  content: string;
  format: 'TLDR' | 'BULLETS' | 'CORNELL' | 'OUTLINE' | 'GLOSSARY' | 'ELI12' | 'CHEATSHEET';
  length?: 'short' | 'medium' | 'detailed';
}

export interface TutorChatOptions {
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  userQuestion: string;
  deckContext?: string;
  socraticMode?: boolean;
}

export interface AIProvider {
  name: string;
  generateFlashcards(options: GenerateCardsOptions): Promise<GenerateCardsResponse>;
  critiqueCards(options: CriticOptions): Promise<CriticResponse>;
  summarize(options: SummarizeOptions): Promise<{ summary: string; keyPoints: string[] }>;
  gradeShortAnswer(question: string, referenceAnswer: string, studentAnswer: string): Promise<ShortAnswerGrade>;
  tutorChat(options: TutorChatOptions): Promise<{ reply: string; citations?: string[] }>;
}
