import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Smartphone, Maximize2, RotateCcw, FileText, Sparkles } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  onResetDemoData: () => void;
  onOpenArchitectureModal: () => void;
  onOpenGenie: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  onResetDemoData,
  onOpenArchitectureModal,
  onOpenGenie,
}) => {
  const [currentTime, setCurrentTime] = useState('09:41');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-black text-slate-900 dark:text-zinc-100 flex flex-col transition-colors">
      {/* Outer Developer / Presentation Toolbar */}
      <header className="bg-white/80 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between text-xs z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-slate-900 dark:text-white">
            <div className="w-5 h-5 rounded-md bg-zinc-800 dark:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-[10px]">
              TG
            </div>
            <span>Task Genie</span>
            <span className="text-slate-400 dark:text-zinc-500 font-normal hidden sm:inline">| Android Task Manager</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenArchitectureModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors font-medium border border-zinc-300 dark:border-zinc-700"
            title="View Context Diagram & Level 1 DFD Architecture"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Architecture & DFDs</span>
          </button>

          <button
            onClick={onOpenGenie}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors font-medium shadow-sm border border-zinc-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ask Genie AI</span>
          </button>

          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors font-medium text-slate-700 dark:text-zinc-200 border border-transparent dark:border-zinc-800"
            title="Toggle between Android Phone Frame and Full Expanded View"
          >
            {isPhoneFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Full Screen</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Phone Frame</span>
              </>
            )}
          </button>

          <button
            onClick={onResetDemoData}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            title="Reset to default demo data matching notebook sketches"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex items-center justify-center p-0 md:p-6 overflow-hidden">
        {isPhoneFrame ? (
          /* Realistic Android Smartphone Container */
          <div className="relative w-full max-w-[420px] h-[100dvh] md:h-[860px] md:max-h-[calc(100vh-4rem)] bg-black md:rounded-[48px] shadow-2xl md:ring-12 md:ring-black md:border-4 md:border-zinc-800 flex flex-col overflow-hidden select-none">
            {/* Phone Speaker Slit & Front Camera Punch-hole */}
            <div className="hidden md:flex absolute top-3 left-1/2 -translate-x-1/2 items-center justify-center z-50 pointer-events-none">
              <div className="w-3.5 h-3.5 rounded-full bg-black ring-1 ring-zinc-800 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-900"></div>
              </div>
            </div>

            {/* Android Status Bar */}
            <div className="w-full h-8 pt-1.5 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-zinc-300 bg-white/95 dark:bg-black/95 backdrop-blur-md z-40 shrink-0 border-b border-transparent dark:border-zinc-900">
              <div className="flex items-center gap-1">
                <span>{currentTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Signal className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="text-[10px] font-bold">5G</span>
                <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px]">98%</span>
                  <Battery className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* Inner Android App Viewport */}
            <div className="flex-1 w-full flex flex-col bg-slate-50 dark:bg-black overflow-hidden relative">
              {children}
            </div>

            {/* Android Gesture Navigation Bar Pill */}
            <div className="w-full h-4 bg-white/95 dark:bg-black/95 flex items-center justify-center shrink-0 z-40 border-t border-transparent dark:border-zinc-900">
              <div className="w-32 h-1 bg-slate-400/80 dark:bg-zinc-700 rounded-full"></div>
            </div>
          </div>
        ) : (
          /* Expanded Full-Screen View for Desktop Testing */
          <div className="w-full max-w-5xl h-full min-h-[800px] bg-slate-50 dark:bg-black rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
