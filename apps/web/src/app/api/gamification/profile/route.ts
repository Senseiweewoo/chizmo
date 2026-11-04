import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { GamificationService } from '@/lib/services/gamification-service';
import { xpForLevel, ALL_ACHIEVEMENTS } from '@chizmo/core';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';
    const displayName = session?.email ? session.email.split('@')[0] : 'Chizmo Explorer';

    const profile = await GamificationService.getProfile(userId, displayName);

    const currentLevel = profile.state.level;
    const currentXp = profile.state.xp;
    const currentLevelBaseXp = xpForLevel(currentLevel);
    const nextLevelBaseXp = xpForLevel(currentLevel + 1);
    const levelProgress = Math.min(
      100,
      Math.max(
        0,
        Math.round(((currentXp - currentLevelBaseXp) / Math.max(1, nextLevelBaseXp - currentLevelBaseXp)) * 100)
      )
    );

    const achievements = ALL_ACHIEVEMENTS.map((a) => ({
      ...a,
      isUnlocked: profile.state.unlockedAchievements.includes(a.id),
    }));

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        levelProgress,
        nextLevelXp: nextLevelBaseXp,
        achievements,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch gamification profile' },
      { status: 500 }
    );
  }
}
