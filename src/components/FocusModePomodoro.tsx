import React, { useState, useEffect, useRef } from 'react';
import { TaskItem } from '../types/task';
import { D1TaskStoreService } from '../store/taskStore';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle,
  Timer,
  ChevronDown,
} from 'lucide-react';

interface FocusModePomodoroProps {
  tasks: TaskItem[];
  selectedTask?: TaskItem | null;
  onSelectTask: (task: TaskItem) => void;
  onExitFocus: () => void;
}

export const FocusModePomodoro: React.FC<FocusModePomodoroProps> = ({
  tasks,
  selectedTask,
  onSelectTask,
  onExitFocus,
}) => {
  const [activeTask, setActiveTask] = useState<TaskItem>(
    selectedTask || tasks.find((t) => t.id === 'task_create_ppt') || tasks[0]
  );

  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(1);

  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Sync if selectedTask changes from parent
  useEffect(() => {
    if (selectedTask) {
      setActiveTask(selectedTask);
    }
  }, [selectedTask]);

  // Handle timer countdown
  useEffect(() => {
    let timer: any = null;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      handleSessionComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  // Audio synthesis for ambient focus noise (Web Audio API)
  const toggleAmbientAudio = () => {
    if (isAudioEnabled) {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsAudioEnabled(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // Create pink/brown ambient noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2) * 0.04;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Warm soft hum

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.3;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();
        noiseNodeRef.current = whiteNoise;
        setIsAudioEnabled(true);
      } catch (err) {
        console.warn('Web Audio Ambient not supported', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSessionComplete = () => {
    setIsRunning(false);

    if (mode === 'work') {
      // Log focus minutes into D1 TaskStore!
      if (activeTask) {
        D1TaskStoreService.logFocusMinutes(activeTask.id, durationMinutes);
      }
      setCompletedSessionsCount((c) => c + 1);

      // Play soft completion chime
      playChime();

      // Switch to break
      setMode('shortBreak');
      setDurationMinutes(5);
      setSecondsLeft(5 * 60);
      alert(`🎉 Focus session complete! Logged ${durationMinutes} minutes to "${activeTask.title}". Time for a 5-minute break.`);
    } else {
      setMode('work');
      setDurationMinutes(25);
      setSecondsLeft(25 * 60);
      alert('Break is over! Ready to resume focus?');
    }
  };

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
    } catch {}
  };

  const setTimerMode = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setMode(newMode);
    const mins = newMode === 'work' ? 25 : newMode === 'shortBreak' ? 5 : 15;
    setDurationMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSeconds = durationMinutes * 60;
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const strokeDashoffset = 100 - progressPercent;

  return (
    <div className="flex-1 w-full flex flex-col p-4 overflow-y-auto bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 dark:from-black dark:via-zinc-950 dark:to-black">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
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
          className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
            isAudioEnabled
              ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100'
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
          }`}
          title="Toggle ambient focus white noise"
        >
          {isAudioEnabled ? <Volume2 className="w-4 h-4 text-amber-600 dark:text-zinc-200" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-[11px] hidden xs:inline">{isAudioEnabled ? 'Audio Active' : 'Sound Off'}</span>
        </button>
      </div>

      {/* Linked Task Selector */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-slate-200 dark:border-zinc-800 mb-6 shadow-xs">
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
          <span>Logged Time: <strong className="text-indigo-600 dark:text-zinc-200 font-mono">{activeTask?.focusMinutesSpent || 0}m</strong></span>
          <span>·</span>
          <span>Priority: <strong className="capitalize">{activeTask?.priority}</strong></span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl max-w-xs mx-auto mb-6 text-xs font-medium">
        <button
          onClick={() => setTimerMode('work')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            mode === 'work'
              ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-zinc-100 font-bold shadow-xs'
              : 'text-slate-600 dark:text-zinc-400'
          }`}
        >
          Work (25m)
        </button>
        <button
          onClick={() => setTimerMode('shortBreak')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            mode === 'shortBreak'
              ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-zinc-100 font-bold shadow-xs'
              : 'text-slate-600 dark:text-zinc-400'
          }`}
        >
          Break (5m)
        </button>
        <button
          onClick={() => setTimerMode('longBreak')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            mode === 'longBreak'
              ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-zinc-100 font-bold shadow-xs'
              : 'text-slate-600 dark:text-zinc-400'
          }`}
        >
          Rest (15m)
        </button>
      </div>

      {/* Circular Progress Timer Display */}
      <div className="relative w-64 h-64 mx-auto flex items-center justify-center my-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            className="stroke-slate-200 dark:stroke-zinc-800"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Progress animated circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            className="stroke-indigo-600 dark:stroke-zinc-200 transition-all duration-500 ease-linear"
            strokeWidth="6"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * progressPercent) / 100}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold text-slate-900 dark:text-zinc-100 font-mono tracking-tight">
            {timeFormatted}
          </span>
          <span className="text-xs uppercase font-bold text-slate-400 dark:text-zinc-500 mt-1 tracking-wider">
            {mode === 'work' ? 'Deep Focus Session' : 'Resting Interval'}
          </span>
          <span className="text-[11px] text-indigo-600 dark:text-zinc-400 font-medium mt-1">
            Session #{completedSessionsCount} today
          </span>
        </div>
      </div>

      {/* Primary Action Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
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
          onClick={() => setIsRunning(!isRunning)}
          className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 active:scale-95 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 dark:shadow-none transition-all flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Start Focus</span>
            </>
          )}
        </button>

        <button
          onClick={handleSessionComplete}
          className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
          title="Skip to next session"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Subtasks Checklist for Active Task */}
      {activeTask && activeTask.subtasks.length > 0 && (
        <div className="mt-8 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800">
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
                <span className={st.completed ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-800 dark:text-zinc-200'}>
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
