import React, { useState } from 'react';
import { X, ArrowRight, Layers, FileText, CheckCircle2, Cpu } from 'lucide-react';

interface ContextDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule: (module: 'tasks' | 'calendar' | 'collaboration' | 'focus' | 'analytics') => void;
}

export const ContextDiagramModal: React.FC<ContextDiagramModalProps> = ({
  isOpen,
  onClose,
  onNavigateToModule,
}) => {
  const [activeTab, setActiveTab] = useState<'context' | 'level1' | 'specs'>('context');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[92vh] z-10 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-zinc-800 text-white dark:text-zinc-100 flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Task Genie Architecture & DFDs
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Directly implemented from your handwritten engineering diagrams
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-black border-b border-slate-200/80 dark:border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('context')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'context'
                ? 'bg-indigo-600 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800'
            }`}
          >
            Level 0: Context Diagram
          </button>
          <button
            onClick={() => setActiveTab('level1')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'level1'
                ? 'bg-indigo-600 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800'
            }`}
          >
            Level 1: Scheduling & Calendar DFD
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'specs'
                ? 'bg-indigo-600 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800'
            }`}
          >
            Specifications & Features
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'context' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 dark:bg-zinc-950 rounded-2xl border border-indigo-200 dark:border-zinc-800 text-indigo-900 dark:text-zinc-200 leading-relaxed text-[11px]">
                <strong>Context Diagram (Level 0): </strong> The central <strong>ASK GENIE SYSTEM</strong> connects five core entities: <em>User</em>, <em>Manager (Work Plot)</em>, <em>Gmail</em>, and <em>3rd Party APIs (Calendar / Meetings)</em>.
              </div>

              {/* Interactive Visual Context Diagram Flow */}
              <div className="p-6 bg-slate-50 dark:bg-black rounded-3xl border border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Central System Node */}
                <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 dark:from-zinc-900 dark:via-zinc-800 dark:to-black text-white shadow-xl flex flex-col items-center justify-center text-center p-4 z-10 ring-8 ring-indigo-100 dark:ring-zinc-800 border border-transparent dark:border-zinc-700">
                  <Cpu className="w-8 h-8 mb-1 text-amber-300 dark:text-zinc-100" />
                  <span className="font-extrabold text-sm tracking-tight text-white dark:text-zinc-100">ASK GENIE</span>
                  <span className="font-bold text-xs uppercase tracking-wider text-indigo-200 dark:text-zinc-300">SYSTEM</span>
                  <span className="text-[10px] text-indigo-100/80 dark:text-zinc-400 mt-1">AI Subtask & Work Engine</span>
                </div>

                {/* Surrounding Connected Nodes */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* Node 1: User */}
                  <div
                    onClick={() => {
                      onNavigateToModule('tasks');
                      onClose();
                    }}
                    className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-indigo-500 dark:hover:border-zinc-600 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-zinc-100 mb-1">
                      <span>Node: USER</span>
                      <span className="text-[10px] text-indigo-600 dark:text-zinc-400">Open Module →</span>
                    </div>
                    <ul className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-0.5">
                      <li>• Out: Profile login, Create/edit/delete/mark done</li>
                      <li>• Out: Selects focus mode (Pomodoro FM)</li>
                      <li>• In: Task view, Notification + response alerts</li>
                    </ul>
                  </div>

                  {/* Node 2: Manager */}
                  <div
                    onClick={() => {
                      onNavigateToModule('collaboration');
                      onClose();
                    }}
                    className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-violet-500 dark:hover:border-zinc-600 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-zinc-100 mb-1">
                      <span>Node: MANAGER (Work Plot)</span>
                      <span className="text-[10px] text-violet-600 dark:text-zinc-400">Open Module →</span>
                    </div>
                    <ul className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-0.5">
                      <li>• Out: Notifications, Permissions & assignments</li>
                      <li>• In: Task completion status & Work Plot workload</li>
                    </ul>
                  </div>

                  {/* Node 3: Gmail */}
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
                    <div className="font-bold text-slate-900 dark:text-zinc-100 mb-1">
                      Node: GMAIL
                    </div>
                    <ul className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-0.5">
                      <li>• In: Dispatches reminder emails & invite notifications</li>
                      <li>• Integration: Email notifications for pending deliverables</li>
                    </ul>
                  </div>

                  {/* Node 4: 3rd Party API */}
                  <div
                    onClick={() => {
                      onNavigateToModule('calendar');
                      onClose();
                    }}
                    className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-emerald-500 dark:hover:border-zinc-600 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-zinc-100 mb-1">
                      <span>Node: 3RD PARTY APIS (Calendar/Meet)</span>
                      <span className="text-[10px] text-emerald-600 dark:text-zinc-400">Open Calendar →</span>
                    </div>
                    <ul className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-0.5">
                      <li>• Sync: Calendar events (.ics download, Google Calendar)</li>
                      <li>• Meetings: Google Meet link generation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'level1' && (
            <div className="space-y-4">
              <div className="p-3 bg-violet-50 dark:bg-zinc-950 rounded-2xl border border-violet-200 dark:border-zinc-800 text-violet-900 dark:text-zinc-200 leading-relaxed text-[11px]">
                <strong>Level 1 DFD ("Scheduling & Calendar Module"): </strong> Details the data flows connecting User, Processes, and the central <strong>D1 TaskStore</strong>.
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  <h4 className="font-bold text-slate-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-zinc-800 text-white dark:text-zinc-200 flex items-center justify-center text-[10px]">1</span>
                    <span>Process: Manage Scheduled Task</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    User inputs task data (due date, time, recurring flag). Writes and updates records in <strong>D1 TaskStore</strong>. Handles recurring frequency flags (daily, weekly, monthly) and computes <em>Next Occurrence Data</em>.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  <h4 className="font-bold text-slate-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 dark:bg-zinc-800 text-white dark:text-zinc-200 flex items-center justify-center text-[10px]">2</span>
                    <span>Data Store: D1 TaskStore</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    Central local & cloud synchronized repository storing task metadata, subtask checklists, assignment status (pending, accepted, rejected, resigned), comments, and focus minutes spent.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  <h4 className="font-bold text-slate-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 dark:bg-zinc-800 text-white dark:text-zinc-200 flex items-center justify-center text-[10px]">3</span>
                    <span>Process: Generate Calendar View</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    Reads scheduled task data from D1 TaskStore and renders Month/Agenda calendar matrix for the User. Outputs .ICS export and live Google Calendar web integrations.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  <h4 className="font-bold text-slate-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-rose-600 dark:bg-zinc-800 text-white dark:text-zinc-200 flex items-center justify-center text-[10px]">4</span>
                    <span>Process: Generate Reminder Alerts</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    Monitors upcoming and due tasks from D1 TaskStore, issuing Reminder Notifications to User via top-app bar badge and alarm toasts.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  <h4 className="font-bold text-slate-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 dark:bg-zinc-800 text-white dark:text-zinc-200 flex items-center justify-center text-[10px]">5</span>
                    <span>Focus Mode (Pomodoro FM)</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    Accessible directly via Task Detail or navigation bar. Features 25m work cycles, synthesized ambient sound, and logs focus minutes directly to D1 TaskStore.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-zinc-100">
                  1. Login → Dashboard → Task
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                  Profile login first (User vs Manager roles). Dashboard shows "Hi, user!", Create (+), Edit/Filter buttons, day-wise groupings, task items with circular completion checks (e.g. "Create PPT"), attachments, and Ask Genie AI.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-zinc-100">
                  2. Chatbox AI Work (Ask Genie)
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                  Automated subtask division, priority calculation according to deadline urgency, and intelligent category assignment.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-zinc-100">
                  3. Collaboration & Work Plot
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                  Teamwork invite, AI suggest work roles, and the exact <strong>User → Accept / Resign / Reject</strong> approval workflow from notebook notes.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-zinc-100">
                  4. Analytics & Reports
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                  Task completion stats, productivity trends, time spent analysis, Ask Genie performance insights, and PDF export functionality.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl text-xs font-semibold"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
