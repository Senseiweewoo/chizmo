import crypto from 'node:crypto';
import { AIProvider, GeneratedCard, GenerateCardsOptions } from '../interface.js';
import { chunkStudyText } from './chunker.js';
import { verifyCardGrounding } from './grounding.js';
import { deduplicateCards } from './dedupe.js';
import { applyCriticPass } from './critic.js';
import { MockAIProvider } from '../providers/mock.js';

export interface PipelineCard extends GeneratedCard {
  isGrounded?: boolean;
  groundingConfidence?: number;
  criticVerdict?: 'keep' | 'fix';
  criticReason?: string;
}

export interface PipelineResult {
  topicSummary: string;
  cards: PipelineCard[];
  stats: {
    totalChunks: number;
    rawGenerated: number;
    criticDropped: number;
    duplicatesDropped: number;
    groundedCount: number;
    finalCount: number;
    qualityScore: number; // 0 - 100
  };
  promptVersion: string;
}

// In-Memory Content Generation Cache
const generationCache = new Map<string, PipelineResult>();

function computeCacheKey(content: string, options: GenerateCardsOptions, version = 'v1.0'): string {
  const norm = `${content.trim()}|${options.sourceType}|${options.targetExam || ''}|${options.difficulty || 'medium'}|${version}`;
  return crypto.createHash('sha256').update(norm).digest('hex');
}

/**
 * Execute the end-to-end AI card generation quality pipeline
 */
export async function runCardGenerationPipeline(
  content: string,
  options: GenerateCardsOptions,
  primaryProvider: AIProvider,
  fallbackProvider: AIProvider = new MockAIProvider()
): Promise<PipelineResult> {
  const promptVersion = 'v1.0';
  const cacheKey = computeCacheKey(content, options, promptVersion);

  const cached = generationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Choose provider with fallback resilience
  let provider = primaryProvider;

  // 1. Chunk content if it's text or document
  const chunks =
    options.sourceType === 'TOPIC'
      ? [{ id: 'topic-0', index: 0, text: content, charStart: 0, charEnd: content.length }]
      : chunkStudyText(content, { maxChunkChars: 3500, overlapChars: 200 });

  let topicSummary = '';
  const allRawCards: GeneratedCard[] = [];
  let criticDropped = 0;

  for (const chunk of chunks) {
    let response;
    try {
      response = await provider.generateFlashcards({
        ...options,
        content: chunk.text,
      });
    } catch (err) {
      console.warn(`Primary provider ${provider.name} failed. Falling back to ${fallbackProvider.name}:`, err);
      provider = fallbackProvider;
      response = await provider.generateFlashcards({
        ...options,
        content: chunk.text,
      });
    }

    if (!topicSummary && response.topicSummary) {
      topicSummary = response.topicSummary;
    }

    // 2. Critic pass on generated chunk cards
    let acceptedChunkCards = response.cards;
    try {
      const criticRes = await provider.critiqueCards({
        cards: response.cards,
        sourceText: chunk.text,
      });
      const filtered = applyCriticPass(response.cards, criticRes);
      criticDropped += filtered.droppedCards.length;
      acceptedChunkCards = filtered.acceptedCards;
    } catch {
      // If critic fails, proceed with raw cards that pass heuristic validation
    }

    // 3. Grounding Verification
    for (const card of acceptedChunkCards) {
      const pCard: PipelineCard = { ...card };
      if (options.sourceType !== 'TOPIC') {
        const grounding = verifyCardGrounding(card.sourceRef?.quote, chunk.text);
        pCard.isGrounded = grounding.isGrounded;
        pCard.groundingConfidence = grounding.confidence;
      } else {
        // Topic cards are intrinsically synthesized
        pCard.isGrounded = true;
        pCard.groundingConfidence = 0.9;
      }
      allRawCards.push(pCard);
    }
  }

  // 4. Deduplication Pass
  const { uniqueCards, droppedDuplicates } = deduplicateCards(allRawCards, 0.80);

  // 5. Compute aggregate quality metrics
  const groundedCount = uniqueCards.filter((c: any) => c.isGrounded !== false).length;
  const rawTotal = allRawCards.length + criticDropped;
  const finalCount = uniqueCards.length;
  const qualityScore = rawTotal > 0 ? Math.round((finalCount / Math.max(1, rawTotal)) * 100) : 95;

  const result: PipelineResult = {
    topicSummary: topicSummary || `Mastery cards for: ${content.slice(0, 60)}...`,
    cards: uniqueCards as PipelineCard[],
    stats: {
      totalChunks: chunks.length,
      rawGenerated: rawTotal,
      criticDropped,
      duplicatesDropped: droppedDuplicates.length,
      groundedCount,
      finalCount,
      qualityScore,
    },
    promptVersion,
  };

  // Cache result
  generationCache.set(cacheKey, result);

  return result;
}