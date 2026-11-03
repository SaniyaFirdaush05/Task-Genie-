import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Wifi, Database, Check } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowRestoredToast(true);
      const timer = setTimeout(() => {
        setShowRestoredToast(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div className="fixed bottom-18 left-4 right-4 sm:left-auto sm:right-4 z-40 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-zinc-900/95 dark:bg-black/95 text-zinc-100 border border-zinc-700/80 dark:border-zinc-800 shadow-2xl backdrop-blur-md text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <WifiOff className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-zinc-100">
                <span>Offline Mode Active</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <Database className="w-2.5 h-2.5" />
                <span>Local D1 TaskStore cache enabled</span>
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
            Cached
          </span>
        </div>
      </div>
    );
  }

  if (showRestoredToast) {
    return (
      <div className="fixed bottom-18 left-4 right-4 sm:left-auto sm:right-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-zinc-900/95 dark:bg-black/95 text-zinc-100 border border-emerald-500/50 shadow-2xl backdrop-blur-md text-xs">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Wifi className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-zinc-100">
              <span>Back Online</span>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Network reconnected. Service worker cache updated.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
