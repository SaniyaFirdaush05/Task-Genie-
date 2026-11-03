import React, { useState, useEffect } from 'react';
import { TaskItem, TaskCategory, Priority, Subtask, Attachment } from '../types/task';
import { D1TaskStoreService, INITIAL_TEAM_MEMBERS } from '../store/taskStore';
import { GenieService } from '../services/genieService';
import { X, Sparkles, Plus, Trash2, Paperclip, Repeat, Calendar, Clock, Check } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TaskItem | null;
  initialTitleTemplate?: string;
  initialDueDate?: string;
  initialDueTime?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  initialTitleTemplate,
  initialDueDate,
  initialDueTime,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(taskToEdit?.title || initialTitleTemplate || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [category, setCategory] = useState<TaskCategory>(taskToEdit?.category || 'Assignment');
  const [priority, setPriority] = useState<Priority>(taskToEdit?.priority || 'medium');
  const [dueDate, setDueDate] = useState(
    taskToEdit?.dueDate || initialDueDate || new Date().toISOString().split('T')[0]
  );
  const [dueTime, setDueTime] = useState(taskToEdit?.dueTime || initialDueTime || '17:00');
  const [isRecurring, setIsRecurring] = useState(taskToEdit?.isRecurring || false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    taskToEdit?.recurringFrequency || 'weekly'
  );
  const [assignedTo, setAssignedTo] = useState(taskToEdit?.assignedTo || 'Sarah Chen');
  const [subtasks, setSubtasks] = useState<Subtask[]>(taskToEdit?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(taskToEdit?.attachments || []);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);

  useEffect(() => {
    if (initialTitleTemplate && !taskToEdit) {
      if (initialTitleTemplate === 'Create PPT') {
        setTitle('Create PPT - Executive Deck Presentation');
        setDescription('Prepare keynote presentation slides with milestones, Level 1 DFDs, and assignments.');
        setCategory('Assignment');
        setPriority('high');
        setAttachments([
          { id: `att_${Date.now()}`, name: 'Presentation_Brief.pptx', size: '3.4 MB', type: 'presentation' },
        ]);
        setSubtasks([
          { id: 'sub_temp_1', title: 'Outline slide narrative and key talking points', completed: false, estimatedMinutes: 20 },
          { id: 'sub_temp_2', title: 'Gather Level 1 DFD diagrams and metrics', completed: false, estimatedMinutes: 30 },
          { id: 'sub_temp_3', title: 'Design slides in widescreen 16:9 format', completed: false, estimatedMinutes: 45 },
          { id: 'sub_temp_4', title: 'Rehearse speech and export final PDF deck', completed: false, estimatedMinutes: 15 },
        ]);
      }
    }
  }, [initialTitleTemplate, taskToEdit]);

  const handleAiAutoAnalyze = async () => {
    if (!title.trim()) return;
    setIsAiLoading(true);
    setAiTip(null);
    try {
      const [aiClassification, aiSubtasks] = await Promise.all([
        GenieService.prioritizeAndCategorize(title, dueDate, description),
        subtasks.length === 0 ? GenieService.divideSubtasks(title, description, dueDate) : Promise.resolve(null),
      ]);

      if (aiClassification) {
        setCategory(aiClassification.category);
        setPriority(aiClassification.priority);
        setAiTip(aiClassification.tip);
      }

      if (aiSubtasks && aiSubtasks.length > 0) {
        setSubtasks(aiSubtasks);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub_${Date.now()}`,
        title: newSubtaskTitle.trim(),
        completed: false,
        estimatedMinutes: 20,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleAddAttachment = () => {
    const fileName = prompt('Enter attachment file name (e.g. PPT_Assignment_v1.pptx):', 'Presentation_Slide_Deck.pptx');
    if (!fileName) return;
    setAttachments([
      ...attachments,
      {
        id: `att_${Date.now()}`,
        name: fileName,
        size: '2.5 MB',
        type: fileName.endsWith('.pptx') ? 'presentation' : 'document',
      },
    ]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskToEdit) {
      D1TaskStoreService.updateTask(taskToEdit.id, {
        title,
        description,
        category,
        priority,
        dueDate,
        dueTime,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        assignedTo,
        subtasks,
        attachments,
      });
    } else {
      D1TaskStoreService.addTask({
        title,
        description,
        category,
        priority,
        status: 'todo',
        dueDate,
        dueTime,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        assignedTo,
        assignedBy: 'Alex Rivera (Manager)',
        assignmentStatus: 'accepted',
        subtasks,
        attachments,
        comments: [],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-h-[90vh] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              {taskToEdit ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Synced directly with D1 TaskStore & Scheduling Module
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Quick template chip buttons */}
          {!taskToEdit && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold">Templates:</span>
              <button
                type="button"
                onClick={() => {
                  setTitle('Create PPT - Marketing Deck');
                  setCategory('Assignment');
                  setPriority('high');
                }}
                className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-zinc-200 border border-indigo-200 dark:border-zinc-700 text-[10px] font-medium"
              >
                + PPT Assignment
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle('Weekly Team Collaboration Sync');
                  setCategory('Meeting');
                  setIsRecurring(true);
                }}
                className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-medium"
              >
                + Weekly Sync
              </button>
            </div>
          )}

          {/* Title Input + AI Auto-Analyze Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                Task Title *
              </label>
              <button
                type="button"
                disabled={isAiLoading || !title.trim()}
                onClick={handleAiAutoAnalyze}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-zinc-300 hover:underline disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAiLoading ? 'Analyzing...' : 'Ask Genie AI (Auto-Fill)'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Task -> Create PPT presentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-zinc-500"
            />
          </div>

          {aiTip && (
            <div className="p-2.5 bg-amber-50 dark:bg-zinc-800/80 border border-amber-200 dark:border-zinc-700 rounded-xl text-[11px] text-amber-800 dark:text-zinc-200 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{aiTip}</span>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Add key deliverables, agenda, or reference context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-zinc-500"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-zinc-500"
              >
                <option value="Assignment" className="dark:bg-zinc-900">Assignment (PPT / Paper)</option>
                <option value="Work" className="dark:bg-zinc-900">Work</option>
                <option value="Project" className="dark:bg-zinc-900">Project</option>
                <option value="Meeting" className="dark:bg-zinc-900">Meeting</option>
                <option value="Study" className="dark:bg-zinc-900">Study</option>
                <option value="Personal" className="dark:bg-zinc-900">Personal</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-zinc-500"
              >
                <option value="high" className="dark:bg-zinc-900">High Priority</option>
                <option value="medium" className="dark:bg-zinc-900">Medium Priority</option>
                <option value="low" className="dark:bg-zinc-900">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Scheduling: Date & Time Picker */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                <span>Due Date (Deadline) *</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-zinc-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                <span>Time (HH:mm)</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-zinc-500"
              />
            </div>
          </div>

          {/* Level 1 DFD: Handle Recurring Tasks */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-indigo-500 dark:text-zinc-400" />
                  <span>Recurring Task (Handle Recurring Tasks in DFD)</span>
                </span>
              </label>

              {isRecurring && (
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value as any)}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-black text-slate-900 dark:text-zinc-100"
                >
                  <option value="daily" className="dark:bg-zinc-900">Daily</option>
                  <option value="weekly" className="dark:bg-zinc-900">Weekly</option>
                  <option value="monthly" className="dark:bg-zinc-900">Monthly</option>
                </select>
              )}
            </div>
          </div>

          {/* Assignee Selection (Collaboration / Work Plot) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
              Assignee (Work Plot)
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100"
            >
              {INITIAL_TEAM_MEMBERS.map((m) => (
                <option key={m.id} value={m.name} className="dark:bg-zinc-900">
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Subtasks Section (Chatbox AI work -> Subtask division) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                Subtasks ({subtasks.length})
              </label>
            </div>

            <div className="space-y-1.5 mb-2">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
                >
                  <span className="text-xs text-slate-800 dark:text-zinc-200">{st.title}</span>
                  <div className="flex items-center gap-2">
                    {st.estimatedMinutes && (
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        {st.estimatedMinutes}m
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add another subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Attachments Section (PPT / Assignment) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                <Paperclip className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                <span>Attachments (PPT, assignment brief)</span>
              </label>
              <button
                type="button"
                onClick={handleAddAttachment}
                className="text-[11px] text-indigo-600 dark:text-zinc-300 font-medium hover:underline"
              >
                + Add File
              </button>
            </div>

            <div className="space-y-1">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 text-xs border border-slate-200 dark:border-zinc-800"
                >
                  <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                    {att.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 active:scale-95 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{taskToEdit ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
