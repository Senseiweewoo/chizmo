/**
 * School-Friendly Nickname & Content Filter
 * Filters profanity and inappropriate handles for multiplayer live quiz rooms.
 */

const BLOCKED_TERMS = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'dick',
  'pussy',
  'nigger',
  'faggot',
  'retard',
  'whore',
  'slut',
  'nazi',
  'hitler',
  'kill',
  'suicide',
];

export function isCleanNickname(nickname: string): boolean {
  const clean = nickname.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.length < 2 || clean.length > 20) return false;

  for (const term of BLOCKED_TERMS) {
    if (clean.includes(term)) {
      return false;
    }
  }

  return true;
}

export function sanitizeNickname(nickname: string, fallback = 'Chizzy Scholar'): string {
  if (isCleanNickname(nickname)) {
    return nickname.trim();
  }
  return `${fallback} ${Math.floor(100 + Math.random() * 900)}`;
}
