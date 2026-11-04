import { NextRequest, NextResponse } from 'next/server';
import { gradeTypedAnswer } from '@chizmo/core';
import { getAIClient } from '@chizmo/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userAnswer, question } = body;
    const referenceAnswer = body.referenceAnswer || body.expectedAnswer || body.back;

    if (!userAnswer || !referenceAnswer) {
      return NextResponse.json(
        { success: false, error: 'userAnswer and referenceAnswer are required' },
        { status: 400 }
      );
    }

    // 1. Fast local algorithmic grading with typo tolerance
    const localResult = gradeTypedAnswer(userAnswer, referenceAnswer);

    // If completely clear or exact, return immediately (<10ms latency)
    if (localResult.verdict === 'CORRECT' || (localResult.verdict === 'INCORRECT' && localResult.similarity < 0.3)) {
      return NextResponse.json({
        success: true,
        ...localResult,
      });
    }

    // 2. Semantic LLM leniency check for nuanced or multi-concept answers
    try {
      const ai = getAIClient();
      const aiGrade = await ai.gradeShortAnswer(
        question || 'Target flashcard concept',
        referenceAnswer,
        userAnswer
      );

      return NextResponse.json({
        success: true,
        verdict: aiGrade.verdict.toUpperCase(),
        isAccepted: aiGrade.verdict === 'correct' || aiGrade.verdict === 'partial',
        score: aiGrade.score,
        similarity: localResult.similarity,
        feedback: aiGrade.feedback || localResult.feedback,
      });
    } catch {
      // Fallback to local heuristic result
      return NextResponse.json({
        success: true,
        ...localResult,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Grading failed' },
      { status: 500 }
    );
  }
}