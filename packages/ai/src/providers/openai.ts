import {
  AIProvider,
  GenerateCardsOptions,
  GenerateCardsResponse,
  CriticOptions,
  CriticResponse,
  SummarizeOptions,
  ShortAnswerGrade,
  TutorChatOptions,
} from '../interface.js';
import {
  GenerateCardsResponseSchema,
  CriticResponseSchema,
  ShortAnswerGradingSchema,
} from '@chizmo/core';
import { CARD_GEN_PROMPT_V1, CRITIC_PROMPT_V1, TUTOR_PROMPT_V1 } from '../prompts/templates.js';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model = 'gpt-4o-mini') {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = model;
  }

  private async callChatCompletion(messages: Array<{ role: string; content: string }>, jsonMode = true): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error [${response.status}]: ${errText}`);
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
  }

  async generateFlashcards(options: GenerateCardsOptions): Promise<GenerateCardsResponse> {
    const raw = await this.callChatCompletion([
      { role: 'system', content: CARD_GEN_PROMPT_V1 },
      {
        role: 'user',
        content: `Target Subject/Content:\n${options.content}\n\nDifficulty: ${options.difficulty || 'medium'}\nLanguage: ${options.language || 'en'}`,
      },
    ]);

    const parsed = JSON.parse(raw);
    return GenerateCardsResponseSchema.parse(parsed);
  }

  async critiqueCards(options: CriticOptions): Promise<CriticResponse> {
    const raw = await this.callChatCompletion([
      { role: 'system', content: CRITIC_PROMPT_V1 },
      {
        role: 'user',
        content: `Evaluate these cards:\n${JSON.stringify(options.cards)}\nSource text:\n${options.sourceText || 'N/A'}`,
      },
    ]);

    const parsed = JSON.parse(raw);
    return CriticResponseSchema.parse(parsed);
  }

  async summarize(options: SummarizeOptions): Promise<{ summary: string; keyPoints: string[] }> {
    const raw = await this.callChatCompletion([
      {
        role: 'system',
        content: `You are an academic summarizer. Output JSON with { "summary": string, "keyPoints": string[] } in format: ${options.format}.`,
      },
      { role: 'user', content: options.content },
    ]);

    const parsed = JSON.parse(raw) as { summary?: string; keyPoints?: string[] };
    return {
      summary: parsed.summary || '',
      keyPoints: parsed.keyPoints || [],
    };
  }

  async gradeShortAnswer(
    question: string,
    referenceAnswer: string,
    studentAnswer: string
  ): Promise<ShortAnswerGrade> {
    const raw = await this.callChatCompletion([
      {
        role: 'system',
        content:
          'Grade the student short answer. Return JSON: { "verdict": "correct"|"partial"|"incorrect", "score": number between 0 and 1, "feedback": string, "missingPoints": string[] }',
      },
      {
        role: 'user',
        content: `Question: ${question}\nReference Answer: ${referenceAnswer}\nStudent Answer: ${studentAnswer}`,
      },
    ]);

    const parsed = JSON.parse(raw);
    return ShortAnswerGradingSchema.parse(parsed);
  }

  async tutorChat(options: TutorChatOptions): Promise<{ reply: string; citations?: string[] }> {
    const messages = [
      { role: 'system', content: TUTOR_PROMPT_V1 },
      ...(options.deckContext
        ? [{ role: 'system', content: `Current Study Material Context:\n${options.deckContext}` }]
        : []),
      ...options.history,
      { role: 'user', content: options.userQuestion },
    ];

    const reply = await this.callChatCompletion(messages, false);
    return { reply };
  }
}
