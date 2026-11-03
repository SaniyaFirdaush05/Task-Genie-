import React, { useState } from 'react';
import { TaskItem, UserProfile } from '../types/task';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Download,
  Mail,
  Video,
  CheckCircle2,
  Circle,
  Repeat,
  Plus,
} from 'lucide-react';

interface CalendarModuleProps {
  tasks: TaskItem[];
  currentUser: UserProfile;
  onOpenCreateTask: (date?: string) => void;
  onSelectTask: (task: TaskItem) => void;
  onToggleMainTab: (tab: 'tasks' | 'calendar' | 'collaboration' | 'focus' | 'analytics') => void;
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  tasks,
  currentUser,
  onOpenCreateTask,
  onSelectTask,
  onToggleMainTab,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'agenda'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = Array.from({ length: firstDayIndex }, (_, i) => daysInPrevMonth - firstDayIndex + i + 1);
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Helper to format YYYY-MM-DD
  const formatDayStr = (d: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Tasks on selected date
  const selectedDateTasks = tasks.filter((t) => t.dueDate === selectedDateStr);

  // Export .ics calendar file for selected task or all upcoming tasks
  const handleExportIcs = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Task Genie//Android Task Manager//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`;

    tasks.forEach((task) => {
      const cleanDue = task.dueDate.replace(/-/g, '');
      const timePart = (task.dueTime || '09:00').replace(':', '') + '00';
      const dtStart = `${cleanDue}T${timePart}`;
      icsContent += `BEGIN:VEVENT\nSUMMARY:${task.title}\nDESCRIPTION:${task.description || ''}\nDTSTART:${dtStart}\nDTEND:${dtStart}\nSTATUS:${task.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}\nEND:VEVENT\n`;
    });

    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TaskGenie_Calendar_${selectedDateStr}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Direct Google Calendar Web Event generator
  const handleAddToGoogleCalendar = (task: TaskItem) => {
    const cleanDate = task.dueDate.replace(/-/g, '');
    const startTime = (task.dueTime || '10:00').replace(':', '') + '00';
    const endTime = (task.dueTime ? String(Number(task.dueTime.split(':')[0]) + 1).padStart(2, '0') + ':00' : '11:00').replace(':', '') + '00';
    const dates = `${cleanDate}T${startTime}/${cleanDate}T${endTime}`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      task.title
    )}&details=${encodeURIComponent(task.description || 'Managed via Task Genie')}&dates=${dates}`;
    window.open(url, '_blank');
  };

  const handleSimulateEmailReminder = (task: TaskItem) => {
    alert(`[Gmail Integration]\nDispatched reminder to ${task.assignedTo || currentUser.email}:\n"Reminder: '${task.title}' is scheduled for ${task.dueDate} at ${task.dueTime || '17:00'}"`);
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
            className="flex-1 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs flex items-center justify-center gap-1.5"
          >
            <span className="text-base leading-none">•</span>
            <span>Calendar</span>
          </button>
          <button
            onClick={() => onToggleMainTab('collaboration')}
            className="flex-1 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center justify-center gap-1.5"
          >
            <span className="text-base leading-none">•</span>
            <span>Collaboration</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Calendar Card (Level 1: Generate Calendar View) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {monthNames[month]} {year}
              </h2>
              <p className="text-[10px] text-slate-400">D1 TaskStore Calendar Module</p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={goToToday}
                className="px-2 py-1 text-[11px] font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Today
              </button>
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Previous month overflow days */}
            {prevMonthDays.map((d) => (
              <div
                key={`prev_${d}`}
                className="h-10 rounded-xl flex flex-col items-center justify-center text-[11px] text-slate-300 dark:text-slate-700 opacity-60"
              >
                <span>{d}</span>
              </div>
            ))}

            {/* Current month days */}
            {currentMonthDays.map((d) => {
              const dayStr = formatDayStr(d);
              const dayTasks = tasks.filter((t) => t.dueDate === dayStr);
              const isSelected = selectedDateStr === dayStr;
              const isToday = new Date().toISOString().split('T')[0] === dayStr;
              const hasHighPriority = dayTasks.some((t) => t.priority === 'high');

              return (
                <button
                  key={`cur_${d}`}
                  onClick={() => setSelectedDateStr(dayStr)}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold scale-105'
                      : isToday
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span className="text-xs">{d}</span>

                  {/* Task indicator dots */}
                  {dayTasks.length > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-white'
                            : hasHighPriority
                            ? 'bg-rose-500'
                            : 'bg-indigo-500'
                        }`}
                      />
                      {dayTasks.length > 1 && (
                        <span
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? 'bg-white/80' : 'bg-slate-400'
                          }`}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Task List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Scheduled for {selectedDateStr}
              </h3>
              <p className="text-[11px] text-slate-400">
                {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''} assigned
              </p>
            </div>

            <button
              onClick={() => onOpenCreateTask(selectedDateStr)}
              className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>
          </div>

          {selectedDateTasks.length > 0 ? (
            <div className="space-y-2">
              {selectedDateTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-indigo-600">{task.category}</span>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.dueTime || 'All Day'}</span>
                        </div>
                        {task.isRecurring && (
                          <span className="text-indigo-500 flex items-center gap-0.5">
                            <Repeat className="w-2.5 h-2.5" />
                            <span>{task.recurringFrequency}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {task.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToGoogleCalendar(task);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                        title="Add to Google Calendar Online"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateEmailReminder(task);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                        title="Dispatch Gmail Alert"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No events or tasks on this date.</p>
              <button
                onClick={() => onOpenCreateTask(selectedDateStr)}
                className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
              >
                + Add task for {selectedDateStr}
              </button>
            </div>
          )}
        </div>

        {/* Calendar Integrations Section (Image 2: Google Calendar, Gmail, Meet) */}
        <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Third-Party Calendar & Meetings Integration
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportIcs}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors text-left"
            >
              <Download className="w-4 h-4 text-indigo-500 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate">Export .ICS</span>
                <span className="text-[10px] text-slate-400">Apple / Outlook</span>
              </div>
            </button>

            <button
              onClick={() => window.open('https://meet.google.com/new', '_blank')}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors text-left"
            >
              <Video className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate">Instant Meet</span>
                <span className="text-[10px] text-slate-400">Google Meet link</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
