import { prisma } from '@chizmo/db';
import { signSessionToken, setSessionCookie, hashPassword } from './session';

/**
 * Create or retrieve a guest session for instantaneous time-to-first-deck (<60s)
 */
export async function getOrCreateGuestSession(): Promise<{ userId: string; token: string }> {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const guestName = `Scholar_${randomSuffix}`;

  const user = await prisma.user.create({
    data: {
      displayName: guestName,
      isGuest: true,
      profile: {
        create: {
          studyGoalMins: 15,
        },
      },
      entitlement: {
        create: {
          dailyGenerationsUsed: 0,
          maxDecks: 10,
          maxUploadMb: 25,
        },
      },
    },
  });

  const token = await signSessionToken({
    userId: user.id,
    isGuest: true,
    displayName: user.displayName,
  });

  await setSessionCookie(token);

  return { userId: user.id, token };
}

/**
 * Upgrade guest account to permanent account without losing any study progress or decks!
 */
export async function upgradeGuestAccount(
  guestUserId: string,
  email: string,
  rawPassword: string,
  displayName: string,
  birthYear?: number
) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(rawPassword);

  const updatedUser = await prisma.user.update({
    where: { id: guestUserId },
    data: {
      email,
      passwordHash,
      displayName,
      birthYear,
      isGuest: false,
    },
  });

  const token = await signSessionToken({
    userId: updatedUser.id,
    isGuest: false,
    email: updatedUser.email || undefined,
    displayName: updatedUser.displayName,
  });

  await setSessionCookie(token);

  return updatedUser;
}
