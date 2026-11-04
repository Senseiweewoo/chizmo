/**
 * Write-It-Out Fuzzy Answer Grader
 * Evaluates typed user answers against reference answers with typo tolerance and semantic leniency.
 */

export interface WriteGradeResult {
  verdict: 'CORRECT' | 'CLOSE' | 'INCORRECT';
  isAccepted: boolean;
  score: number; // 0.0 to 1.0
  similarity: number; // 0.0 to 1.0
  feedback: string;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Compute Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Grade typed answer against target reference answer
 */
export function gradeTypedAnswer(userAnswer: string, referenceAnswer: string): WriteGradeResult {
  const normUser = normalize(userAnswer);
  const normRef = normalize(referenceAnswer);

  if (normUser.length === 0) {
    return {
      verdict: 'INCORRECT',
      isAccepted: false,
      score: 0,
      similarity: 0,
      feedback: 'No answer entered.',
    };
  }

  // 1. Exact match
  if (normUser === normRef) {
    return {
      verdict: 'CORRECT',
      isAccepted: true,
      score: 1.0,
      similarity: 1.0,
      feedback: 'Spot on! Exactly correct.',
    };
  }

  // 2. Substring match (user included full target fact or target is within user sentence)
  if (normUser.includes(normRef) || (normRef.length > 5 && normUser.length > 5 && normRef.includes(normUser))) {
    return {
      verdict: 'CORRECT',
      isAccepted: true,
      score: 1.0,
      similarity: 0.95,
      feedback: 'Correct! Target concept identified.',
    };
  }

  // 3. Typo tolerance via Levenshtein distance
  const maxLen = Math.max(normUser.length, normRef.length);
  const dist = levenshteinDistance(normUser, normRef);
  const similarity = Number((1 - dist / maxLen).toFixed(2));

  // Allow 1 typo for 5-8 chars, 2 typos for 9+ chars
  const allowedTypos = normRef.length <= 4 ? 0 : normRef.length <= 8 ? 1 : 2;

  if (dist <= allowedTypos) {
    return {
      verdict: 'CLOSE',
      isAccepted: true,
      score: 0.9,
      similarity,
      feedback: `Accepted (minor typo)! Correct spelling: "${referenceAnswer}".`,
    };
  }

  // 4. Token overlap (for multi-word answers)
  const userTokens = new Set(normUser.split(' '));
  const refTokens = new Set(normRef.split(' '));
  let matchCount = 0;
  for (const token of refTokens) {
    if (userTokens.has(token)) matchCount++;
  }
  const tokenOverlap = matchCount / refTokens.size;

  if (tokenOverlap >= 0.75) {
    return {
      verdict: 'CORRECT',
      isAccepted: true,
      score: 0.85,
      similarity: Number(tokenOverlap.toFixed(2)),
      feedback: `Great job! Full target: "${referenceAnswer}".`,
    };
  } else if (tokenOverlap >= 0.5) {
    return {
      verdict: 'CLOSE',
      isAccepted: false,
      score: 0.5,
      similarity: Number(tokenOverlap.toFixed(2)),
      feedback: `Partially correct. The expected answer is: "${referenceAnswer}".`,
    };
  }

  return {
    verdict: 'INCORRECT',
    isAccepted: false,
    score: 0,
    similarity: Math.max(0, similarity),
    feedback: `Incorrect. The correct answer is: "${referenceAnswer}".`,
  };
}