import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check, Share, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'drawer' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showInfoGuide, setShowInfoGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone mode on home screen, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowInfoGuide(true);
    }
  };

  return (
    <>
      {variant === 'drawer' ? (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white shadow-sm transition-all"
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Install Android App (PWA)</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 dark:bg-black/20 font-bold uppercase">
            Offline
          </span>
        </button>
      ) : variant === 'banner' ? (
        <div className="p-3 rounded-2xl bg-zinc-900 dark:bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 text-xs text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs truncate">Install Task Genie App</h4>
              <p className="text-[10px] text-zinc-400 truncate">Work offline & launch from home screen</p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-100 text-zinc-950 font-bold text-xs hover:bg-white transition-all shrink-0 shadow-sm"
          >
            {isInstalling ? 'Installing...' : 'Install'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          title="Install Task Genie as an offline Android PWA"
          className="px-2.5 py-1 rounded-lg border border-zinc-700 dark:border-zinc-700 bg-zinc-900 dark:bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xs:inline">Install App</span>
        </button>
      )}

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-500" />
                <span>Install on iOS / Safari</span>
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 py-4 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200/60 dark:border-zinc-800">
                <span className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">Tap the Share Button</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">In Safari's bottom toolbar, tap the <Share className="w-3 h-3 inline text-indigo-500" /> icon.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200/60 dark:border-zinc-800">
                <span className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">Select "Add to Home Screen"</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Scroll down the menu and choose <PlusSquare className="w-3 h-3 inline text-indigo-500" /> <strong>Add to Home Screen</strong>.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Generic Browser Installation Info Modal */}
      {showInfoGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span>Install Task Genie</span>
              </h3>
              <button
                onClick={() => setShowInfoGuide(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 py-4 text-xs text-zinc-600 dark:text-zinc-300">
              <p>
                Task Genie is fully configured as a Progressive Web App (PWA) with offline caching enabled.
              </p>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200/60 dark:border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">To install on your device:</div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <li><strong>Chrome / Android:</strong> Tap the 3-dots menu (⋮) → tap <em>"Install App"</em> or <em>"Add to Home screen"</em>.</li>
                  <li><strong>Desktop Chrome / Edge:</strong> Click the install icon in the URL address bar.</li>
                  <li><strong>Safari / iOS:</strong> Tap Share icon → tap <em>"Add to Home Screen"</em>.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowInfoGuide(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
