export type SubscriptionTier = 'FREE' | 'PRO';

export interface UserEntitlements {
  tier: SubscriptionTier;
  isActive: boolean;
  maxDecks: number;
  maxAiGenerationsPerMonth: number;
  usedAiGenerations: number;
  unlimitedTutor: boolean;
  examModeEnabled: boolean;
  streakFreezesMax: number;
  renewsAt?: string;
}

const userEntitlements = new Map<string, UserEntitlements>();

export const SubscriptionService = {
  async getEntitlements(userId: string): Promise<UserEntitlements> {
    let ent = userEntitlements.get(userId);
    if (!ent) {
      ent = {
        tier: 'FREE',
        isActive: false,
        maxDecks: 5,
        maxAiGenerationsPerMonth: 10,
        usedAiGenerations: 2,
        unlimitedTutor: false,
        examModeEnabled: true,
        streakFreezesMax: 2,
      };
      userEntitlements.set(userId, ent);
    }
    return ent;
  },

  async upgradeToPro(userId: string, plan: 'monthly' | 'yearly'): Promise<UserEntitlements> {
    const renewDate = new Date();
    if (plan === 'yearly') {
      renewDate.setFullYear(renewDate.getFullYear() + 1);
    } else {
      renewDate.setMonth(renewDate.getMonth() + 1);
    }

    const ent: UserEntitlements = {
      tier: 'PRO',
      isActive: true,
      maxDecks: 9999,
      maxAiGenerationsPerMonth: 9999,
      usedAiGenerations: 0,
      unlimitedTutor: true,
      examModeEnabled: true,
      streakFreezesMax: 4,
      renewsAt: renewDate.toISOString(),
    };

    userEntitlements.set(userId, ent);
    return ent;
  },
};
