import React, { useState, useEffect } from 'react';
import { TaskItem, UserProfile } from '../types/task';
import { GenieService, ProductivityInsightsResponse } from '../services/genieService';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  PieChart,
  FileText,
  Printer,
} from 'lucide-react';

interface AnalyticsReportsProps {
  tasks: TaskItem[];
  currentUser: UserProfile;
}

export const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({ tasks, currentUser }) => {
  const [aiInsights, setAiInsights] = useState<ProductivityInsightsResponse | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Computations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter((t) => t.dueDate < todayStr && t.status !== 'completed').length;

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  // Category time breakdown
  const categoryBreakdown: Record<string, { count: number; minutes: number }> = {};
  tasks.forEach((t) => {
    if (!categoryBreakdown[t.category]) {
      categoryBreakdown[t.category] = { count: 0, minutes: 0 };
    }
    categoryBreakdown[t.category].count += 1;
    categoryBreakdown[t.category].minutes += t.focusMinutesSpent || 0;
  });

  // Load AI productivity insights
  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      setIsLoadingAi(true);
      const res = await GenieService.getProductivityInsights({
        total: totalTasks,
        completed: completedTasks,
        overdue: overdueTasks,
        focusMinutes: totalFocusMinutes,
      });
      if (isMounted && res) {
        setAiInsights(res);
      }
      if (isMounted) setIsLoadingAi(false);
    };
    fetchInsights();
    return () => {
      isMounted = false;
    };
  }, [totalTasks, completedTasks, overdueTasks, totalFocusMinutes]);

  // Handle PDF Export / Print
  const handlePrintPdfReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 w-full flex flex-col p-4 overflow-y-auto space-y-4">
      {/* Header & Export PDF Button */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            System Specifications: Section 4
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Analytics & Reports
          </h2>
        </div>

        <button
          onClick={handlePrintPdfReport}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all"
          title="Print or Save as PDF Report"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Top 4 KPI Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Task Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {completionPercentage}%
          </div>
          <span className="text-[10px] text-slate-500">
            {completedTasks} of {totalTasks} finished
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Focus Logged</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalFocusHours}h
          </div>
          <span className="text-[10px] text-slate-500">
            {totalFocusMinutes} total minutes
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">In Progress</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {inProgressTasks}
          </div>
          <span className="text-[10px] text-slate-500">
            Active in queue
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Overdue Items</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {overdueTasks}
          </div>
          <span className="text-[10px] text-slate-500">
            {overdueTasks === 0 ? 'All deadlines clear' : 'Requires attention'}
          </span>
        </div>
      </div>

      {/* AI Performance Insights Box (From Notes) */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/20 rounded-3xl p-4 border border-indigo-200/60 dark:border-indigo-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                AI Performance Insights
              </h3>
              <p className="text-[10px] text-slate-500">Ask Genie Automated Diagnostics</p>
            </div>
          </div>

          {aiInsights && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {aiInsights.status}
            </span>
          )}
        </div>

        {aiInsights ? (
          <div className="space-y-2 text-xs">
            <ul className="space-y-1.5">
              {aiInsights.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-[11px]">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>

            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-indigo-100 dark:border-indigo-900/40 text-[11px]">
              <strong className="text-indigo-700 dark:text-indigo-300">Actionable Advice: </strong>
              <span className="text-slate-600 dark:text-slate-400">{aiInsights.actionableTip}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400">
            {isLoadingAi ? 'Synthesizing AI performance analysis...' : 'Collecting metrics...'}
          </div>
        )}
      </div>

      {/* Task Completion State (Visual Breakdown) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Task Completion State
        </h3>

        {/* Stacked Bar Indicator */}
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div
            style={{ width: `${(completedTasks / Math.max(totalTasks, 1)) * 100}%` }}
            className="bg-emerald-500 h-full"
            title={`Completed: ${completedTasks}`}
          />
          <div
            style={{ width: `${(inProgressTasks / Math.max(totalTasks, 1)) * 100}%` }}
            className="bg-indigo-500 h-full"
            title={`In Progress: ${inProgressTasks}`}
          />
          <div
            style={{ width: `${(todoTasks / Math.max(totalTasks, 1)) * 100}%` }}
            className="bg-slate-300 dark:bg-slate-600 h-full"
            title={`To Do: ${todoTasks}`}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Completed</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {completedTasks}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>In Progress</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {inProgressTasks}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>To Do</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {todoTasks}
            </span>
          </div>
        </div>
      </div>

      {/* Time Spent Analysis by Category */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Time Spent Analysis (by Category)
        </h3>

        <div className="space-y-2">
          {Object.entries(categoryBreakdown).map(([cat, data]) => {
            const pct = totalFocusMinutes > 0 ? Math.round((data.minutes / totalFocusMinutes) * 100) : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>{data.minutes}m focus</span>
                    <span>·</span>
                    <span>{data.count} tasks</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
