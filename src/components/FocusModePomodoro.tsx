import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TaskItem, DailyFocusStats } from '../types/task';
import { D1TaskStoreService } from '../store/taskStore';
import {
  CALMING_SOUNDSCAPES,
  CalmingAudioEngine,
  CalmingSoundscapeId,
} from '../utils/calmingAudio';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  CheckCircle,
  Timer,
  BarChart2,
  Brain,
  Music,
  X,
  Flame,
  Calendar,
} from 'lucide-react';

interface FocusModePomodoroProps {
  tasks: TaskItem[];
  selectedTask?: TaskItem | null;
  onSelectTask: (task: TaskItem) => void;
  onExitFocus: () => void;
}

type FocusTimerMode = 'work' | 'deepFocus' | 'shortBreak' | 'longBreak';

const MODE_CONFIG: Record<
  FocusTimerMode,
  { label: string; shortLabel: string; minutes: number; caption: string }
> = {
  work: {
    label: 'Pomodoro',
    shortLabel: '25m',
    minutes: 25,
    caption: 'Standard Focus Session',
  },
  deepFocus: {
    label: 'Deep Focus',
    shortLabel: '45m',
    minutes: 45,
    caption: '45m Study/Work · 15m Break',
  },
  shortBreak: {
    label: 'Break',
    shortLabel: '5m',
    minutes: 5,
    caption: 'Short Resting Interval',
  },
  longBreak: {
    label: 'Long Break',
    shortLabel: '15m',
    minutes: 15,
    caption: 'Deep Recovery Break',
  },
};

const formatDurationShort = (totalMinutes: number): string => {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins === 0 ? `${hrs}h` : `${hrs}h ${mins}m`;
};

