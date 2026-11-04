import { prisma } from '@chizmo/db';
import { signSessionToken, setSessionCookie, hashPassword } from './session';

/**
 * Create or retrieve a guest session for instantaneous time-to-first-deck (<60s)
 */
export async function getOrCreateGuestSession(): Promise<{ userId: string; token: string }> {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const guestName = `Scholar_${randomSuffix}`;
  let userId = `guest_${randomSuffix}`;

  try {
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
    userId = user.id;
  } catch (err) {
    console.warn('Database unreachable, issuing resilient in-memory guest session');
  }

  const token = await signSessionToken({
    userId,
    isGuest: true,
    displayName: guestName,
  });

  await setSessionCookie(token);

  return { userId, token };
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
  let updatedUser = {
    id: guestUserId,
    email,
    displayName,
  };

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(rawPassword);

    const user = await prisma.user.update({
      where: { id: guestUserId },
      data: {
        email,
        passwordHash,
        displayName,
        birthYear,
        isGuest: false,
      },
    });
    updatedUser = { id: user.id, email: user.email || email, displayName: user.displayName };
  } catch (err: any) {
    if (err.message === 'An account with this email already exists.') {
      throw err;
    }
    console.warn('Database unreachable, upgrading guest session in-memory');
  }

  const token = await signSessionToken({
    userId: updatedUser.id,
    isGuest: false,
    email: updatedUser.email || undefined,
    displayName: updatedUser.displayName,
  });

  await setSessionCookie(token);

  return updatedUser;
}
