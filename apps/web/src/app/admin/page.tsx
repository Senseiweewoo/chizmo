'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Database,
  Lock,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/system')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Access Denied`);
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setStats(data);
        } else {
          setError(data.error);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-6">
        <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Admin Access Restricted</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {error}. Enforced server-side via RBAC authorization middleware.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">Return to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Server-Enforced RBAC Active
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Security & Administration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time telemetry, permission boundaries, and row-level security enforcement.
          </p>
        </div>

        <Badge variant="volt" className="self-start text-xs font-black px-3 py-1">
          Role: ADMINISTRATOR
        </Badge>
      </div>

      {/* Security Status Checklist */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Row-Level Security
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Owner authorization strictly enforced on all deck & card mutations.
          </p>
        </Card>

        <Card className="p-4 space-y-2 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> HttpOnly Auth Cookies
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Zero JWT or sensitive tokens stored in localStorage (XSS-immune).
          </p>
        </Card>

        <Card className="p-4 space-y-2 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Server-Side Secrets
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            All API keys and database credentials restricted to server runtime.
          </p>
        </Card>

        <Card className="p-4 space-y-2 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Webhook Signatures
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            HMAC-SHA256 signature verification enabled on all webhook endpoints.
          </p>
        </Card>
      </div>

      {/* Telemetry Grid */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="p-5 space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Total Users
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.stats?.totalUsers || 0}
          </div>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Total Decks
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.stats?.totalDecks || 0}
          </div>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> Total Reviews
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.stats?.totalReviews || 0}
          </div>
        </Card>

        <Card className="p-5 space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Database className="w-4 h-4" /> Memory Heap
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.stats?.memoryUsageMb || 0} MB
          </div>
        </Card>
      </div>
    </div>
  );
}