const formatDayLabel = (dateStr: string, index: number): string => {
  if (index === 0) return 'Today';
  if (index === 1) return 'Yesterday';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

interface SimpleProgressRingProps {
  percent: number;
  size: number;
  strokeWidth: number;
  trackClassName?: string;
  progressClassName?: string;
  children?: React.ReactNode;
}

const SimpleProgressRing: React.FC<SimpleProgressRingProps> = ({
  percent,
  size,
  strokeWidth,
  trackClassName = 'stroke-slate-200 dark:stroke-zinc-800',
  progressClassName = 'stroke-indigo-600 dark:stroke-zinc-100',
  children,
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * clamped) / 100;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
          className={trackClassName}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className={`${progressClassName} transition-all duration-500 ease-out`}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
};

export const FocusModePomodoro: React.FC<FocusModePomodoroProps> = ({
  tasks,
  selectedTask,
  onSelectTask,
}) => {
  const [activeTask, setActiveTask] = useState<TaskItem | undefined>(
    selectedTask || tasks.find((t) => t.id === 'task_create_ppt') || tasks[0]
  );

  const [activeView, setActiveView] = useState<'timer' | 'summary'>('timer');
  const [mode, setMode] = useState<FocusTimerMode>('work');
  const [lastFocusMode, setLastFocusMode] = useState<'work' | 'deepFocus'>('work');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Completion banner (non-blocking alternative to window.alert)
  const [statusBanner, setStatusBanner] = useState<{
    title: string;
    message: string;
    tone: 'success' | 'info';
  } | null>(null);

  // Calming audio state
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [soundscape, setSoundscape] = useState<CalmingSoundscapeId>('calmMusic');
  const [audioVolume, setAudioVolume] = useState(0.45);
  const audioEngineRef = useRef<CalmingAudioEngine | null>(null);

  // Daily focus summary stats synced with D1TaskStoreService
  const [dailySummary, setDailySummary] = useState<DailyFocusStats[]>(() =>
    D1TaskStoreService.getDailyFocusSummary(7)
  );
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(() =>
    D1TaskStoreService.getDailyFocusGoalMinutes()
  );

  const refreshSummary = useCallback(() => {
    setDailySummary(D1TaskStoreService.getDailyFocusSummary(7));
    setDailyGoalMinutes(D1TaskStoreService.getDailyFocusGoalMinutes());
  }, []);

  useEffect(() => {
    const unsub = D1TaskStoreService.subscribe(() => {
      refreshSummary();
      const updatedTasks = D1TaskStoreService.getTasks();
      setActiveTask((prev) => {
        if (!prev) return updatedTasks[0];
        return updatedTasks.find((t) => t.id === prev.id) || updatedTasks[0];
      });
    });
    return () => unsub();
  }, [refreshSummary]);

  // Sync if selectedTask changes from parent
  useEffect(() => {
    if (selectedTask) {
      setActiveTask(selectedTask);
    }
  }, [selectedTask]);

  const playChime = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
      window.setTimeout(() => {
        ctx.close().catch(() => {});
      }, 1000);
    } catch {
      // AudioContext blocked or unavailable
    }
  }, []);

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    playChime();

    if (mode === 'work' || mode === 'deepFocus') {
      const loggedMins = MODE_CONFIG[mode].minutes;
      D1TaskStoreService.logFocusMinutes(activeTask?.id, loggedMins, mode);
      refreshSummary();

      if (mode === 'deepFocus') {
        setMode('longBreak');
        setDurationMinutes(15);
        setSecondsLeft(15 * 60);
        setStatusBanner({
          title: 'Deep Focus Complete!',
          message: `Logged ${loggedMins}m${activeTask ? ` to "${activeTask.title}"` : ''}. Take a 15-minute break.`,
          tone: 'success',
        });
      } else {
        setMode('shortBreak');
        setDurationMinutes(5);
        setSecondsLeft(5 * 60);
        setStatusBanner({
          title: 'Pomodoro Complete!',
          message: `Logged ${loggedMins}m${activeTask ? ` to "${activeTask.title}"` : ''}. Enjoy a 5-minute break.`,
          tone: 'success',
        });
      }
    } else {
      const resumeMode = lastFocusMode;
      const nextMins = MODE_CONFIG[resumeMode].minutes;
      setMode(resumeMode);
      setDurationMinutes(nextMins);
      setSecondsLeft(nextMins * 60);
      setStatusBanner({
        title: 'Break Complete',
        message: `Ready for your next ${MODE_CONFIG[resumeMode].label} (${nextMins}m) session.`,
        tone: 'info',
      });
    }
  }, [activeTask, lastFocusMode, mode, playChime, refreshSummary]);

  // Handle timer countdown cleanly
  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft <= 0) {
      handleSessionComplete();
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, secondsLeft, handleSessionComplete]);

  // Calming audio lifecycle
  const getAudioEngine = () => {
    if (!audioEngineRef.current) {
      audioEngineRef.current = new CalmingAudioEngine();
    }
    return audioEngineRef.current;
  };

  const toggleAmbientAudio = () => {
    const engine = getAudioEngine();
    if (isAudioEnabled) {
      engine.stop();
      setIsAudioEnabled(false);
    } else {
      const started = engine.start(soundscape, audioVolume);
      setIsAudioEnabled(started);
    }
  };

  const handleSelectSoundscape = (nextPreset: CalmingSoundscapeId) => {
    setSoundscape(nextPreset);
    const engine = getAudioEngine();
    if (isAudioEnabled) {
      engine.start(nextPreset, audioVolume);
    }
  };

  const handleVolumeChange = (nextVol: number) => {
    setAudioVolume(nextVol);
    if (audioEngineRef.current && isAudioEnabled) {
      audioEngineRef.current.setVolume(nextVol);
    }
  };

  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
    };
  }, []);

  const setTimerMode = (newMode: FocusTimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'work' || newMode === 'deepFocus') {
      setLastFocusMode(newMode);
    }
    const mins = MODE_CONFIG[newMode].minutes;
    setDurationMinutes(mins);
    setSecondsLeft(mins * 60);
    setStatusBanner(null);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSeconds = durationMinutes * 60;
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const todayStats = dailySummary[0] || {
    date: '',
    totalMinutes: 0,
    sessionsCount: 0,
    deepFocusSessions: 0,
    pomodoroSessions: 0,
  };
  const todayGoalPercent = Math.min(100, Math.round((todayStats.totalMinutes / dailyGoalMinutes) * 100));
  const sevenDayTotalMinutes = dailySummary.reduce((sum, d) => sum + d.totalMinutes, 0);
  const sevenDayAvgMinutes = Math.round(sevenDayTotalMinutes / Math.max(1, dailySummary.length));
  const activeDaysCount = dailySummary.filter((d) => d.totalMinutes > 0).length;

  return (
    <div className="flex-1 w-full flex flex-col p-4 overflow-y-auto bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 dark:from-black dark:via-zinc-950 dark:to-black">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-zinc-400">
            Level 1 DFD: Pomodoro (FM)
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
            Focus Mode Engine
          </h2>
        </div>

        <button
          onClick={toggleAmbientAudio}
          className={`px-2.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
            isAudioEnabled
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100'
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
          }`}
          title="Toggle calming productivity music"
        >
          {isAudioEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-600 dark:text-zinc-100" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
          <span className="text-[11px] font-semibold">
            {isAudioEnabled ? 'Music On' : 'Sound Off'}
          </span>
        </button>
      </div>

      {/* View Switcher: Focus Timer vs Daily Summary */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-xl mb-4">
        <button
          onClick={() => setActiveView('timer')}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeView === 'timer'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Focus Timer</span>
        </button>

        <button
          onClick={() => setActiveView('summary')}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeView === 'summary'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Daily Summary</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-zinc-700 dark:text-zinc-100">
            {formatDurationShort(todayStats.totalMinutes)}
          </span>
        </button>
      </div>

      {/* In-App Session Complete Notification Banner */}
      {statusBanner && (
        <div
          className={`mb-4 rounded-2xl p-3 border flex items-start justify-between gap-2 text-xs ${
            statusBanner.tone === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100'
          }`}
        >
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-zinc-200" />
            <div>
              <p className="font-bold">{statusBanner.title}</p>
              <p className="text-[11px] opacity-90 mt-0.5">{statusBanner.message}</p>
            </div>
          </div>
          <button
            onClick={() => setStatusBanner(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activeView === 'summary' ? (
        /* ==================== SUMMARY VIEW ==================== */
        <div className="space-y-4 pb-6">
          {/* Today's Total Focus Progress Ring Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Today&apos;s Focus Progress
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Daily Focus Time Target
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-zinc-800 dark:text-zinc-200">
                {todayGoalPercent}% of goal
              </span>
            </div>

            <div className="flex items-center gap-4">
              <SimpleProgressRing
                percent={todayGoalPercent}
                size={124}
                strokeWidth={10}
                progressClassName={
                  todayGoalPercent >= 100
                    ? 'stroke-emerald-500 dark:stroke-zinc-100'
                    : 'stroke-indigo-600 dark:stroke-zinc-200'
                }
              >
                <span className="text-xl font-extrabold text-slate-900 dark:text-zinc-100 font-mono">
                  {formatDurationShort(todayStats.totalMinutes)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                  of {formatDurationShort(dailyGoalMinutes)}
                </span>
              </SimpleProgressRing>

              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                      Sessions Today
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {todayStats.sessionsCount}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                      Deep Focus
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {todayStats.deepFocusSessions} × 45m
                    </span>
                  </div>
                </div>

                {/* Daily Goal Selector */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 block mb-1">
                    Daily Goal Target:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[60, 120, 180, 240].map((goalMins) => (
                      <button
                        key={goalMins}
                        onClick={() => D1TaskStoreService.setDailyFocusGoalMinutes(goalMins)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          dailyGoalMinutes === goalMins
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800'
                        }`}
                      >
                        {formatDurationShort(goalMins)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Stats Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-2.5 border border-slate-200 dark:border-zinc-800">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">7-Day Total</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 font-mono">
                {formatDurationShort(sevenDayTotalMinutes)}
              </span>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-2.5 border border-slate-200 dark:border-zinc-800">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Daily Avg</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 font-mono">
                {formatDurationShort(sevenDayAvgMinutes)}
              </span>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-2.5 border border-slate-200 dark:border-zinc-800">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Active Days</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 font-mono flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-zinc-300" />
                {activeDaysCount}/7
              </span>
            </div>
          </div>

          {/* Total Focus Time Spent Per Day (7-Day Breakdown with Simple Progress Rings) */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-zinc-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                  Focus Time Per Day (Last 7 Days)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                Goal: {formatDurationShort(dailyGoalMinutes)}/day
              </span>
            </div>

            <div className="space-y-2.5">
              {dailySummary.map((day, idx) => {
                const dayPercent = Math.min(
                  100,
                  Math.round((day.totalMinutes / dailyGoalMinutes) * 100)
                );
                return (
                  <div
                    key={day.date}
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${
                      idx === 0
                        ? 'bg-indigo-50/50 border-indigo-200/80 dark:bg-zinc-800/60 dark:border-zinc-700'
                        : 'bg-slate-50/70 border-slate-100 dark:bg-zinc-950 dark:border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <SimpleProgressRing
                        percent={dayPercent}
                        size={42}
                        strokeWidth={4}
                        progressClassName={
                          dayPercent >= 100
                            ? 'stroke-emerald-500 dark:stroke-zinc-100'
                            : 'stroke-indigo-600 dark:stroke-zinc-300'
                        }
                      >
                        <span className="text-[9px] font-bold text-slate-700 dark:text-zinc-200 font-mono">
                          {dayPercent}%
                        </span>
                      </SimpleProgressRing>

                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                          {formatDayLabel(day.date, idx)}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                          {day.sessionsCount === 0
                            ? 'No sessions logged'
                            : `${day.sessionsCount} session${day.sessionsCount > 1 ? 's' : ''} (${day.pomodoroSessions} Pomodoro, ${day.deepFocusSessions} Deep)`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold font-mono text-slate-900 dark:text-zinc-100">
                        {formatDurationShort(day.totalMinutes)}
                      </span>
                      <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        {day.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== TIMER VIEW ==================== */
        <div className="pb-6">
          {/* Compact Daily Progress Ring Strip (Clickable to open Summary View) */}
          <button
            onClick={() => setActiveView('summary')}
            className="w-full mb-4 bg-white dark:bg-zinc-900 rounded-2xl p-2.5 border border-slate-200 dark:border-zinc-800 flex items-center justify-between hover:border-indigo-300 dark:hover:border-zinc-600 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <SimpleProgressRing
                percent={todayGoalPercent}
                size={40}
                strokeWidth={4}
                progressClassName="stroke-indigo-600 dark:stroke-zinc-100"
              >
                <span className="text-[9px] font-bold text-slate-800 dark:text-zinc-100 font-mono">
                  {todayGoalPercent}%
                </span>
              </SimpleProgressRing>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                  Today&apos;s Focus: {formatDurationShort(todayStats.totalMinutes)}{' '}
                  <span className="font-normal text-slate-500 dark:text-zinc-400">
                    / {formatDurationShort(dailyGoalMinutes)}
                  </span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {todayStats.sessionsCount} sessions today · Tap for daily summary
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-zinc-300 px-2">
              Summary →
            </span>
          </button>

          {/* Linked Task Selector */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-slate-200 dark:border-zinc-800 mb-4 shadow-xs">
            <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 block mb-1">
              Active Task Target:
            </label>
            <div className="flex items-center justify-between gap-2">
              <select
                value={activeTask?.id || ''}
                onChange={(e) => {
                  const found = tasks.find((t) => t.id === e.target.value);
                  if (found) {
                    setActiveTask(found);
                    onSelectTask(found);
                  }
                }}
                className="w-full text-xs font-bold text-slate-900 dark:text-zinc-100 bg-transparent outline-none cursor-pointer truncate"
              >
                {tasks.map((t) => (
                  <option key={t.id} value={t.id} className="dark:bg-zinc-900 dark:text-zinc-100">
                    {t.title} ({t.category})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-zinc-800">
              <span>
                Logged Time:{' '}
                <strong className="text-indigo-600 dark:text-zinc-200 font-mono">
                  {activeTask?.focusMinutesSpent || 0}m
                </strong>
              </span>
              <span>·</span>
              <span>
                Priority: <strong className="capitalize">{activeTask?.priority || 'medium'}</strong>
              </span>
            </div>
          </div>

          {/* 4-Mode Switcher Tabs: Pomodoro (25m), Deep Focus (45m), Break (5m), Long Break (15m) */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-xl mb-4 text-[11px] font-medium">
            <button
              onClick={() => setTimerMode('work')}
              className={`py-1.5 px-1 rounded-lg transition-all flex flex-col items-center leading-tight ${
                mode === 'work'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-zinc-100 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              <span>Pomodoro</span>
              <span className="text-[10px] opacity-80">25m</span>
            </button>

            <button
              onClick={() => setTimerMode('deepFocus')}
              className={`py-1.5 px-1 rounded-lg transition-all flex flex-col items-center leading-tight ${
                mode === 'deepFocus'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-zinc-100 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              <span className="flex items-center gap-0.5">
                <Brain className="w-3 h-3" />
                Deep
              </span>
              <span className="text-[10px] opacity-80">45m</span>
            </button>

            <button
              onClick={() => setTimerMode('shortBreak')}
              className={`py-1.5 px-1 rounded-lg transition-all flex flex-col items-center leading-tight ${
                mode === 'shortBreak'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-zinc-100 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              <span>Break</span>
              <span className="text-[10px] opacity-80">5m</span>
            </button>

            <button
              onClick={() => setTimerMode('longBreak')}
              className={`py-1.5 px-1 rounded-lg transition-all flex flex-col items-center leading-tight ${
                mode === 'longBreak'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-zinc-100 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              <span>Long Break</span>
              <span className="text-[10px] opacity-80">15m</span>
            </button>
          </div>

          {/* Circular Progress Timer Display */}
          <div className="relative w-60 h-60 mx-auto flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-slate-200 dark:stroke-zinc-800"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={`${
                  mode === 'deepFocus'
                    ? 'stroke-violet-600 dark:stroke-zinc-100'
                    : mode === 'shortBreak' || mode === 'longBreak'
                      ? 'stroke-emerald-500 dark:stroke-zinc-300'
                      : 'stroke-indigo-600 dark:stroke-zinc-200'
                } transition-all duration-500 ease-linear`}
                strokeWidth="6"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-zinc-100 font-mono tracking-tight">
                {timeFormatted}
              </span>
              <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-zinc-400 mt-1 tracking-wider">
                {MODE_CONFIG[mode].label}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-zinc-400 font-medium mt-0.5">
                {MODE_CONFIG[mode].caption}
              </span>
            </div>
          </div>

          {/* Primary Action Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => {
                setIsRunning(false);
                setSecondsLeft(durationMinutes * 60);
              }}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                setStatusBanner(null);
                setIsRunning(!isRunning);
              }}
              className="px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 active:scale-95 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 dark:shadow-none transition-all flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>{mode === 'deepFocus' ? 'Start Deep Focus' : 'Start Focus'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleSessionComplete}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
              title="Complete & advance to next interval"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Calming Productivity Music Controls */}
          <div className="mt-5 bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-slate-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-zinc-800 flex items-center justify-center">
                  <Music className="w-3.5 h-3.5 text-indigo-600 dark:text-zinc-200" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    Calming Focus Music
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Ambient audio engineered for concentration
                  </p>
                </div>
              </div>

              <button
                onClick={toggleAmbientAudio}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                  isAudioEnabled
                    ? 'bg-emerald-600 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {isAudioEnabled ? 'Playing' : 'Play Music'}
              </button>
            </div>

            {/* Soundscape Presets */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {CALMING_SOUNDSCAPES.map((opt) => {
                const isSelected = soundscape === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectSoundscape(opt.id)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100'
                        : 'bg-slate-50/70 border-slate-200/70 text-slate-600 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    <p className="text-[11px] font-bold truncate">{opt.name}</p>
                    <p className="text-[9px] opacity-80 truncate">{opt.subtitle}</p>
                  </button>
                );
              })}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
              <input
                type="range"
                min={5}
                max={100}
                value={Math.round(audioVolume * 100)}
                onChange={(e) => handleVolumeChange(Number(e.target.value) / 100)}
                aria-label="Calming music volume"
                className="w-full h-1.5 accent-indigo-600 dark:accent-zinc-200 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 w-8 text-right">
                {Math.round(audioVolume * 100)}%
              </span>
            </div>
          </div>

          {/* Subtasks Checklist for Active Task */}
          {activeTask && activeTask.subtasks.length > 0 && (
            <div className="mt-4 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 tracking-wider block mb-2">
                Focus Checklist for Current Task:
              </span>
              <div className="space-y-1.5">
                {activeTask.subtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => D1TaskStoreService.toggleSubtask(activeTask.id, st.id)}
                    className="flex items-center gap-2 text-xs p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <div className="w-4 h-4 rounded border border-slate-300 dark:border-zinc-700 flex items-center justify-center">
                      {st.completed && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <span
                      className={
                        st.completed
                          ? 'line-through text-slate-400 dark:text-zinc-500'
                          : 'text-slate-800 dark:text-zinc-200'
                      }
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
