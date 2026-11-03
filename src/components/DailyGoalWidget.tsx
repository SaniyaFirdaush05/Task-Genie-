import React, { useState, useEffect } from 'react';
import { DailyGoal, TaskItem } from '../types/task';
import { D1TaskStoreService } from '../store/taskStore';
import {
  Target,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Play,
  Sparkles,
  Link2,
  Check,
  X,
  Flame,
  Award,
} from 'lucide-react';

interface DailyGoalWidgetProps {
  tasks: TaskItem[];
  onStartFocus?: (task: TaskItem) => void;
  onOpenCreateTask?: (templateTitle?: string) => void;
}

export const DailyGoalWidget: React.FC<DailyGoalWidgetProps> = ({
  tasks,
  onStartFocus,
  onOpenCreateTask,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [goal, setGoal] = useState<DailyGoal | null>(() => D1TaskStoreService.getDailyGoal(todayStr));
  const [isEditing, setIsEditing] = useState(false);
  const [objectiveInput, setObjectiveInput] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [justCompleted, setJustCompleted] = useState(false);

  // Sync with store updates
  useEffect(() => {
    const syncGoal = () => {
      setGoal(D1TaskStoreService.getDailyGoal(todayStr));
    };
    const unsubscribe = D1TaskStoreService.subscribe(syncGoal);
    return () => unsubscribe();
  }, [todayStr]);

  const todayTasks = tasks.filter((t) => t.dueDate === todayStr && t.status !== 'completed');
  const highPriorityTasks = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed');
  const candidateTasks = todayTasks.length > 0 ? todayTasks : highPriorityTasks;

  const handleStartEditing = () => {
    setObjectiveInput(goal?.objective || '');
    setSelectedTaskId(goal?.linkedTaskId || '');
    setIsEditing(true);
  };

  const handleSaveGoal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!objectiveInput.trim()) return;

    const newGoal: DailyGoal = {
      id: goal?.id || `goal_${todayStr}`,
      objective: objectiveInput.trim(),
      date: todayStr,
      completed: goal?.completed || false,
      linkedTaskId: selectedTaskId || undefined,
      createdAt: goal?.createdAt || new Date().toISOString(),
    };

    D1TaskStoreService.setDailyGoal(newGoal, todayStr);
    setGoal(newGoal);
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    if (!goal) return;
    const willBeComplete = !goal.completed;
    const updated = D1TaskStoreService.toggleDailyGoalComplete(todayStr);
    setGoal(updated);

    if (willBeComplete) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 3000);
      return () => clearTimeout(timer);
    }
  };

  const handleClearGoal = () => {
    D1TaskStoreService.setDailyGoal(null, todayStr);
    setGoal(null);
    setIsEditing(false);
  };

  const handleSelectTaskCandidate = (task: TaskItem) => {
    setObjectiveInput(task.title);
    setSelectedTaskId(task.id);
  };

  // Find linked task if available
  const linkedTask = goal?.linkedTaskId
    ? tasks.find((t) => t.id === goal.linkedTaskId)
    : undefined;

  // Format today's date for header: e.g. "Tuesday, Nov 3"
  const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 to-black dark:from-zinc-950 dark:to-black text-white p-4 border border-zinc-800 shadow-lg">
      {/* Subtle background radial glow */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase font-mono">
                Daily Focus Goal
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-zinc-400">Single #1 priority objective</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
            {formattedToday}
          </span>
          {goal && !isEditing && (
            <button
              onClick={handleStartEditing}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Edit Daily Goal"
              aria-label="Edit Daily Goal"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Editing State / Set Goal Form */}
      {isEditing || !goal ? (
        <form onSubmit={handleSaveGoal} className="space-y-3 relative z-10">
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
              What single objective must get done today?
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="e.g., Deliver keynote presentation deck & review architecture"
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>

          {/* Quick pick from today's active tasks if any */}
          {candidateTasks.length > 0 && (
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5 font-medium">
                Or pick from today's high-priority tasks:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {candidateTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleSelectTaskCandidate(task)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border text-left truncate max-w-full transition-all flex items-center gap-1.5 ${
                      selectedTaskId === task.id || objectiveInput === task.title
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <Link2 className="w-3 h-3 shrink-0 text-amber-400" />
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1">
            {goal ? (
              <button
                type="button"
                onClick={handleClearGoal}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Goal</span>
              </button>
            ) : (
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                Focus on 1 win today
              </span>
            )}

            <div className="flex items-center gap-2">
              {goal && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!objectiveInput.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Set Daily Goal</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Display Mode of Active Goal */
        <div className="space-y-3 relative z-10">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90">
            {/* Completion Check Circle */}
            <button
              onClick={handleToggleComplete}
              className="mt-0.5 text-zinc-400 hover:text-amber-400 transition-colors shrink-0"
              title={goal.completed ? 'Mark uncompleted' : 'Mark daily goal completed!'}
              aria-label="Toggle goal completion"
            >
              {goal.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
              ) : (
                <Circle className="w-5 h-5 stroke-[2] hover:stroke-amber-400" />
              )}
            </button>

            {/* Objective text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className={`text-xs font-semibold leading-snug transition-all ${
                    goal.completed
                      ? 'line-through text-zinc-400'
                      : 'text-zinc-100'
                  }`}
                >
                  {goal.objective}
                </h3>
              </div>

              {/* Linked Task badge / Focus mode info */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {linkedTask ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-medium">
                    <Link2 className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[140px]">{linkedTask.title}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400">High-Priority Focus</span>
                )}

                {goal.completed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <Award className="w-2.5 h-2.5" />
                    <span>Completed!</span>
                  </span>
                )}
              </div>
            </div>

            {/* Focus Button */}
            {onStartFocus && (
              <button
                onClick={() => {
                  if (linkedTask) {
                    onStartFocus(linkedTask);
                  } else {
                    // Create lightweight ephemeral task representation to focus on
                    const virtualTask: TaskItem = {
                      id: goal.id,
                      title: goal.objective,
                      description: 'Daily Focus Goal Objective',
                      category: 'Work',
                      priority: 'high',
                      status: goal.completed ? 'completed' : 'in_progress',
                      dueDate: todayStr,
                      isRecurring: false,
                      subtasks: [],
                      attachments: [],
                      comments: [],
                      focusMinutesSpent: 0,
                      createdAt: goal.createdAt,
                    };
                    onStartFocus(virtualTask);
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-colors border border-zinc-700/60 shrink-0"
                title="Launch Pomodoro Focus Mode for this objective"
              >
                <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Focus</span>
              </button>
            )}
          </div>

          {/* Just Completed Celebration Toast / Banner */}
          {justCompleted && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px] animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Boom! Daily goal achieved. Outstanding focus today!</span>
              </div>
              <button
                onClick={() => setJustCompleted(false)}
                className="text-emerald-400 hover:text-emerald-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
