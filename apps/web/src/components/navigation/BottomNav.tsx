'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, BookOpen, Plus, Radio, User, Trophy } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { label: 'Home', href: '/', icon: Compass },
    { label: 'Library', href: '/library', icon: BookOpen },
    { label: 'Create', href: '/create', icon: Plus, isAction: true },
    { label: 'Arena', href: '/leaderboard', icon: Trophy },
    { label: 'Live', href: '/live', icon: Radio },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-obsidian-950/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1 safe-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          if (tab.isAction) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex items-center justify-center -translate-y-3 w-12 h-12 rounded-full bg-volt-500 text-slate-950 shadow-lg shadow-volt-500/30 active:scale-95 transition-transform"
                aria-label="Create study deck"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-chizmo-600 dark:text-chizmo-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
