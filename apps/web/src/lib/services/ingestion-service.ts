import { prisma } from '@chizmo/db';
import {
  cleanExtractedText,
  parseDelimitedCards,
  validateSafeUrl,
  extractYouTubeVideoId,
  formatCaptionsWithTimestamps,
  SourceStatus,
  SourceType,
} from '@chizmo/core';
import { getAIClient, runCardGenerationPipeline, PipelineResult } from '@chizmo/ai';
import { DeckService } from './deck-service';

export interface SourceRecord {
  id: string;
  userId: string;
  type: SourceType;
  url?: string | null;
  fileKey?: string | null;
  fileName?: string | null;
  status: SourceStatus;
  progress: number; // 0 - 100
  extractedText?: string | null;
  error?: string | null;
  settings?: any;
  result?: PipelineResult | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory Source Store for instant local / offline play
const inMemorySources = new Map<string, SourceRecord>();

export const IngestionService = {
  /**
   * Create an initial ingestion source in PENDING state
   */
  async createSource(userId: string, data: {
    type: SourceType;
    url?: string;
    fileKey?: string;
    fileName?: string;
    settings?: any;
  }): Promise<SourceRecord> {
    const id = `src-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();

    const record: SourceRecord = {
      id,
      userId,
      type: data.type,
      url: data.url || null,
      fileKey: data.fileKey || null,
      fileName: data.fileName || null,
      status: 'PENDING',
      progress: 0,
      extractedText: null,
      error: null,
      settings: data.settings || {},
      result: null,
      createdAt: now,
      updatedAt: now,
    };

    inMemorySources.set(id, record);

    try {
      await prisma.source.create({
        data: {
          id,
          userId,
          type: data.type as any,
          url: data.url,
          fileKey: data.fileKey,
          status: 'PENDING',
          settings: data.settings || {},
        },
      });
    } catch {
      // Offline fallback
    }

    return record;
  },

  /**
   * Get current source state and progress for polling
   */
  async getSource(sourceId: string, userId: string): Promise<SourceRecord | null> {
    const mem = inMemorySources.get(sourceId);
    if (mem) return mem;

    try {
      const db = await prisma.source.findUnique({
        where: { id: sourceId },
      });
      if (db) {
        return {
          id: db.id,
          userId: db.userId,
          type: db.type as any,
          url: db.url,
          fileKey: db.fileKey,
          status: db.status as any,
          progress: db.status === 'READY' || db.status === 'REVIEW' ? 100 : 50,
          extractedText: db.extractedText,
          error: db.error,
          settings: db.settings as any,
          createdAt: db.createdAt,
          updatedAt: db.updatedAt,
        };
      }
    } catch {
      // Fallback
    }

    return null;
  },

  /**
   * Run extraction and card generation pipeline through state machine
   */
  async processSource(sourceId: string, userId: string, rawInputText?: string): Promise<SourceRecord> {
    const source = inMemorySources.get(sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} not found`);
    }

    try {
      // Step 1: EXTRACTING (progress 20%)
      source.status = 'EXTRACTING';
      source.progress = 25;
      source.updatedAt = new Date();

      let extractedText = rawInputText || '';

      // Type-specific extraction logic
      if (source.type === 'YOUTUBE' && source.url) {
        const urlValidation = validateSafeUrl(source.url);
        if (!urlValidation.safe) {
          throw new Error(urlValidation.error || 'Unsafe YouTube URL');
        }

        const videoId = extractYouTubeVideoId(source.url);
        if (!videoId) {
          throw new Error('Could not identify valid YouTube Video ID from provided link');
        }

        // Simulate structured chaptered caption extraction
        extractedText = formatCaptionsWithTimestamps([
          { startSec: 0, durationSec: 30, text: `Introduction to ${source.settings?.topic || 'core topic'} and primary objectives.` },
          { startSec: 35, durationSec: 60, text: 'Fundamental mechanisms and key definitions governing the subject matter.' },
          { startSec: 100, durationSec: 75, text: 'Experimental proof and high-yield problem solving steps for exams.' },
          { startSec: 180, durationSec: 45, text: 'Conclusion and summary of essential concepts for active recall.' },
        ]);
      } else if (source.type === 'WEB_URL' && source.url) {
        const urlValidation = validateSafeUrl(source.url);
        if (!urlValidation.safe) {
          throw new Error(urlValidation.error || 'Unsafe import URL');
        }
        // Clean markdown text
        extractedText = cleanExtractedText(rawInputText || `Extracted web article summary from ${source.url}`);
      } else if (source.type === 'PDF' || source.type === 'PPTX' || source.type === 'DOCX' || source.type === 'IMAGE_OCR') {
        extractedText = cleanExtractedText(rawInputText || `High-yield lecture material extracted from ${source.fileName || 'uploaded document'}.`);
      }

      source.extractedText = extractedText;
      source.progress = 50;

      // Step 2: GENERATING (progress 60%)
      source.status = 'GENERATING';
      source.progress = 65;

      const aiClient = getAIClient();
      const pipelineResult = await runCardGenerationPipeline(
        extractedText,
        {
          content: extractedText,
          sourceType: 'TEXT',
          difficulty: source.settings?.difficulty || 'medium',
          targetExam: source.settings?.targetExam,
          count: source.settings?.count || 10,
        },
        aiClient
      );

      // Step 3: Transition to REVIEW (ready for user inspection)
      source.status = 'REVIEW';
      source.progress = 100;
      source.result = pipelineResult;
      source.updatedAt = new Date();

      // Persist to DB if available
      try {
        await prisma.source.update({
          where: { id: sourceId },
          data: {
            status: 'REVIEW',
            extractedText,
          },
        });
      } catch {
        // Offline fallback
      }

      return source;
    } catch (err: any) {
      source.status = 'FAILED';
      source.error = err.message || 'Extraction failed';
      source.progress = 0;
      source.updatedAt = new Date();
      throw err;
    }
  },

  /**
   * Direct Quizlet / Anki TSV/CSV deck import
   */
  async importQuizletAnkiDeck(userId: string, rawText: string, deckTitle?: string, explicitDelimiter?: string) {
    const parseResult = parseDelimitedCards(rawText, explicitDelimiter);
    if (parseResult.cards.length === 0) {
      throw new Error('No valid card pairs found in uploaded content. Ensure format is "Term [tab] Definition" or "Front, Back"');
    }

    const title = deckTitle || `Imported Deck (${parseResult.cards.length} cards)`;

    // 1. Create deck
    const deck = await DeckService.createDeck(userId, {
      title,
      description: `Imported from Quizlet/Anki (${parseResult.detectedDelimiter === '\t' ? 'TSV' : 'CSV'}) with active recall.`,
      tags: ['Imported', 'Flashcards'],
      color: '#10B981',
    });

    // 2. Add all cards
    for (const card of parseResult.cards) {
      await DeckService.addCard(deck.id, {
        front: card.front,
        back: card.back,
        tags: card.tags,
      });
    }

    return {
      success: true,
      deckId: deck.id,
      cardCount: parseResult.cards.length,
      delimiter: parseResult.detectedDelimiter,
    };
  },
};