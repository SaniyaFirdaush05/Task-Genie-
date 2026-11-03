import React, { useState } from 'react';
import { TaskItem, TaskCategory, UserProfile } from '../types/task';
import { D1TaskStoreService } from '../store/taskStore';
import { GenieService } from '../services/genieService';
import {
  CheckCircle2,
  Circle,
  Clock,
  Paperclip,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  Trash2,
  Edit2,
  AlertCircle,
  Repeat,
  Check,
  X,
  CornerUpLeft,
  Search,
} from 'lucide-react';

interface TaskDashboardProps {
  tasks: TaskItem[];
  currentUser: UserProfile;
  onOpenCreateTask: (templateTitle?: string) => void;
  onEditTask: (task: TaskItem) => void;
  onStartFocus: (task: TaskItem) => void;
  onOpenGenieWithTask: (task: TaskItem) => void;
  onSelectTab: (tab: 'tasks' | 'calendar' | 'collaboration' | 'focus' | 'analytics') => void;
  activeMainTab: 'tasks' | 'calendar' | 'collaboration' | 'focus' | 'analytics';
  isFilterOpen: boolean;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({
  tasks,
  currentUser,
  onOpenCreateTask,
  onEditTask,
  onStartFocus,
  onOpenGenieWithTask,
  onSelectTab,
  activeMainTab,
  isFilterOpen,
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>('task_create_ppt');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [dividingTaskId, setDividingTaskId] = useState<string | null>(null);

  // Categories matching user's diagram
  const categories = ['All', 'Assignment', 'Work', 'Project', 'Meeting', 'Study'];

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const matchQuery =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchQuery) return false;
    }
    if (selectedCategory !== 'All' && t.category !== selectedCategory) {
      return false;
    }
    if (statusFilter === 'pending' && t.status === 'completed') return false;
    if (statusFilter === 'completed' && t.status !== 'completed') return false;
    return true;
  });

  // Group day-wise as requested in sketch
  const todayTasks = filteredTasks.filter((t) => t.dueDate === todayStr);
  const upcomingTasks = filteredTasks.filter((t) => t.dueDate > todayStr);
  const overdueOrPastTasks = filteredTasks.filter((t) => t.dueDate < todayStr && t.status !== 'completed');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

  const handleToggleTaskStatus = (task: TaskItem) => {
    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    D1TaskStoreService.updateTask(task.id, { status: newStatus });
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    D1TaskStoreService.toggleSubtask(taskId, subtaskId);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Delete this task from D1 TaskStore?')) {
      D1TaskStoreService.deleteTask(taskId);
    }
  };

  const handleAiDivideSubtasks = async (task: TaskItem) => {
    setDividingTaskId(task.id);
    try {
      const subtasks = await GenieService.divideSubtasks(task.title, task.description, task.dueDate);
      if (subtasks && subtasks.length > 0) {
        D1TaskStoreService.updateTask(task.id, {
          subtasks: [...task.subtasks, ...subtasks],
        });
        setExpandedTaskId(task.id);
      }
    } finally {
      setDividingTaskId(null);
    }
  };

  const handleAssignmentResponse = (task: TaskItem, response: 'accepted' | 'resigned' | 'rejected') => {
    const promptNote =
      response === 'rejected'
        ? prompt('Reason for rejecting task (sent to Manager):', 'Scheduling conflict')
        : response === 'resigned'
        ? prompt('Reason for resigning task (sent to Manager):', 'Bandwidth constrained')
        : undefined;

    if (response !== 'accepted' && promptNote === null) return; // User cancelled prompt

    D1TaskStoreService.respondToAssignment(task.id, response, promptNote || undefined);
  };

  // Helper to render priority styling (disciplined, non-pill anti-slop style)
  const renderPriority = (priority: string) => {
    if (priority === 'high') {
      return <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">High priority</span>;
    }
    if (priority === 'medium') {
      return <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">Med priority</span>;
    }
    return <span className="text-slate-500 font-normal text-[11px]">Low priority</span>;
  };

  const renderTaskCard = (task: TaskItem) => {
    const isExpanded = expandedTaskId === task.id;
    const isCompleted = task.status === 'completed';
    const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
    const isPendingAcceptance = task.assignmentStatus === 'pending_acceptance';

    return (
      <div
        key={task.id}
        className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden ${
          isCompleted
            ? 'border-slate-200/60 dark:border-slate-800/60 opacity-80'
            : isPendingAcceptance
            ? 'border-amber-300 dark:border-amber-700/60 shadow-sm'
            : 'border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300'
        }`}
      >
        <div className="p-3.5">
          {/* Top Line: Category / Due Date / Priority */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{task.category}</span>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{task.dueDate === todayStr ? 'Today' : task.dueDate}</span>
                {task.dueTime && <span>{task.dueTime}</span>}
              </div>
              {task.isRecurring && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400">
                    <Repeat className="w-2.5 h-2.5" />
                    <span>{task.recurringFrequency}</span>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {renderPriority(task.priority)}
            </div>
          </div>

          {/* Main Title Row with Checkbox (as drawn in wireframe circle) */}
          <div className="flex items-start gap-2.5">
            <button
              onClick={() => handleToggleTaskStatus(task)}
              className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
              title={isCompleted ? 'Mark incomplete' : 'Mark as done'}
              aria-label={isCompleted ? 'Mark incomplete' : 'Mark as done'}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/40" />
              ) : (
                <Circle className="w-5 h-5 stroke-[1.75]" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <h3
                className={`text-sm font-semibold text-slate-900 dark:text-white leading-snug break-words ${
                  isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                }`}
              >
                {task.title}
              </h3>

              {task.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Pending Assignment Approval Banner (From Notes: User -> Accept / Resign / Reject) */}
          {isPendingAcceptance && (
            <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Work Assigned by {task.assignedBy || 'Manager'}</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mb-2">
                Awaiting your response according to Context Diagram specifications.
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleAssignmentResponse(task, 'accepted')}
                  className="px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Accept</span>
                </button>
                <button
                  onClick={() => handleAssignmentResponse(task, 'resigned')}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 rounded-lg transition-colors flex items-center gap-1"
                >
                  <CornerUpLeft className="w-3 h-3" />
                  <span>Resign</span>
                </button>
                <button
                  onClick={() => handleAssignmentResponse(task, 'rejected')}
                  className="px-2.5 py-1 text-xs font-medium bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          )}

          {/* Subtasks summary & Attachment chips */}
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              {task.subtasks.length > 0 && (
                <button
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  <span>
                    Subtasks: {completedSubtasks}/{task.subtasks.length}
                  </span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}

              {task.attachments.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Paperclip className="w-3 h-3 text-slate-400" />
                  <span>{task.attachments.length} attachment{task.attachments.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Focus Mode trigger (Level 1: Pomodoro FM) */}
              <button
                onClick={() => onStartFocus(task)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                title="Start Focus Mode (Pomodoro FM)"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>

              <button
                onClick={() => onEditTask(task)}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Task"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleDeleteTask(task.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subtasks Dropdown List */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <span>Subtasks Division ({completedSubtasks}/{task.subtasks.length})</span>
                <button
                  disabled={dividingTaskId === task.id}
                  onClick={() => handleAiDivideSubtasks(task)}
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                  title="Ask Genie AI to automatically divide into subtasks"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{dividingTaskId === task.id ? 'Dividing...' : 'AI Subtasks'}</span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                  style={{
                    width: task.subtasks.length ? `${(completedSubtasks / task.subtasks.length) * 100}%` : '0%',
                  }}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                {task.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => handleToggleSubtask(task.id, sub.id)}
                    className="flex items-center gap-2 text-xs p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none group"
                  >
                    <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                      {sub.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/30" />
                      ) : (
                        <Circle className="w-4 h-4 stroke-[1.75]" />
                      )}
                    </div>
                    <span
                      className={`flex-1 text-[11px] text-slate-700 dark:text-slate-300 ${
                        sub.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {sub.title}
                    </span>
                    {sub.estimatedMinutes && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {sub.estimatedMinutes}m
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Attachments Section */}
              {task.attachments.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Attachments (PPT / Assignment)
                  </span>
                  <div className="space-y-1">
                    {task.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-xs border border-slate-200/50 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">
                            {att.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                          {att.size}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col overflow-y-auto">
      {/* 3 Main Tabs as drawn in the wireframe: [ • Task ] [ • Calendar ] [ • Collaboration ] */}
      <div className="px-4 pt-3 pb-1 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => onSelectTab('tasks')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeMainTab === 'tasks'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="text-base leading-none">•</span>
            <span>Task</span>
          </button>

          <button
            onClick={() => onSelectTab('calendar')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeMainTab === 'calendar'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="text-base leading-none">•</span>
            <span>Calendar</span>
          </button>

          <button
            onClick={() => onSelectTab('collaboration')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeMainTab === 'collaboration'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="text-base leading-none">•</span>
            <span>Collaboration</span>
          </button>
        </div>

        {/* Filter Drawer / Search when toggled */}
        {isFilterOpen && (
          <div className="mt-2.5 pb-2 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks, PPTs, deadlines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category horizontal scrolling bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap text-[11px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Content Stream */}
      <div className="p-4 space-y-5">
        {/* Quick Template Pill Button: [ Task -> Create PPT ] from sketch notes */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/30 dark:to-purple-950/30 p-3 rounded-2xl border border-indigo-200/50 dark:border-indigo-900/50 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              Quick Assignment Template
            </span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              Task → Create PPT Deck
            </p>
          </div>
          <button
            onClick={() => onOpenCreateTask('Create PPT')}
            className="px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shrink-0"
          >
            + Use Template
          </button>
        </div>

        {/* Day-Wise Section 1: Today */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Today's Tasks
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                {todayTasks.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">{todayStr}</span>
          </div>

          <div className="space-y-2.5">
            {todayTasks.length > 0 ? (
              todayTasks.map(renderTaskCard)
            ) : (
              <div className="text-center py-6 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400">No tasks scheduled for today.</p>
                <button
                  onClick={() => onOpenCreateTask()}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  + Create your first task
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Overdue Alert Section if any */}
        {overdueOrPastTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Past Due Deadlines
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                {overdueOrPastTasks.length}
              </span>
            </div>
            <div className="space-y-2.5">{overdueOrPastTasks.map(renderTaskCard)}</div>
          </div>
        )}

        {/* Day-Wise Section 2: Upcoming */}
        {upcomingTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Upcoming Schedule
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {upcomingTasks.length}
                </span>
              </div>
            </div>
            <div className="space-y-2.5">{upcomingTasks.map(renderTaskCard)}</div>
          </div>
        )}

        {/* Section 3: Completed Archive */}
        {completedTasks.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Completed ({completedTasks.length})
              </h2>
            </div>
            <div className="space-y-2.5">{completedTasks.map(renderTaskCard)}</div>
          </div>
        )}
      </div>
    </div>
  );
};
