---
name: ai-card-generation
description: >-
  Design prompts, JSON schemas, validation, and quality-control pipelines that turn raw study material (text, transcripts, slides, PDFs, topics) into good flashcards, quizzes, cloze cards, summaries, and grounded AI-tutor answers. Use this skill whenever the user is generating flashcards or quiz questions with an LLM, writing prompts for study content, building a critic or dedupe pass, grading short answers, or complaining that generated cards are vague, duplicated, wrong, or too long.
---

# AI Card Generation

Card quality decides whether students trust the app. Most failures come from asking the model for "20 flashcards" with no rules. Use a **generate -> validate -> critique -> dedupe -> review** pipeline.

## Card principles (put these in the system prompt)
- **Atomic**: one fact or concept per card.
- **Self-contained**: answerable without the source open; no "according to the text".
- **Unambiguous**: exactly one defensible answer.
- **Short**: front under ~25 words, back under ~40; split otherwise.
- **Active recall**: ask for production ("What causes...?") rather than recognition when possible.
- **Grounded**: every card cites where in the source it came from (page, slide, timestamp). If a fact is not in the source, don't make a card from it.
- **Good distractors** (multiple choice): plausible, same category, similar length, never "all of the above".

## Output schema (validate with Zod; retry once with the validation error on failure)
```ts
const Card = z.object({
  type: z.enum(["basic","cloze","mcq","true_false","short_answer","ordering","matching"]),
  front: z.string().min(3).max(300),
  back: z.string().min(1).max(500),
  choices: z.array(z.string()).optional(),      // mcq: include the correct one
  correctIndex: z.number().int().optional(),
  hint: z.string().max(150).optional(),
  explanation: z.string().max(400).optional(),
  sourceRef: z.object({ page: z.number().optional(), slide: z.number().optional(), startSec: z.number().optional(), quote: z.string().max(200) }),
  difficulty: z.enum(["easy","medium","hard"]),
  tags: z.array(z.string()).max(5)
})
```
Ask the model to return only JSON; strip code fences before parsing. Never `eval`; always parse then validate.

## Pipeline
1. **Chunk** the source by structure (headings, slides, chapters, ~800-1,500 tokens) so cards spread across the material instead of clustering at the start. Generate per chunk, in parallel with a concurrency cap.
2. **Generate** with settings: count (or "auto" = about 1 card per 150-250 words of dense content), difficulty, language, card types.
3. **Critic pass** (second model call, cheaper model is fine): for each card return `keep | fix | drop` with a reason. Drop vague, multi-concept, trivia, or unsupported-by-quote cards; fix wording.
4. **Verify grounding**: check the `quote` appears (fuzzy match) in the chunk text. Cards failing the check get dropped or flagged "unverified".
5. **Dedupe**: normalize text, hash exact duplicates; use embeddings (cosine > ~0.9) for near-duplicates within the deck.
6. **Review screen**: user can approve, edit, regenerate, delete before saving. Track edit rates; they are your best quality metric.

## Topic-only generation (no source)
Say plainly in the UI that content is AI-generated and may contain errors; add a "Report a mistake" button on each card. Structure output as units -> lessons -> cards. Prefer well-established facts and avoid precise statistics, dates, and quotes unless certain.

## Other generators
- **Summaries**: formats (TL;DR, bullets, Cornell, outline, glossary, ELI12, exam cheat sheet); each section links to source locations; offer "turn this into cards".
- **Short-answer grading**: give the model the question, reference answer, and student answer; return `{verdict: correct|partial|incorrect, feedback, missingPoints[]}`. Be lenient on wording, strict on facts. Cache results.
- **AI tutor**: ground in the user's deck/source via retrieval; offer a Socratic toggle; show citations; teach rather than just hand over homework answers; follow minors-safety-compliance for sensitive topics.

## Engineering notes
- Store prompts as versioned files (`prompts/card-gen.v3.md`) with 2-3 few-shot examples; log prompt version on every generation for A/B comparison.
- Cache by `hash(chunkText + settings + promptVersion)`.
- Set per-request token budgets and per-user quotas; fail gracefully with partial results.
- Provider-agnostic interface so models can be swapped; add a fallback provider on timeout/5xx.
- Evaluate with a fixed set of ~30 source passages and a rubric (atomic, grounded, unambiguous); rerun on every prompt change.

## Bad vs good
Bad: "Photosynthesis: explain." -> multi-concept, unanswerable precisely.
Good: front "What are the two main products of the light-dependent reactions?" back "ATP and NADPH (plus O2 released from water splitting)."
