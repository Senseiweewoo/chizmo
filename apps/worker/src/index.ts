import { Worker, Job } from 'bullmq';
import { prisma } from '@chizmo/db';
import { getAIClient } from '@chizmo/ai';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('⚡ Starting Chizmo BullMQ Ingestion & Generation Worker...');

export interface IngestionJobData {
  sourceId: string;
  userId: string;
  type: string;
  content: string;
  settings?: any;
}

// Ingestion Worker Queue
export const ingestionWorker = new Worker<IngestionJobData>(
  'content-ingestion',
  async (job: Job<IngestionJobData>) => {
    const { sourceId, content } = job.data;
    console.log(`[Worker] Processing ingestion job: ${job.id} for source ${sourceId}`);

    // Update state to EXTRACTING
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: 'EXTRACTING' },
    });

    // Generate Cards
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: 'GENERATING' },
    });

    const ai = getAIClient();
    const result = await ai.generateFlashcards({
      content,
      sourceType: 'TEXT',
    });

    // Update state to READY
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: 'READY',
        extractedText: content,
      },
    });

    return { cardCount: result.cards.length };
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
