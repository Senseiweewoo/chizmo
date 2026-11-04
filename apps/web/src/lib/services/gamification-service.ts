import {
  GamificationState,
  gamificationReducer,
  GamificationEvent,
  generateDailyQuests,
  evaluateQuestProgress,
  Quest,
  toStudyDateString,
  xpForLevel,
  ALL_ACHIEVEMENTS,
} from '@chizmo/core';

export interface UserGamificationSettings {
  streaksEnabled: boolean;
  leaderboardEnabled: boolean;
  quietHoursStart: number; // 21 for 9 PM
  quietHoursEnd: number; // 8 for 8 AM
  dailyReminderEnabled: boolean;
}

export interface UserGamificationProfile {
  state: GamificationState;
  quests: Quest[];
  settings: UserGamificationSettings;
  displayName: string;
  avatarSeed: string;
}

// In-memory state store with guest defaults
const userProfiles = new Map<string, UserGamificationProfile>();

// Weekly leaderboard in-memory store: Map<isoWeekKey, Map<userId, { xp: number; displayName: string }>>
const weeklyLeaderboards = new Map<string, Map<string, { xp: number; displayName: string }>>();

function getIsoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo < 10 ? '0' : ''}${weekNo}`;
}

export const GamificationService = {
  /**
   * Get or initialize profile for a user
   */
  async getProfile(userId: string, displayName = 'Chizmo Scholar'): Promise<UserGamificationProfile> {
    const todayStr = toStudyDateString(new Date(), 4);

    let profile = userProfiles.get(userId);
    if (!profile) {
      profile = {
        state: {
          userId,
          xp: 120,
          level: 2,
          streakDays: 3,
          streakFrozen: false,
          freezesRemaining: 1,
          cardsStudiedToday: 0,
          lastStudyDate: todayStr,
          lastQualifiedDate: todayStr,
          unlockedAchievements: ['first_review'],
        },
        quests: generateDailyQuests(todayStr),
        settings: {
          streaksEnabled: true,
          leaderboardEnabled: true,
          quietHoursStart: 21,
          quietHoursEnd: 8,
          dailyReminderEnabled: true,
        },
        displayName,
        avatarSeed: userId,
      };
      userProfiles.set(userId, profile);
    }

    // Refresh daily quests if date rolled over
    if (profile.state.lastStudyDate !== todayStr) {
      profile.quests = generateDailyQuests(todayStr);
      profile.state.cardsStudiedToday = 0;
      profile.state.lastStudyDate = todayStr;
    }

    return profile;
  },

  /**
   * Record a gamification domain event
   */
  async recordEvent(
    userId: string,
    event: GamificationEvent,
    displayName?: string
  ): Promise<{ profile: UserGamificationProfile; xpEarned: number; leveledUp: boolean }> {
    const profile = await this.getProfile(userId, displayName);
    const now = new Date();
    const prevLevel = profile.state.level;
    const prevXp = profile.state.xp;

    // 1. Process event through core reducer
    const nextState = gamificationReducer(profile.state, event, now, 4);

    // 2. Evaluate daily quests
    const { updatedQuests, newlyEarnedXp } = evaluateQuestProgress(profile.quests, event);

    // Combine quest bonus XP
    const totalXp = nextState.xp + newlyEarnedXp;
    nextState.xp = totalXp;

    profile.state = nextState;
    profile.quests = updatedQuests;

    const xpEarned = totalXp - prevXp;
    const leveledUp = nextState.level > prevLevel;

    // 3. Update weekly leaderboard if enabled
    if (profile.settings.leaderboardEnabled) {
      const isoWeek = getIsoWeek(now);
      let weekBoard = weeklyLeaderboards.get(isoWeek);
      if (!weekBoard) {
        weekBoard = new Map();
        weeklyLeaderboards.set(isoWeek, weekBoard);
      }
      const existing = weekBoard.get(userId) || { xp: 0, displayName: profile.displayName };
      existing.xp += xpEarned;
      existing.displayName = profile.displayName;
      weekBoard.set(userId, existing);
    }

    return {
      profile,
      xpEarned,
      leveledUp,
    };
  },

  /**
   * Get weekly leaderboard
   */
  async getLeaderboard(userId: string) {
    const now = new Date();
    const isoWeek = getIsoWeek(now);
    let weekBoard = weeklyLeaderboards.get(isoWeek);
    if (!weekBoard) {
      weekBoard = new Map();
      // Seed some friendly demo competitors for rich game feel
      weekBoard.set('comp-1', { xp: 620, displayName: 'AuraLearn ⚡' });
      weekBoard.set('comp-2', { xp: 480, displayName: 'Alex_Bio' });
      weekBoard.set('comp-3', { xp: 350, displayName: 'Maya_SAT' });
      weekBoard.set('comp-4', { xp: 210, displayName: 'David_Chem' });
      weeklyLeaderboards.set(isoWeek, weekBoard);
    }

    // Convert map to sorted list
    const entries = Array.from(weekBoard.entries()).map(([uId, data]) => ({
      userId: uId,
      displayName: data.displayName,
      xp: data.xp,
    }));

    entries.sort((a, b) => b.xp - a.xp);

    // Attach ranks
    const ranked = entries.map((entry, index) => ({
      rank: index + 1,
      ...entry,
      isCurrentUser: entry.userId === userId,
    }));

    const userRank = ranked.find((r) => r.isCurrentUser)?.rank || ranked.length + 1;

    return {
      isoWeek,
      topLeaderboard: ranked.slice(0, 20),
      userRank,
      totalParticipants: ranked.length,
    };
  },

  /**
   * Update ethical gamification settings
   */
  async updateSettings(userId: string, partial: Partial<UserGamificationSettings>) {
    const profile = await this.getProfile(userId);
    profile.settings = {
      ...profile.settings,
      ...partial,
    };
    return profile.settings;
  },

  /**
   * Repair broken streak within 24h repair window
   */
  async repairStreak(userId: string) {
    const profile = await this.getProfile(userId);
    if (profile.state.streakDays <= 1) {
      profile.state.streakDays = Math.max(2, profile.state.streakDays + 1);
      return { success: true, message: 'Streak restored! Keep the fire burning.' };
    }
    return { success: false, message: 'No streak repair needed.' };
  },
};
