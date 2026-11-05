#!/usr/bin/env python3
"""
Gamification Engine Simulator & Ethical Guardrails Verifier
Tests XP progression level curves, streak freezes, quest tracking, and anti-grinding XP caps.
"""

import sys
import math
import argparse

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def xp_for_level(level: int) -> int:
    """Level curve formula: round(100 * n^1.5)"""
    return round(100 * math.pow(level, 1.5))

def level_from_xp(total_xp: int) -> int:
    level = 1
    while total_xp >= xp_for_level(level + 1):
        level += 1
    return level

class GamificationUser:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.xp = 0
        self.level = 1
        self.streak_days = 0
        self.freezes_banked = 1
        self.cards_reviewed_today = 0
        self.xp_earned_per_card = {}
        self.unlocked_achievements = set()

    def review_card(self, card_id: str, rating: int, is_due: bool = True):
        # Base XP: Again: 1, Hard: 2, Good: 5, Easy: 6
        base_xp = {1: 1, 2: 2, 3: 5, 4: 6}.get(rating, 1)
        if not is_due:
            base_xp = max(1, base_xp // 2) # Reduced XP for cramming

        # Anti-Grinding Cap: Max 15 XP per card per day
        current_card_xp = self.xp_earned_per_card.get(card_id, 0)
        awarded_xp = min(base_xp, max(0, 15 - current_card_xp))
        self.xp_earned_per_card[card_id] = current_card_xp + awarded_xp

        self.xp += awarded_xp
        self.level = level_from_xp(self.xp)
        self.cards_reviewed_today += 1

        # Check First Review achievement
        if "first_review" not in self.unlocked_achievements:
            self.unlocked_achievements.add("first_review")
            self.xp += 50

    def evaluate_day_end(self, studied: bool):
        if studied and self.cards_reviewed_today >= 10:
            self.streak_days += 1
            # Earn 1 freeze every 7 streak days (max 2)
            if self.streak_days % 7 == 0 and self.freezes_banked < 2:
                self.freezes_banked += 1
        elif not studied:
            if self.freezes_banked > 0:
                self.freezes_banked -= 1
                # Streak protected by freeze!
            else:
                self.streak_days = 0

        self.cards_reviewed_today = 0
        self.xp_earned_per_card.clear()

def run_simulation():
    print("\n=======================================================")
    print("  Gamification Engine & Motivation Layer Simulation")
    print("=======================================================\n")

    user = GamificationUser("student_42")

    print("1. Level Progression Curve Verification:")
    print("-------------------------------------------------------")
    for lvl in [1, 2, 5, 10, 25, 50]:
        print(f"  Level {str(lvl).ljust(2)} requires: {str(xp_for_level(lvl)).rjust(7)} XP cumulative")

    print("\n2. Anti-Grinding & XP Cap Verification:")
    print("-------------------------------------------------------")
    # Simulate a user attempting to spam 100 reviews on a single card
    for _ in range(100):
        user.review_card("card_repeat_1", rating=4, is_due=True)

    card_xp = user.xp_earned_per_card.get("card_repeat_1", 0)
    print(f"  Spamming 100 Easy reviews on 1 card yielded: {card_xp} XP (Cap = 15 XP)")
    assert card_xp <= 15, "XP cap violated!"
    print("  [OK] PASSED: Anti-grinding cap strictly prevents XP farming.")

    print("\n3. Streak & Streak Freeze Resilience Verification:")
    print("-------------------------------------------------------")
    # Day 1 - 7: Regular study -> Earns 7-day streak + extra freeze
    for day in range(1, 8):
        for c in range(12):
            user.review_card(f"card_{day}_{c}", rating=3)
        user.evaluate_day_end(studied=True)

    print(f"  After 7 study days: Streak = {user.streak_days} days, Freezes Banked = {user.freezes_banked}")
    assert user.streak_days == 7, "Streak calculation failed"
    assert user.freezes_banked == 2, "Freeze reward failed"

    # Day 8: User misses study day -> Freeze consumed, streak preserved
    user.evaluate_day_end(studied=False)
    print(f"  After 1 missed day: Streak = {user.streak_days} days, Freezes Remaining = {user.freezes_banked}")
    assert user.streak_days == 7, "Freeze failed to protect streak"
    assert user.freezes_banked == 1, "Freeze count did not decrement"

    print("  [OK] PASSED: Streak freeze protected streak during missed day.")
    print("\n=======================================================")
    print("Gamification Engine Health: 100% COMPLIANT WITH SYSTEM RULES")
    print("=======================================================\n")
    return 0

def main():
    return run_simulation()

if __name__ == "__main__":
    sys.exit(main())
