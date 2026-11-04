import { NextRequest, NextResponse } from 'next/server';
import { z } from '@chizmo/core';
import { getCurrentSession } from '@/lib/auth/session';
import { getAIClient, runCardGenerationPipeline } from '@chizmo/ai';

const GenerateCardsRequestSchema = z.object({
  content: z.string().min(3, 'Content must be at least 3 characters').max(100000, 'Content exceeds 100KB limit'),
  sourceType: z.enum(['TOPIC', 'TEXT', 'DOCUMENT']).default('TOPIC'),
  targetExam: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  count: z.number().int().min(1).max(50).default(10),
  deckTitle: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const parsed = GenerateCardsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { content, sourceType, targetExam, difficulty, count } = parsed.data;

    const aiClient = getAIClient();
    const pipelineResult = await runCardGenerationPipeline(
      content,
      {
        content,
        sourceType,
        targetExam,
        difficulty,
        count,
      },
      aiClient
    );

    return NextResponse.json({
      success: true,
      userId,
      ...pipelineResult,
    });
  } catch (error: any) {
    console.error('AI Card Generation Pipeline failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Card generation failed. Please try again.' },
      { status: 500 }
    );
  }
}