import React, { useState, useMemo } from 'react';
import { TaskItem, UserProfile, TeamMember } from '../types/task';
import { D1TaskStoreService, INITIAL_TEAM_MEMBERS } from '../store/taskStore';
import { GenieService } from '../services/genieService';
import {
  Shield,
  UserPlus,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Edit2,
  Trash2,
  Send,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

interface ManagerDashboardProps {
  tasks: TaskItem[];
  currentUser: UserProfile;
  onOpenCreateTask: (templateTitle?: string) => void;
  onEditTask: (task: TaskItem) => void;
  onSelectTab: (tab: 'tasks' | 'calendar' | 'collaboration' | 'focus' | 'analytics') => void;
  activeMainTab: 'tasks' | 'calendar' | 'collaboration' | 'focus' | 'analytics';
  isFilterOpen: boolean;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  tasks,
  currentUser,
  onOpenCreateTask,
  onEditTask,
  onSelectTab,
  activeMainTab,
  isFilterOpen,
}) => {
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'attention' | 'active' | 'completed'>('all');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reassignDrafts, setReassignDrafts] = useState<Record<string, string>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isAiAllocating, setIsAiAllocating] = useState(false);
  const [managerBanner, setManagerBanner] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Executive KPI computations across the entire team
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const overdueTasks = tasks.filter((t) => t.dueDate < todayStr && t.status !== 'completed');
  const awaitingResponseTasks = tasks.filter((t) => t.assignmentStatus === 'pending_acceptance');
  const rejectedOrResignedTasks = tasks.filter(
    (t) => t.assignmentStatus === 'rejected' || t.assignmentStatus === 'resigned'
  );
  const actionRequiredTasks = useMemo(() => {
    const seen = new Set<string>();
    return [...rejectedOrResignedTasks, ...awaitingResponseTasks].filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [rejectedOrResignedTasks, awaitingResponseTasks]);

  // Workload summary per team member
  const teamWorkload = useMemo(() => {
    return INITIAL_TEAM_MEMBERS.map((member: TeamMember) => {
      const assigned = tasks.filter((t) => t.assignedTo === member.name);
      const active = assigned.filter((t) => t.status !== 'completed').length;
      const done = assigned.filter((t) => t.status === 'completed').length;
      const pendingAck = assigned.filter((t) => t.assignmentStatus === 'pending_acceptance').length;
      return {
        ...member,
        active,
        done,
        pendingAck,
        total: assigned.length,
      };
    });
  }, [tasks]);

  const maxMemberLoad = Math.max(3, ...teamWorkload.map((m) => m.active + m.done));

  // Filter Team Ledger
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedMemberFilter !== 'All' && task.assignedTo !== selectedMemberFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          task.title.toLowerCase().includes(q) ||
          (task.assignedTo || '').toLowerCase().includes(q) ||
          task.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (ledgerFilter === 'attention') {
        const isOverdue = task.dueDate < todayStr && task.status !== 'completed';
        const needsDecision =
          task.assignmentStatus === 'rejected' ||
          task.assignmentStatus === 'resigned' ||
          task.assignmentStatus === 'pending_acceptance';
        return isOverdue || needsDecision;
      }
      if (ledgerFilter === 'active') return task.status !== 'completed';
      if (ledgerFilter === 'completed') return task.status === 'completed';
      return true;
    });
  }, [tasks, selectedMemberFilter, searchQuery, ledgerFilter, todayStr]);

  const handleDispatchReassign = (task: TaskItem, nextMemberName: string) => {
    if (!nextMemberName) return;
    D1TaskStoreService.updateTask(task.id, {
      assignedTo: nextMemberName,
      assignedBy: `${currentUser.name} (Manager)`,
      assignmentStatus: 'pending_acceptance',
      assignmentResponseNote: undefined,
    });
    setManagerBanner(`Dispatched "${task.title}" to ${nextMemberName} for acceptance.`);
  };

  const handleAiAutoAllocate = async () => {
    const candidate =
      rejectedOrResignedTasks[0] ||
      tasks.find((t) => !t.assignedTo && t.status !== 'completed') ||
      tasks.find((t) => t.status !== 'completed');

    if (!candidate) {
      setManagerBanner('All tasks are currently completed or allocated.');
      return;
    }

    setIsAiAllocating(true);
    try {
      const suggestion = await GenieService.suggestWork(
        candidate.title,
        INITIAL_TEAM_MEMBERS.map((m) => `${m.name} (${m.role})`)
      );
      if (suggestion?.suggestedAssignee) {
        setReassignDrafts((prev) => ({
          ...prev,
          [candidate.id]: suggestion.suggestedAssignee,
        }));
        setManagerBanner(
          `AI recommends ${suggestion.suggestedAssignee} (${suggestion.suggestedRole}) for "${candidate.title}": ${suggestion.rationale}`
        );
      }
    } finally {
      setIsAiAllocating(false);
    }
  };

  const getAssignmentBadge = (task: TaskItem) => {
    switch (task.assignmentStatus) {
      case 'accepted':
        return {
          label: 'Accepted',
          cls: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-zinc-800 dark:border-zinc-700',
        };
      case 'pending_acceptance':
        return {
          label: 'Awaiting Reply',
          cls: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-zinc-800 dark:border-zinc-700',
        };
      case 'resigned':
        return {
          label: 'Resigned',
          cls: 'text-slate-700 bg-slate-100 border-slate-300 dark:text-zinc-200 dark:bg-zinc-800 dark:border-zinc-700',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          cls: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-zinc-800 dark:border-zinc-700',
        };
      default:
        return {
          label: 'Unassigned',
          cls: 'text-slate-500 bg-slate-100 border-slate-200 dark:text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700',
        };
    }
  };

  const getPriorityBorderClass = (priority: string, isDone: boolean) => {
    if (isDone) {
      if (priority === 'high') return 'border-2 border-rose-300/60 dark:border-rose-900/50 opacity-75';
      if (priority === 'medium') return 'border-2 border-amber-300/60 dark:border-amber-900/50 opacity-75';
      return 'border-2 border-emerald-300/60 dark:border-emerald-900/50 opacity-75';
    }
    if (priority === 'high') {
      return 'border-2 border-rose-500/85 dark:border-rose-500/75 shadow-xs';
    }
    if (priority === 'medium') {
      return 'border-2 border-amber-400/90 dark:border-amber-500/75 shadow-xs';
    }
    return 'border-2 border-emerald-500/80 dark:border-emerald-500/70 shadow-xs';
  };

  return (
    <div className="flex-1 w-full flex flex-col overflow-y-auto bg-gradient-to-b from-teal-50/70 via-slate-50 to-white dark:from-black dark:via-zinc-950 dark:to-black">
      {/* Manager Top Module Switcher */}
      <div className="px-4 pt-3 pb-1.5 bg-teal-50/80 dark:bg-black border-b border-teal-200/70 dark:border-teal-900/50 sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-2 p-1 bg-teal-100/80 dark:bg-zinc-900 rounded-xl text-xs font-semibold border border-teal-200/70 dark:border-teal-900/50">
          <button
            onClick={() => onSelectTab('tasks')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeMainTab === 'tasks'
                ? 'bg-teal-800 dark:bg-teal-600 text-white shadow-xs'
                : 'text-teal-900/70 dark:text-zinc-400 hover:text-teal-950 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Command</span>
          </button>

          <button
            onClick={() => onSelectTab('collaboration')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeMainTab === 'collaboration'
                ? 'bg-teal-800 dark:bg-teal-600 text-white shadow-xs'
                : 'text-teal-900/70 dark:text-zinc-400 hover:text-teal-950 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Work Plot</span>
          </button>

          <button
            onClick={() => onSelectTab('calendar')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeMainTab === 'calendar'
                ? 'bg-teal-800 dark:bg-teal-600 text-white shadow-xs'
                : 'text-teal-900/70 dark:text-zinc-400 hover:text-teal-950 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </button>
        </div>

        {isFilterOpen && (
          <div className="mt-2.5 pb-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team task, assignee, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 pb-6">
        {/* Executive Command Card (Distinct Deep Teal & Amber-Gold Manager Palette) */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 text-white p-4 border border-teal-800/70 shadow-sm space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Manager Command Workspace
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">
                Team Oversight &amp; Delegation
              </h2>
              <p className="text-[11px] text-teal-100/80 mt-0.5">
                {currentUser.name} · {INITIAL_TEAM_MEMBERS.length} team members
              </p>
            </div>

            <button
              onClick={() => onOpenCreateTask()}
              className="px-3 py-2 rounded-xl bg-amber-400 text-zinc-950 hover:bg-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Assign Work</span>
            </button>
          </div>

          {/* 4-Column Executive KPI Strip */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-xl bg-teal-950/80 border border-teal-800/70">
              <span className="text-[10px] text-teal-200/80 block">Team Tasks</span>
              <span className="text-base font-extrabold font-mono tabular-nums text-white">
                {totalCount}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-teal-950/80 border border-teal-800/70">
              <span className="text-[10px] text-teal-200/80 block">Pending</span>
              <span className="text-base font-extrabold font-mono tabular-nums text-amber-300">
                {actionRequiredTasks.length}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-teal-950/80 border border-teal-800/70">
              <span className="text-[10px] text-teal-200/80 block">Overdue</span>
              <span className="text-base font-extrabold font-mono tabular-nums text-rose-300">
                {overdueTasks.length}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-teal-950/80 border border-teal-800/70">
              <span className="text-[10px] text-teal-200/80 block">Done Rate</span>
              <span className="text-base font-extrabold font-mono tabular-nums text-emerald-300">
                {completionRate}%
              </span>
            </div>
          </div>

          {/* AI Delegation Assistant Trigger */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-teal-800/60">
            <span className="text-[11px] text-teal-100/90">
              Let Ask Genie recommend optimal team role allocation
            </span>
            <button
              type="button"
              disabled={isAiAllocating}
              onClick={handleAiAutoAllocate}
              className="px-2.5 py-1.5 rounded-lg bg-teal-800/80 hover:bg-teal-700 border border-teal-600/60 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
            >
              {isAiAllocating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isAiAllocating ? 'Analyzing...' : 'AI Suggest'}</span>
            </button>
          </div>
        </div>

        {/* Non-blocking Manager Dispatch / AI Recommendation Banner */}
        {managerBanner && (
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-200 flex items-start justify-between gap-2 shadow-xs">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">{managerBanner}</p>
            </div>
            <button
              onClick={() => setManagerBanner(null)}
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Required Queue: Rejections, Resignations & Pending Acceptances */}
        {actionRequiredTasks.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-amber-300/80 dark:border-zinc-700 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                  Assignment Responses ({actionRequiredTasks.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                Reassign or monitor
              </span>
            </div>

            <div className="space-y-2">
              {actionRequiredTasks.map((task) => {
                const draftMember = reassignDrafts[task.id] || task.assignedTo || INITIAL_TEAM_MEMBERS[0].name;
                const badge = getAssignmentBadge(task);
                return (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-black border border-slate-200/80 dark:border-zinc-800 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {task.title}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          Current: <strong className="text-slate-700 dark:text-zinc-200">{task.assignedTo || 'Unassigned'}</strong> · Due {task.dueDate}
                        </p>
                        {task.assignmentResponseNote && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                            Member note: &ldquo;{task.assignmentResponseNote}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/70 dark:border-zinc-800">
                      <select
                        value={draftMember}
                        onChange={(e) =>
                          setReassignDrafts((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                        className="flex-1 px-2 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
                      >
                        {INITIAL_TEAM_MEMBERS.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDispatchReassign(task, draftMember)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0"
                      >
                        <Send className="w-3 h-3" />
                        <span>Dispatch</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Team Workload Capacity Matrix (Tap member to filter ledger) */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Team Capacity &amp; Filter
            </h3>
            {selectedMemberFilter !== 'All' ? (
              <button
                onClick={() => setSelectedMemberFilter('All')}
                className="text-[11px] font-semibold text-teal-700 dark:text-amber-300 hover:underline"
              >
                Show All Team
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                Tap member to filter
              </span>
            )}
          </div>

          <div className="space-y-2">
            {teamWorkload.map((member) => {
              const isSelected = selectedMemberFilter === member.name;
              const loadPct = Math.round(((member.active + member.done) / maxMemberLoad) * 100);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() =>
                    setSelectedMemberFilter(isSelected ? 'All' : member.name)
                  }
                  className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-teal-900 text-white border-teal-700 dark:bg-teal-900/90 dark:border-teal-600'
                      : 'bg-slate-50/70 dark:bg-black border-slate-200/60 dark:border-zinc-800 hover:border-teal-300 dark:hover:border-teal-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-white' : 'text-slate-900 dark:text-zinc-100'
                          }`}
                        >
                          {member.name}
                        </p>
                        <p
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-teal-200' : 'text-slate-500 dark:text-zinc-400'
                          }`}
                        >
                          {member.role}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[10px] shrink-0">
                      <span
                        className={`font-bold ${
                          isSelected ? 'text-white' : 'text-slate-800 dark:text-zinc-200'
                        }`}
                      >
                        {member.active} active
                      </span>
                      <span
                        className={`mx-1 ${
                          isSelected ? 'text-teal-300' : 'text-slate-400 dark:text-zinc-600'
                        }`}
                      >
                        ·
                      </span>
                      <span className={isSelected ? 'text-amber-300' : 'text-emerald-600 dark:text-emerald-400'}>
                        {member.done} done
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isSelected ? 'bg-teal-950' : 'bg-slate-200 dark:bg-zinc-800'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        isSelected ? 'bg-amber-400' : 'bg-teal-700 dark:bg-teal-400'
                      }`}
                      style={{ width: `${Math.max(loadPct, member.total > 0 ? 12 : 0)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Task Ledger */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Team Task Ledger ({filteredTasks.length})
            </h3>
            <button
              onClick={() => onSelectTab('analytics')}
              className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 flex items-center gap-1"
            >
              <span>Team Reports</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-teal-100/70 dark:bg-zinc-900 rounded-xl text-[11px] font-semibold border border-teal-200/60 dark:border-zinc-800">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'attention', label: 'Attention' },
                { id: 'active', label: 'Active' },
                { id: 'completed', label: 'Done' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLedgerFilter(tab.id)}
                className={`py-1.5 rounded-lg transition-all ${
                  ledgerFilter === tab.id
                    ? 'bg-teal-800 dark:bg-teal-700 text-white shadow-xs'
                    : 'text-teal-900/75 dark:text-zinc-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Priority Border Legend */}
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-[10px] font-medium">
            <span className="uppercase tracking-wider font-bold text-slate-500 dark:text-zinc-500">
              Priority Borders
            </span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/60" />
                High
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/60" />
                Medium
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60" />
                Low
              </span>
            </div>
          </div>

          {/* Ledger Task Cards */}
          <div className="space-y-2.5">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const badge = getAssignmentBadge(task);
                const doneSubtasks = task.subtasks.filter((s) => s.completed).length;
                const isOverdue = task.dueDate < todayStr && task.status !== 'completed';
                const isDone = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className={`bg-white dark:bg-zinc-900 rounded-2xl p-3.5 space-y-2.5 transition-all ${getPriorityBorderClass(
                      task.priority,
                      isDone
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
                          <span className="font-semibold text-slate-800 dark:text-zinc-200">
                            {task.category}
                          </span>
                          <span>·</span>
                          <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                            {task.dueDate === todayStr ? 'Today' : task.dueDate}
                          </span>
                          <span>·</span>
                          <span
                            className={`capitalize font-semibold ${
                              task.priority === 'high'
                                ? 'text-rose-600 dark:text-rose-400'
                                : task.priority === 'medium'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <h4
                          className={`text-sm font-bold leading-snug ${
                            isDone
                              ? 'line-through text-slate-400 dark:text-zinc-500'
                              : 'text-slate-900 dark:text-zinc-100'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Inline Assignee Reassignment & Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                          Owner:
                        </span>
                        <select
                          value={task.assignedTo || ''}
                          onChange={(e) => handleDispatchReassign(task, e.target.value)}
                          className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 truncate max-w-[165px]"
                          aria-label={`Reassign ${task.title}`}
                        >
                          {INITIAL_TEAM_MEMBERS.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {task.subtasks.length > 0 && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 mr-1">
                            {doneSubtasks}/{task.subtasks.length}
                          </span>
                        )}

                        <button
                          onClick={() =>
                            D1TaskStoreService.updateTask(task.id, {
                              status: isDone ? 'in_progress' : 'completed',
                            })
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDone
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-zinc-800'
                              : 'text-slate-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                          }`}
                          title={isDone ? 'Reopen task' : 'Mark completed'}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Edit / Reconfigure Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {pendingDeleteId === task.id ? (
                          <button
                            onClick={() => {
                              D1TaskStoreService.deleteTask(task.id);
                              setPendingDeleteId(null);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            onClick={() => setPendingDeleteId(task.id)}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  No tasks match the current team filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
