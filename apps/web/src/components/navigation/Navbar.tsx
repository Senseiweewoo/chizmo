'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChizzyMascot } from '../brand/ChizzyMascot';
import { Zap, Flame, Plus, Moon, Sun, BookOpen, Radio, User, Compass } from 'lucide-react';
import { Button } from '../ui/Button';

export function Navbar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [userStats, setUserStats] = useState<{ xp: number; streak: number; isGuest: boolean } | null>(null);

  useEffect(() => {
    // Check dark mode
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }

    // Fetch user stats
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUserStats({
            xp: 120, // baseline
            streak: 3,
            isGuest: data.user.isGuest,
          });
        }
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const navLinks = [
    { label: 'Home', href: '/', icon: Compass },
    { label: 'Library', href: '/library', icon: BookOpen },
    { label: 'Live Arena', href: '/live', icon: Radio },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-obsidian-950/80 border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Mascot */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <ChizzyMascot size={36} className="transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-chizmo-600 via-chizmo-500 to-volt-500 bg-clip-text text-transparent">
              Chizmo
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-900/70 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-obsidian-900 text-chizmo-600 dark:text-chizmo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions & Gamification Pills */}
        <div className="flex items-center gap-2.5">
          {/* Streak Flame Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-full text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse-slow" />
            <span>{userStats?.streak ?? 1}d</span>
          </div>

          {/* XP Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-chizmo-50 dark:bg-chizmo-950/40 border border-chizmo-200/60 dark:border-chizmo-800/60 rounded-full text-chizmo-600 dark:text-chizmo-400 text-xs font-bold shadow-sm">
            <Zap className="w-4 h-4 fill-chizmo-500 text-chizmo-500" />
            <span>{userStats?.xp ?? 50} XP</span>
          </div>

          {/* Create Big '+' Button */}
          <Link href="/create">
            <Button size="sm" variant="volt" className="shadow-none">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </Link>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
