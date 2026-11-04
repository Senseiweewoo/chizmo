import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gradeTypedAnswer, levenshteinDistance } from '../scoring/write-grading.js';

describe('Write-It-Out Fuzzy Answer Grader Tests', () => {
  it('1. Exact match returns CORRECT with score 1.0', () => {
    const res = gradeTypedAnswer('Mitochondria', 'mitochondria');
    assert.equal(res.verdict, 'CORRECT');
    assert.equal(res.isAccepted, true);
    assert.equal(res.score, 1.0);
  });

  it('2. Minor 1-letter typo in long word is accepted as CLOSE with feedback', () => {
    // User typed "Mitochodria" (missing 'n')
    const res = gradeTypedAnswer('Mitochodria', 'Mitochondria');
    assert.equal(res.isAccepted, true);
    assert.ok(res.similarity >= 0.85);
    assert.ok(res.verdict === 'CORRECT' || res.verdict === 'CLOSE');
  });

  it('3. Completely wrong answer is rejected as INCORRECT', () => {
    const res = gradeTypedAnswer('Golgi Apparatus', 'Mitochondria');
    assert.equal(res.verdict, 'INCORRECT');
    assert.equal(res.isAccepted, false);
    assert.ok(res.score < 0.5);
  });

  it('4. Number mismatches are strictly penalized even if words match', () => {
    // If the answer is "1945" and user enters "1944"
    const res = gradeTypedAnswer('1944', '1945');
    assert.equal(res.isAccepted, false);
  });

  it('5. Computes Levenshtein distance accurately', () => {
    assert.equal(levenshteinDistance('kitten', 'sitting'), 3);
    assert.equal(levenshteinDistance('rosettacode', 'raisethysword'), 8);
    assert.equal(levenshteinDistance('', 'hello'), 5);
  });
});
