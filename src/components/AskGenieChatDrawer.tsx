import React, { useState } from 'react';
import { TaskItem, UserProfile } from '../types/task';
import { GenieService } from '../services/genieService';
import { D1TaskStoreService } from '../store/taskStore';
import {
  Sparkles,
  X,
  Send,
  PlusCircle,
  CheckCircle2,
  ListTree,
  Sliders,
  Users,
  Lightbulb,
} from 'lucide-react';

interface AskGenieChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  currentUser: UserProfile;
}

interface ChatMessage {
  id: string;
  sender: 'genie' | 'user';
  text: string;
  timestamp: string;
  actionPayload?: {
    type: 'subtasks' | 'suggestion';
    taskId?: string;
    subtasks?: Array<{ title: string; estimatedMinutes?: number }>;
  };
}

export const AskGenieChatDrawer: React.FC<AskGenieChatDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  currentUser,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_welcome',
      sender: 'genie',
      text: `Hello ${currentUser.name}! I am Ask Genie, your AI copilot for task division, deadline prioritization, and workload delegation. How can I assist with your tasks today?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputVal.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsLoading(true);

    try {
      const responseText = await GenieService.chat(text, tasks);

      const genieMsg: ChatMessage = {
        id: `gen_${Date.now()}`,
        sender: 'genie',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, genieMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action 1: Divide PPT task
  const handleQuickDividePpt = async () => {
    setIsLoading(true);
    const pptTask = tasks.find((t) => t.title.toLowerCase().includes('ppt')) || tasks[0];

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: `Divide "${pptTask?.title || 'Create PPT'}" into actionable subtasks.`,
      timestamp: 'Just now',
    };
    setMessages((prev) => [...prev, userMsg]);

    const subtasks = await GenieService.divideSubtasks(
      pptTask?.title || 'Create PPT',
      pptTask?.description,
      pptTask?.dueDate
    );

    const genieMsg: ChatMessage = {
      id: `gen_${Date.now()}`,
      sender: 'genie',
      text: `I've broken down "${pptTask?.title}" into ${subtasks.length} logical milestones with recommended duration:`,
      timestamp: 'Just now',
      actionPayload: {
        type: 'subtasks',
        taskId: pptTask?.id,
        subtasks,
      },
    };

    setMessages((prev) => [...prev, genieMsg]);
    setIsLoading(false);
  };

  const handleApplySubtasksToStore = (taskId?: string, subtasksToAdd?: any[]) => {
    if (!taskId || !subtasksToAdd) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    D1TaskStoreService.updateTask(taskId, {
      subtasks: [...task.subtasks, ...subtasksToAdd],
    });
    alert(`Added ${subtasksToAdd.length} subtasks to "${task.title}" in D1 TaskStore!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      {/* Slide-Up Bottom Sheet Drawer (Mobile Ergonomic Pattern 3) */}
      <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] z-10 animate-in slide-in-from-bottom duration-200">
        {/* Grab handle */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 shrink-0" />

        {/* Header */}
        <div className="px-4 pb-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Ask Genie AI</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 font-semibold">
                  Online
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">Context Diagram Subtask & Work Plot Engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Chips Bar */}
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 overflow-x-auto flex items-center gap-1.5 text-xs no-scrollbar shrink-0">
          <button
            onClick={handleQuickDividePpt}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium whitespace-nowrap text-slate-700 dark:text-slate-200 hover:border-indigo-400 flex items-center gap-1 shadow-xs shrink-0"
          >
            <ListTree className="w-3 h-3 text-indigo-500" />
            <span>Divide "Create PPT"</span>
          </button>

          <button
            onClick={() => handleSendMessage('Analyze my current tasks and prioritize them according to deadline.')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium whitespace-nowrap text-slate-700 dark:text-slate-200 hover:border-indigo-400 flex items-center gap-1 shadow-xs shrink-0"
          >
            <Sliders className="w-3 h-3 text-amber-500" />
            <span>Prioritize by Deadline</span>
          </button>

          <button
            onClick={() => handleSendMessage('Suggest work roles and assignments for the team.')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium whitespace-nowrap text-slate-700 dark:text-slate-200 hover:border-indigo-400 flex items-center gap-1 shadow-xs shrink-0"
          >
            <Users className="w-3 h-3 text-emerald-500" />
            <span>Suggest Team Work</span>
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/50 dark:border-slate-700/60'
                }`}
              >
                <p>{msg.text}</p>

                {/* If AI returned subtask payload, show interactive button */}
                {msg.actionPayload?.subtasks && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                    {msg.actionPayload.subtasks.map((st, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                        <span className="font-medium text-slate-900 dark:text-white truncate">
                          {st.title}
                        </span>
                        {st.estimatedMinutes && (
                          <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">
                            {st.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() =>
                        handleApplySubtasksToStore(
                          msg.actionPayload?.taskId,
                          msg.actionPayload?.subtasks
                        )
                      }
                      className="mt-2 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add These to D1 TaskStore</span>
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span>Ask Genie is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask Genie anything (e.g. divide subtasks, schedule meeting)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 active:scale-95 text-white transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
