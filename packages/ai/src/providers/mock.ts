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

export class MockAIProvider implements AIProvider {
  name = 'mock';

  async generateFlashcards(options: GenerateCardsOptions): Promise<GenerateCardsResponse> {
    const topic = options.content.slice(0, 50).trim();

    return {
      topicSummary: `Structured active-recall cards generated for: ${topic}`,
      cards: [
        {
          type: 'basic',
          front: `What is the primary core principle underlying ${topic}?`,
          back: `The foundational mechanism that defines its structural and functional properties.`,
          hint: 'Focus on the definition.',
          explanation: 'Essential concept for exam recall.',
          difficulty: 'medium',
          tags: ['fundamentals', 'exam-prep'],
          sourceRef: { quote: `Core concept from ${topic}` },
        },
        {
          type: 'mcq',
          front: `Which of the following best characterizes ${topic}?`,
          back: 'Option A: The scientifically verified mechanism',
          choices: [
            'Option A: The scientifically verified mechanism',
            'Option B: An unverified passive hypothesis',
            'Option C: A superseded historical model',
            'Option D: An unrelated peripheral phenomenon',
          ],
          correctIndex: 0,
          hint: 'Look for the active mechanism.',
          explanation: 'Plausible distractors test precision of understanding.',
          difficulty: 'medium',
          tags: ['multiple-choice'],
          sourceRef: { quote: `Distinction in ${topic}` },
        },
        {
          type: 'basic',
          front: `Why is active recall superior to passive review when mastering ${topic}?`,
          back: 'Active recall strengthens neural retrieval pathways and enhances synaptic plasticity.',
          hint: 'Think cognitive science and memory retrieval.',
          explanation: 'Testing effect demonstrated in cognitive psychology.',
          difficulty: 'hard',
          tags: ['learning-science'],
        },
        {
          type: 'cloze',
          front: `In ${topic}, retention rate increases exponentially when intervals are managed by [FSRS].`,
          back: 'FSRS (Free Spaced Repetition Scheduler)',
          hint: 'Spaced repetition algorithm acronym.',
          explanation: 'Calculates optimal review intervals based on stability.',
          difficulty: 'easy',
          tags: ['spaced-repetition'],
        },
      ],
    };
  }

  async critiqueCards(options: CriticOptions): Promise<CriticResponse> {
    return {
      evaluations: options.cards.map((_, idx) => ({
        cardIndex: idx,
        verdict: 'keep',
        reason: 'Atomic, grounded, and concise.',
      })),
    };
  }

  async summarize(options: SummarizeOptions): Promise<{ summary: string; keyPoints: string[] }> {
    return {
      summary: `Comprehensive ${options.format} breakdown of the provided material focusing on high-yield exam insights.`,
      keyPoints: [
        'Central core mechanism and definition.',
        'Primary structural dependencies and components.',
        'Key distinction from commonly confused concepts.',
      ],
    };
  }

  async gradeShortAnswer(
    question: string,
    referenceAnswer: string,
    studentAnswer: string
  ): Promise<ShortAnswerGrade> {
    const isLenientMatch = studentAnswer.trim().length > 3;
    return {
      verdict: isLenientMatch ? 'correct' : 'incorrect',
      score: isLenientMatch ? 1.0 : 0.0,
      feedback: isLenientMatch
        ? 'Great active recall! You accurately captured the key concepts.'
        : 'Incomplete response. Review the core definitions.',
      missingPoints: isLenientMatch ? [] : ['Key terminology missing'],
    };
  }

  async tutorChat(options: TutorChatOptions): Promise<{ reply: string; citations?: string[] }> {
    if (options.socraticMode) {
      return {
        reply: `That's a thoughtful question about "${options.userQuestion}". Before giving you the complete conclusion, what happens first when the process initiates? Think about the energy input. ⚡`,
        citations: ['Deck Card #1'],
      };
    }
    return {
      reply: `Here is the explanation for "${options.userQuestion}": The concept revolves around the interaction between the primary reactants and the resulting energy yield. Remember to structure your exam answers by stating the definition, the mechanism, and an example! 🦉`,
      citations: ['Deck Card #1'],
    };
  }
}
