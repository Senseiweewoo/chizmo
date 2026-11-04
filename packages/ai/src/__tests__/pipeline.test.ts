import { describe, it } from 'node:test';
import assert from 'node:assert';
import { chunkStudyText } from '../pipeline/chunker.js';
import { verifyCardGrounding } from '../pipeline/grounding.js';
import { deduplicateCards } from '../pipeline/dedupe.js';
import { validateCardHeuristics, applyCriticPass } from '../pipeline/critic.js';
import { runCardGenerationPipeline } from '../pipeline/card-generator.js';
import { MockAIProvider } from '../providers/mock.js';
import { GeneratedCard } from '../interface.js';

describe('AI Card Generation & Quality Pipeline Tests', () => {
  const sampleArticle = `
# Photosynthesis and Cellular Energetics

## Light-Dependent Reactions
In the thylakoid membranes of chloroplasts, chlorophyll pigments absorb solar photons.
Water molecules undergo photolysis, yielding protons, electrons, and releasing oxygen gas.
The energetic products synthesized are ATP and NADPH.

## Calvin Cycle (Light-Independent Reactions)
In the stroma of the chloroplast, RuBisCO fixes atmospheric carbon dioxide into 3-PGA.
ATP and NADPH are consumed to produce G3P, the foundational precursor to glucose synthesis.
`;

  it('1. Chunker splits long text along markdown headings with overlap', () => {
    const chunks = chunkStudyText(sampleArticle, { maxChunkChars: 200, overlapChars: 30 });
    assert(chunks.length >= 2, `Expected at least 2 chunks, got ${chunks.length}`);
    assert(chunks[0].text.length > 0);
  });

  it('2. Grounding verification validates true quotes and catches fabricated citations', () => {
    // True verbatim quote
    const trueQuote = 'RuBisCO fixes atmospheric carbon dioxide';
    const trueRes = verifyCardGrounding(trueQuote, sampleArticle);
    assert.strictEqual(trueRes.isGrounded, true);
    assert(trueRes.confidence >= 0.95);

    // Fabricated quote not in source
    const fakeQuote = 'Mitochondrial cristae produce 38 ATP per molecule of palmitate';
    const fakeRes = verifyCardGrounding(fakeQuote, sampleArticle);
    assert.strictEqual(fakeRes.isGrounded, false);
    assert(fakeRes.confidence < 0.5);
  });

  it('3. Dedupe pass drops exact duplicates and fuzzy near-duplicate prompts', () => {
    const rawCards: GeneratedCard[] = [
      {
        type: 'basic',
        front: 'What enzyme catalyzes carbon fixation in the Calvin cycle?',
        back: 'RuBisCO',
        difficulty: 'medium',
        tags: ['bio'],
      },
      {
        // Exact duplicate
        type: 'basic',
        front: 'What enzyme catalyzes carbon fixation in the Calvin cycle?',
        back: 'RuBisCO',
        difficulty: 'medium',
        tags: ['bio'],
      },
      {
        // Fuzzy near-duplicate (85%+ word overlap)
        type: 'basic',
        front: 'What enzyme catalyzes carbon fixation in Calvin cycle?',
        back: 'RuBisCO',
        difficulty: 'medium',
        tags: ['bio'],
      },
      {
        // Distinct question
        type: 'basic',
        front: 'Where does the Calvin cycle specifically occur?',
        back: 'The stroma of the chloroplast.',
        difficulty: 'easy',
        tags: ['bio'],
      },
    ];

    const { uniqueCards, droppedDuplicates } = deduplicateCards(rawCards, 0.75);
    assert.strictEqual(uniqueCards.length, 2, 'Should keep only 2 unique cards');
    assert.strictEqual(droppedDuplicates.length, 2, 'Should drop 2 duplicate cards');
  });

  it('4. Heuristic validation rejects cards violating atomicity or self-contained principles', () => {
    const goodCard: GeneratedCard = {
      type: 'basic',
      front: 'What is the primary product of water photolysis in chloroplasts?',
      back: 'Oxygen gas (O2), protons, and electrons.',
      difficulty: 'medium',
      tags: ['bio'],
    };
    assert.strictEqual(validateCardHeuristics(goodCard).passes, true);

    const badMetaCard: GeneratedCard = {
      type: 'basic',
      front: 'According to the text, what occurs in the thylakoid?',
      back: 'Light reactions.',
      difficulty: 'easy',
      tags: ['bio'],
    };
    assert.strictEqual(validateCardHeuristics(badMetaCard).passes, false);

    const verboseCard: GeneratedCard = {
      type: 'basic',
      front: 'Can you please explain in detail every single step and chemical reaction pathway involved in photosynthesis and cellular respiration?',
      back: 'Very long explanation...',
      difficulty: 'hard',
      tags: ['bio'],
    };
    assert.strictEqual(validateCardHeuristics(verboseCard).passes, false);
  });

  it('5. End-to-end card generation pipeline executes with full metrics and quality score', async () => {
    const provider = new MockAIProvider();
    const result = await runCardGenerationPipeline(
      sampleArticle,
      {
        content: sampleArticle,
        sourceType: 'TEXT',
        difficulty: 'medium',
        count: 5,
      },
      provider
    );

    assert(result.cards.length > 0, 'Pipeline must return verified cards');
    assert(result.stats.qualityScore > 0, 'Quality score must be calculated');
    assert.strictEqual(result.promptVersion, 'v1.0');
    // Verify each card has active recall properties
    for (const card of result.cards) {
      assert(card.front.length > 5);
      assert(card.back.length > 1);
    }
  });
});