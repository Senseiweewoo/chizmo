'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, CheckCircle2, RefreshCw } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [syncCount, setSyncCount] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('SW registration error:', err));
    }

    // Network status handlers
    const handleOnline = () => {
      setIsOffline(false);
      flushOfflineReviews();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const flushOfflineReviews = async () => {
    try {
      const raw = localStorage.getItem('chizmo_offline_reviews');
      if (!raw) return;

      const reviews = JSON.parse(raw);
      if (!Array.isArray(reviews) || reviews.length === 0) return;

      setIsSyncing(true);
      let successCount = 0;

      for (const item of reviews) {
        try {
          const res = await fetch('/api/study/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          if (res.ok) successCount++;
        } catch {
          // Break if network drops again
          break;
        }
      }

      if (successCount > 0) {
        setSyncCount(successCount);
        // Clear synced reviews
        localStorage.removeItem('chizmo_offline_reviews');
        setTimeout(() => setSyncCount(null), 4000);
      }
    } catch {
      // Ignore parse errors
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {/* Offline Toast Banner */}
      {isOffline && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/95 dark:bg-obsidian-900/95 border border-amber-500/50 text-amber-400 text-xs font-bold shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4">
          <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Offline Study Mode — Reviews are saved locally & will sync when reconnected</span>
        </div>
      )}

      {/* Syncing or Synced Confirmation Banner */}
      {isSyncing && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-chizmo-950/95 border border-chizmo-500/50 text-chizmo-300 text-xs font-bold shadow-xl backdrop-blur-md">
          <RefreshCw className="w-4 h-4 text-chizmo-400 animate-spin" />
          <span>Syncing offline study reviews...</span>
        </div>
      )}

      {syncCount !== null && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Synced {syncCount} offline review{syncCount > 1 ? 's' : ''}! Streak updated 🔥</span>
        </div>
      )}
    </>
  );
}
