import { Worker, Job } from 'bullmq';
import { prisma } from '@chizmo/db';
import { getAIClient, runCardGenerationPipeline, MockAIProvider } from '@chizmo/ai';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('⚡ Starting Chizmo BullMQ Ingestion & Generation Worker...');

export interface IngestionJobData {
  sourceId: string;
  userId: string;
  type: string;
  content: string;
  settings?: {
    deckId?: string;
    title?: string;
    targetExam?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    cardTypes?: Array<'basic' | 'cloze' | 'mcq' | 'write'>;
  };
}

/**
 * BullMQ Content Ingestion & AI Generation Worker
 * Strict State Machine: PENDING -> EXTRACTING -> GENERATING -> READY (or FAILED)
 */
export const ingestionWorker = new Worker<IngestionJobData>(
  'content-ingestion',
  async (job: Job<IngestionJobData>) => {
    const { sourceId, userId, content, type, settings } = job.data;
    console.log(`[Worker] Processing ingestion job: ${job.id} for source ${sourceId} (user: ${userId})`);

    try {
      // 1. Update status to EXTRACTING
      await prisma.source.update({
        where: { id: sourceId },
        data: { status: 'EXTRACTING' },
      });

      // 2. Update status to GENERATING
      await prisma.source.update({
        where: { id: sourceId },
        data: { status: 'GENERATING' },
      });

      // 3. Run AI Content Generation & Quality Pipeline
      // (Chunking -> Generation -> Zod Validation -> Critic Pass -> Grounding -> Dedupe)
      const primaryClient = getAIClient();
      const fallbackClient = new MockAIProvider();

      const pipelineResult = await runCardGenerationPipeline(
        content,
        {
          content,
          sourceType: (type.toUpperCase() === 'TOPIC' ? 'TOPIC' : type.toUpperCase() === 'DOCUMENT' ? 'DOCUMENT' : 'TEXT'),
          targetExam: settings?.targetExam,
          difficulty: settings?.difficulty || 'medium',
        },
        primaryClient,
        fallbackClient
      );

      // 4. Resolve or create target Deck
      let deckId = settings?.deckId;
      if (!deckId) {
        const title = settings?.title || pipelineResult.topicSummary.slice(0, 60) || 'AI Generated Study Deck';
        const deck = await prisma.deck.create({
          data: {
            ownerId: userId,
            sourceId,
            title,
            description: `Auto-generated via AI critic pipeline. Quality Score: ${pipelineResult.stats.qualityScore}% (${pipelineResult.stats.finalCount} cards)`,
            visibility: 'PRIVATE',
            tags: ['ai-generated', type.toLowerCase()],
          },
        });
        deckId = deck.id;
      }

      // 5. Persist Cards & initialize decoupled CardState records
      let createdCardCount = 0;
      for (let i = 0; i < pipelineResult.cards.length; i++) {
        const c = pipelineResult.cards[i];
        const cardType = c.type || 'basic';
        const difficultyEstimate = c.difficulty === 'easy' ? 3 : c.difficulty === 'hard' ? 8 : 5;

        const card = await prisma.card.create({
          data: {
            deckId,
            type: cardType,
            front: c.front,
            back: c.back,
            choices: c.choices ? (c.choices as any) : undefined,
            correctIndex: c.correctIndex,
            hint: c.hint,
            explanation: c.explanation,
            sourceRef: c.sourceRef ? (c.sourceRef as any) : undefined,
            tags: c.tags || [],
            difficultyEstimate,
            position: i,
            createdBy: 'AI',
          },
        });

        // Separation of Content vs. Scheduling State
        await prisma.cardState.create({
          data: {
            userId,
            cardId: card.id,
            state: 'NEW',
            due: new Date(),
            stability: 0,
            difficulty: 0,
            reps: 0,
            lapses: 0,
          },
        });

        createdCardCount++;
      }

      // 6. Update Source status to READY
      await prisma.source.update({
        where: { id: sourceId },
        data: {
          status: 'READY',
          extractedText: content,
          error: null,
        },
      });

      console.log(`[Worker] Successfully generated ${createdCardCount} cards for source ${sourceId}`);
      return {
        deckId,
        cardCount: createdCardCount,
        qualityScore: pipelineResult.stats.qualityScore,
      };
    } catch (err: any) {
      console.error(`[Worker] Error processing source ${sourceId}:`, err);

      // Record failure state with user-friendly error
      await prisma.source.update({
        where: { id: sourceId },
        data: {
          status: 'FAILED',
          error: err?.message || 'Failed to process and generate flashcards from source material.',
        },
      }).catch((dbErr) => console.error(`[Worker] Failed to record error state for ${sourceId}:`, dbErr));

      throw err;
    }
  },
  {
    connection: { url: redisUrl },
    concurrency: 5,
  }
);

ingestionWorker.on('completed', (job) => {
  console.log(`✅ [Worker] Job ${job.id} completed successfully.`);
});

ingestionWorker.on('failed', (job, err) => {
  console.error(`❌ [Worker] Job ${job?.id} failed:`, err);
});
