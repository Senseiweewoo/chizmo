/**
 * Safety & Crisis Detector
 * Detects indicators of self-harm, severe distress, or emergency in study conversations.
 * Immediately overrides standard LLM output with compassionate support and verified 24/7 crisis hotlines.
 */

export interface CrisisEvaluation {
  isCrisis: boolean;
  crisisType?: 'SELF_HARM' | 'SEVERE_DISTRESS';
  compassionateResponse?: string;
  hotlines: Array<{
    name: string;
    contact: string;
    detail: string;
  }>;
}

const CRISIS_PATTERNS = [
  /\b(kill|harm|cut|end)\s+(my\s*self|my\s*life|everything)\b/i,
  /\b(suicide|suicidal|want\s+to\s+die|wish\s+i\s+was\s+dead|don'?t\s+want\s+to\s+live)\b/i,
  /\b(hang\s+myself|overdose\s+on|slit\s+my\s*wrists)\b/i,
  /\b(can'?t\s+take\s+this\s+pain\s+anymore|better\s+off\s+dead)\b/i,
];

const EXCLUSION_PATTERNS = [
  /\b(cell\s+death|apoptosis|necrosis|bacteria\s+kill|virus\s+kill)\b/i,
  /\b(kill\s+(process|switch|job|task|daemon))\b/i,
];

export const VERIFIED_CRISIS_HOTLINES = [
  {
    name: '988 Suicide & Crisis Lifeline',
    contact: 'Call or text 988',
    detail: 'Free, confidential, 24/7 support across the US and Canada.',
  },
  {
    name: 'Crisis Text Line',
    contact: 'Text HOME to 741741',
    detail: 'Free 24/7 crisis counseling via text message in US, UK, and Canada.',
  },
  {
    name: 'The Trevor Project (LGBTQ Youth)',
    contact: 'Call 1-866-488-7386 or text START to 678-678',
    detail: '24/7 confidential crisis intervention for young people.',
  },
  {
    name: 'Childline (UK)',
    contact: 'Call 0800 1111',
    detail: 'Free 24/7 confidential helpline for children and young people under 19.',
  },
  {
    name: 'International Resources',
    contact: 'Visit https://findahelpline.com',
    detail: 'Free confidential support services in over 130 countries.',
  },
];

export function detectCrisisIntent(input: string): CrisisEvaluation {
  const text = input.trim();

  // If text mentions typical biology or computing terms, exclude
  for (const exclusion of EXCLUSION_PATTERNS) {
    if (exclusion.test(text)) {
      return { isCrisis: false, hotlines: [] };
    }
  }

  // Check for crisis patterns
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isCrisis: true,
        crisisType: 'SELF_HARM',
        compassionateResponse:
          "It sounds like you're carrying a really heavy burden right now. Your well-being and life are far more important than any exam, homework, or grade. You don't have to navigate this alone—there are kind, trained people ready to listen and support you 24/7.",
        hotlines: VERIFIED_CRISIS_HOTLINES,
      };
    }
  }

  return { isCrisis: false, hotlines: [] };
}
