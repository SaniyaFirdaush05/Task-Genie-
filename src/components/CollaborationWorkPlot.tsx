import React, { useState } from 'react';
import { TaskItem, TeamMember, UserProfile } from '../types/task';
import { D1TaskStoreService, INITIAL_TEAM_MEMBERS } from '../store/taskStore';
import { GenieService } from '../services/genieService';
import {
  Users,
  UserPlus,
  Sparkles,
  Check,
  X,
  CornerUpLeft,
  MessageSquare,
  Send,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface CollaborationWorkPlotProps {
  tasks: TaskItem[];
  currentUser: UserProfile;
  onToggleMainTab: (tab: 'tasks' | 'calendar' | 'collaboration' | 'focus' | 'analytics') => void;
  onSelectTask: (task: TaskItem) => void;
}

export const CollaborationWorkPlot: React.FC<CollaborationWorkPlotProps> = ({
  tasks,
  currentUser,
  onToggleMainTab,
  onSelectTask,
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [selectedMember, setSelectedMember] = useState<string>('All');
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<string>(
    tasks[0]?.id || ''
  );
  const [newComment, setNewComment] = useState('');
  const [isSuggestingWork, setIsSuggestingWork] = useState(false);
  const [suggestedWorkResult, setSuggestedWorkResult] = useState<{
    taskTitle: string;
    suggestedAssignee: string;
    suggestedRole: string;
    rationale: string;
  } | null>(null);

  // Filter tasks awaiting user response (From Notes: User -> Accept / Resign / Reject)
  const pendingTasks = tasks.filter((t) => t.assignmentStatus === 'pending_acceptance');

  const activeTask = tasks.find((t) => t.id === selectedTaskForComments) || tasks[0];

  const handleAiSuggestWork = async () => {
    setIsSuggestingWork(true);
    try {
      const unassignedOrPptTask = tasks.find((t) => t.title.toLowerCase().includes('ppt')) || tasks[0];
      const result = await GenieService.suggestWork(
        unassignedOrPptTask?.title || 'Q4 Presentation Deck',
        teamMembers.map((m) => m.name)
      );
      if (result) {
        setSuggestedWorkResult({
          taskTitle: unassignedOrPptTask?.title || 'Create PPT Presentation',
          suggestedAssignee: result.suggestedAssignee,
          suggestedRole: result.suggestedRole,
          rationale: result.rationale,
        });
      }
    } finally {
      setIsSuggestingWork(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!suggestedWorkResult) return;
    const task = tasks.find((t) => t.title === suggestedWorkResult.taskTitle);
    if (task) {
      D1TaskStoreService.updateTask(task.id, {
        assignedTo: suggestedWorkResult.suggestedAssignee,
        assignmentStatus: 'pending_acceptance',
        assignedBy: `${currentUser.name} (${currentUser.role})`,
      });
      alert(`Assigned "${task.title}" to ${suggestedWorkResult.suggestedAssignee}. Awaiting their Accept/Reject response.`);
      setSuggestedWorkResult(null);
    }
  };

  const handleInviteMember = () => {
    const name = prompt('Enter Teammate Full Name:');
    if (!name) return;
    const email = prompt('Enter Teammate Email:', `${name.toLowerCase().replace(/\s+/g, '.')}@taskgenie.app`);
    if (!email) return;
    const role = prompt('Enter Team Role:', 'Junior Engineer');

    const newMem: TeamMember = {
      id: `mem_${Date.now()}`,
      name,
      email,
      role: role || 'Team Member',
      avatar: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 90000000)}?w=120&auto=format&fit=crop&q=80`,
      completedCount: 0,
      activeCount: 1,
    };
    setTeamMembers([...teamMembers, newMem]);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeTask) return;

    D1TaskStoreService.addComment(
      activeTask.id,
      currentUser.name,
      currentUser.role,
      newComment.trim()
    );
    setNewComment('');
  };

  const handleRespondToTask = (task: TaskItem, response: 'accepted' | 'resigned' | 'rejected') => {
    const note =
      response === 'rejected'
        ? prompt('Reason for rejection:', 'Not enough time this sprint')
        : response === 'resigned'
        ? prompt('Reason for resigning:', 'Reallocating bandwidth')
        : undefined;

    D1TaskStoreService.respondToAssignment(task.id, response, note || undefined);
  };

  return (
    <div className="flex-1 w-full flex flex-col overflow-y-auto">
      {/* 3 Main Tabs header */}
      <div className="px-4 pt-3 pb-2 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => onToggleMainTab('tasks')}
            className="flex-1 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center justify-center gap-1.5"
          >
            <span className="text-base leading-none">•</span>
            <span>Task</span>
          </button>
          <button
            onClick={() => onToggleMainTab('calendar')}
            className="flex-1 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center justify-center gap-1.5"
          >
            <span className="text-base leading-none">•</span>
            <span>Calendar</span>
          </button>
          <button
            onClick={() => onToggleMainTab('collaboration')}
            className="flex-1 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs flex items-center justify-center gap-1.5"
          >
            <span className="text-base leading-none">•</span>
            <span>Collaboration</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Work Plot Header & AI Work Suggestion */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white rounded-3xl p-4 shadow-md">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                Work Plot & Team Delegation
              </span>
              <h2 className="text-base font-bold">Ask Genie Work Suggestion</h2>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                Context diagram Level 0: Manager assign roles & AI work recommendation
              </p>
            </div>

            <button
              disabled={isSuggestingWork}
              onClick={handleAiSuggestWork}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-900" />
              <span>{isSuggestingWork ? 'Analyzing...' : 'AI Suggest Work'}</span>
            </button>
          </div>

          {/* AI Suggestion Display Result */}
          {suggestedWorkResult && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-xs space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-xs">Recommended Role Assignment:</span>
                <span className="text-[10px] text-white/70">{suggestedWorkResult.taskTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{suggestedWorkResult.suggestedAssignee}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">
                  {suggestedWorkResult.suggestedRole}
                </span>
              </div>
              <p className="text-[11px] text-indigo-100">{suggestedWorkResult.rationale}</p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={handleApplyAiSuggestion}
                  className="px-3 py-1 bg-white text-indigo-900 font-semibold rounded-lg text-xs hover:bg-indigo-50 transition-colors"
                >
                  Apply & Dispatch to User
                </button>
                <button
                  onClick={() => setSuggestedWorkResult(null)}
                  className="text-white/70 hover:text-white text-xs underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: User -> Accept / Resign / Reject Workflow (From Notes) */}
        {pendingTasks.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/40 rounded-3xl p-4 border border-amber-200 dark:border-amber-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-amber-950 dark:text-amber-100 uppercase tracking-wider">
                  Pending Task Approvals ({pendingTasks.length})
                </h3>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                Accept / Resign / Reject
              </span>
            </div>

            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Assigned by <span className="font-medium text-slate-700 dark:text-slate-300">{task.assignedBy || 'Manager'}</span> to <span className="font-medium text-indigo-600">{task.assignedTo}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Due: {task.dueDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleRespondToTask(task, 'accepted')}
                      className="flex-1 py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleRespondToTask(task, 'resigned')}
                      className="flex-1 py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                      <span>Resign</span>
                    </button>
                    <button
                      onClick={() => handleRespondToTask(task, 'rejected')}
                      className="flex-1 py-1 px-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-200 font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Teamwork Members & Work Plot Capacity */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Work Plot Team ({teamMembers.length})
              </h3>
              <p className="text-[10px] text-slate-400">Teamwork Invite & Workload Analysis</p>
            </div>
            <button
              onClick={handleInviteMember}
              className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
          </div>

          <div className="space-y-2">
            {teamMembers.map((member) => {
              const memberTasks = tasks.filter((t) => t.assignedTo?.includes(member.name));
              const activeCount = memberTasks.filter((t) => t.status !== 'completed').length;
              const completedCount = memberTasks.filter((t) => t.status === 'completed').length;

              return (
                <div
                  key={member.id}
                  className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {member.name}
                        </span>
                        {member.id === 'mem_2' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-semibold uppercase">
                            Manager
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{member.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {activeCount} active
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {completedCount} done
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Comments and Discussion Thread (From Image 2 Notes) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Task Discussion Thread
              </h3>
            </div>
            <select
              value={selectedTaskForComments}
              onChange={(e) => setSelectedTaskForComments(e.target.value)}
              className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 max-w-[160px] truncate"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {activeTask ? (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Subject:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {activeTask.title}
                </p>
              </div>

              {/* Comments list */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {activeTask.comments.length > 0 ? (
                  activeTask.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        c.authorRole === 'manager'
                          ? 'bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {c.authorName}
                          </span>
                          <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-white/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                            {c.authorRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                        {c.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs text-slate-400">
                    No discussion messages yet. Post updates or questions below.
                  </p>
                )}
              </div>

              {/* Add Comment input */}
              <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder={`Comment as ${currentUser.name}...`}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Select a task above to join discussion.</p>
          )}
        </div>
      </div>
    </div>
  );
};
