'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  Brain,
  Calendar,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
  Award,
  Lightbulb,
} from 'lucide-react';
import { UserAnalyticsData, WeeklyAiReport } from '@/lib/services/analytics-service';

export default function AnalyticsDashboardPage() {
  const [analytics, setAnalytics] = useState<UserAnalyticsData | null>(null);
  const [report, setReport] = useState<WeeklyAiReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAnalytics(data.analytics);
          setReport(data.report);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-4">
          <ChizzyMascot mood="thinking" size={80} animated />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Computing FSRS Forgetting Curves & Learning Velocity...
          </p>
        </div>
      </div>
    );
  }

  const maxReviews = Math.max(...analytics.weeklyActivity.map((a) => a.reviewsCount), 20);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-24 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo" className="text-xs font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Retention Science
            </Badge>
            <span className="text-xs text-slate-400">Powered by FSRS-4.5</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Learning Analytics & Velocity
          </h1>
          <p className="text-xs text-slate-500">
            Real-time memory stability, forgetting curve projections, and AI-coached weekly reports.
          </p>
        </div>

        <Link href="/study/daily">
          <Button variant="volt" size="md" className="font-bold shadow-md shadow-volt-500/25">
            <Sparkles className="w-4 h-4 mr-1.5" /> Study Today's Due Cards
          </Button>
        </Link>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 border space-y-2 bg-white dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Memory Retention
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
              {analytics.retentionRate}%
            </span>
            <span className="text-xs font-bold text-emerald-500">Target 90%+</span>
          </div>
          <p className="text-[11px] text-slate-500">Predicted memory retrievability $R$ across mature cards</p>
        </Card>

        <Card className="p-4 sm:p-5 border space-y-2 bg-white dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Reviews
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {analytics.totalReviews}
            </span>
            <span className="text-xs font-bold text-indigo-500">+18 today</span>
          </div>
          <p className="text-[11px] text-slate-500">Active recall iterations logged to append-only store</p>
        </Card>

        <Card className="p-4 sm:p-5 border space-y-2 bg-white dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Habit Streak
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-500">
              {analytics.activeStreak}
            </span>
            <span className="text-xs font-bold text-slate-500">Days 🔥</span>
          </div>
          <p className="text-[11px] text-slate-500">Consecutive qualified study days with auto-freeze protection</p>
        </Card>

        <Card className="p-4 sm:p-5 border space-y-2 bg-white dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Card Repository
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {analytics.totalCards}
            </span>
            <span className="text-xs font-bold text-volt-500">Atomic</span>
          </div>
          <p className="text-[11px] text-slate-500">Atomic flashcards created and imported in personal library</p>
        </Card>
      </div>

      {/* Weekly Activity & Forgetting Curve Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Activity Volume Chart */}
        <Card className="p-6 space-y-4 border bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" /> Past 7 Days Study Volume
              </h2>
              <p className="text-xs text-slate-400">Card reviews per day</p>
            </div>
            <Badge variant="indigo" className="text-[10px]">7-Day View</Badge>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
            {analytics.weeklyActivity.map((act) => {
              const heightPct = Math.max(12, Math.round((act.reviewsCount / maxReviews) * 100));
              return (
                <div key={act.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {act.reviewsCount}
                  </span>
                  <div
                    className="w-full max-w-[36px] rounded-t-xl bg-gradient-to-t from-chizmo-600 to-volt-400 transition-all duration-500 hover:brightness-110"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-xs font-semibold text-slate-500">
                    {act.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* FSRS Projected Forgetting Curve */}
        <Card className="p-6 space-y-4 border bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-500" /> Projected Forgetting Curve (FSRS-4.5)
              </h2>
              <p className="text-xs text-slate-400">
                Retention $R(t)$ over days without review
              </p>
            </div>
            <Badge variant="emerald" className="text-[10px]">Optimal Timing</Badge>
          </div>

          {/* SVG Forgetting Curve Chart */}
          <div className="h-44 relative flex items-center justify-center pt-2">
            <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
              {/* Target 90% threshold line */}
              <line
                x1="0"
                y1="24"
                x2="300"
                y2="24"
                stroke="#10B981"
                strokeDasharray="4 4"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <text x="5" y="20" fill="#10B981" fontSize="9" fontWeight="bold">
                Desired Retention (90%)
              </text>

              {/* Curve path */}
              <path
                d={analytics.forgettingCurve
                  .map((p, idx) => {
                    const x = (p.day / 14) * 300;
                    const y = 120 - (p.retrievabilityPct / 100) * 110;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#6366F1"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Key points */}
              {analytics.forgettingCurve.filter((p) => p.day % 4 === 0).map((p) => {
                const x = (p.day / 14) * 300;
                const y = 120 - (p.retrievabilityPct / 100) * 110;
                return (
                  <g key={p.day}>
                    <circle cx={x} cy={y} r="4" fill="#6366F1" />
                    <text x={x} y={y - 8} fill="#94A3B8" fontSize="8" textAnchor="middle">
                      {p.retrievabilityPct}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            ⚡ FSRS schedules your reviews right as memory retrievability touches 90%, maximizing long-term potentiation.
          </p>
        </Card>
      </div>

      {/* Weekly AI Coaching Report */}
      {report && (
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-indigo-50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ChizzyMascot mood="supercharged" size={54} animated />
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="volt" className="text-[10px]">Weekly AI Synthesis</Badge>
                  <span className="text-xs text-slate-400">{report.generatedAt}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Chizzy's Learning Diagnosis
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-slate-500 font-semibold">Weekly Grade:</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {report.retentionGrade}
              </span>
            </div>
          </div>

          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
            "{report.headline}"
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
              <span className="font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> High Retention Win:
              </span>
              <p>{report.keyWin}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <Lightbulb className="w-3.5 h-3.5" /> Recommended Focus:
              </span>
              <p>{report.focusArea}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Strategic Recommendations
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {report.coachTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">⚡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
