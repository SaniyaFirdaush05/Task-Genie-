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
  CalendarDays,
  CalendarRange,
  Sun,
  ListTodo,
  Check,
} from 'lucide-react';

interface CalendarModuleProps {
  tasks: TaskItem[];
  currentUser: UserProfile;
  onOpenCreateTask: (date?: string, time?: string) => void;
  onSelectTask: (task: TaskItem) => void;
  onToggleMainTab: (tab: 'tasks' | 'calendar' | 'collaboration' | 'focus' | 'analytics') => void;
}

export type CalendarViewMode = 'monthly' | 'weekly' | 'daily';

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
  const [viewMode, setViewMode] = useState<CalendarViewMode>('monthly');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper date formatting YYYY-MM-DD
  const formatDateToIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Monthly navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Weekly navigation
  const prevWeek = () => {
    const nextD = new Date(currentDate);
    nextD.setDate(nextD.getDate() - 7);
    setCurrentDate(nextD);
  };
  const nextWeek = () => {
    const nextD = new Date(currentDate);
    nextD.setDate(nextD.getDate() + 7);
    setCurrentDate(nextD);
  };

  // Daily navigation
  const prevDay = () => {
    const nextD = new Date(currentDate);
    nextD.setDate(nextD.getDate() - 1);
    setCurrentDate(nextD);
    setSelectedDateStr(formatDateToIso(nextD));
  };
  const nextDay = () => {
    const nextD = new Date(currentDate);
    nextD.setDate(nextD.getDate() + 1);
    setCurrentDate(nextD);
    setSelectedDateStr(formatDateToIso(nextD));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(formatDateToIso(today));
  };

  // Unified navigation based on view mode
  const handleNavPrev = () => {
    if (viewMode === 'monthly') prevMonth();
    else if (viewMode === 'weekly') prevWeek();
    else prevDay();
  };

  const handleNavNext = () => {
    if (viewMode === 'monthly') nextMonth();
    else if (viewMode === 'weekly') nextWeek();
    else nextDay();
  };

  // Days in month calculation for Monthly view
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = Array.from(
    { length: firstDayIndex },
    (_, i) => daysInPrevMonth - firstDayIndex + i + 1
  );
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formatDayStr = (d: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Weekly calculation: get Sunday to Saturday of currentDate
  const getWeekDates = () => {
    const current = new Date(currentDate);
    const day = current.getDay();
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - day);

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(sunday);
      nextDay.setDate(sunday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  };

  const weekDates = getWeekDates();
  const weekStartStr = `${monthNamesShort[weekDates[0].getMonth()]} ${weekDates[0].getDate()}`;
  const weekEndStr = `${monthNamesShort[weekDates[6].getMonth()]} ${weekDates[6].getDate()}, ${weekDates[6].getFullYear()}`;

  // Tasks on selected date
  const selectedDateTasks = tasks.filter((t) => t.dueDate === selectedDateStr);

  // Daily mode hours list from 07:00 to 22:00
  const dailyHours = Array.from({ length: 16 }, (_, i) => {
    const h = i + 7;
    return `${String(h).padStart(2, '0')}:00`;
  });

  // Export .ics calendar file
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
    const endTime = (
      task.dueTime
        ? String(Number(task.dueTime.split(':')[0]) + 1).padStart(2, '0') + ':00'
        : '11:00'
    ).replace(':', '') + '00';
    const dates = `${cleanDate}T${startTime}/${cleanDate}T${endTime}`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      task.title
    )}&details=${encodeURIComponent(task.description || 'Managed via Task Genie')}&dates=${dates}`;
    window.open(url, '_blank');
  };

  const handleSimulateEmailReminder = (task: TaskItem) => {
    alert(
      `[Gmail Integration]\nDispatched reminder to ${task.assignedTo || currentUser.email}:\n"Reminder: '${task.title}' is scheduled for ${task.dueDate} at ${task.dueTime || '17:00'}"`
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col overflow-y-auto">
      {/* 3 Main Tabs header */}
      <div className="px-4 pt-3 pb-2 bg-white dark:bg-black border-b border-slate-200/80 dark:border-zinc-800 sticky top-0 z-20">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl text-xs font-semibold border border-transparent dark:border-zinc-800">
          <button
            onClick={() => onToggleMainTab('tasks')}
            className="flex-1 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5"
          >
            <span className="text-base leading-none">•</span>
            <span>Task</span>
          </button>
          <button
            onClick={() => onToggleMainTab('calendar')}
            className="flex-1 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs flex items-center justify-center gap-1.5"
          >
            <span className="text-base leading-none">•</span>
            <span>Calendar</span>
          </button>
          <button
            onClick={() => onToggleMainTab('collaboration')}
            className="flex-1 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5"
          >
            <span className="text-base leading-none">•</span>
            <span>Collaboration</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Calendar Modes Switcher (Monthly, Weekly, Daily) */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-1.5 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 flex-1">
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'monthly'
                  ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Monthly</span>
            </button>

            <button
              onClick={() => setViewMode('weekly')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'weekly'
                  ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Weekly</span>
            </button>

            <button
              onClick={() => {
                setViewMode('daily');
                setSelectedDateStr(formatDateToIso(currentDate));
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'daily'
                  ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Daily</span>
            </button>
          </div>
        </div>

        {/* Calendar Card View Container */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-3">
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {viewMode === 'monthly' && `${monthNames[month]} ${year}`}
                {viewMode === 'weekly' && `${weekStartStr} – ${weekEndStr}`}
                {viewMode === 'daily' &&
                  currentDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-medium">
                {viewMode === 'monthly' && 'Monthly View · D1 TaskStore'}
                {viewMode === 'weekly' && '7-Day Week Horizon'}
                {viewMode === 'daily' && 'Hourly Schedule & Time Blocking'}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={goToToday}
                className="px-2 py-1 text-[11px] font-semibold rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNavPrev}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
                title={`Previous ${viewMode === 'monthly' ? 'Month' : viewMode === 'weekly' ? 'Week' : 'Day'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNavNext}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
                title={`Next ${viewMode === 'monthly' ? 'Month' : viewMode === 'weekly' ? 'Week' : 'Day'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ================= MODE 1: MONTHLY VIEW ================= */}
          {viewMode === 'monthly' && (
            <div className="space-y-3 pt-1">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
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
                    className="h-10 rounded-xl flex flex-col items-center justify-center text-[11px] text-slate-300 dark:text-zinc-700 opacity-60"
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
                          ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-md font-bold scale-105'
                          : isToday
                          ? 'bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="text-xs">{d}</span>

                      {/* Task indicator dots */}
                      {dayTasks.length > 0 && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-white dark:bg-black'
                                : hasHighPriority
                                ? 'bg-rose-500'
                                : 'bg-zinc-500'
                            }`}
                          />
                          {dayTasks.length > 1 && (
                            <span
                              className={`w-1 h-1 rounded-full ${
                                isSelected ? 'bg-white/80 dark:bg-black/60' : 'bg-slate-400 dark:bg-zinc-600'
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
          )}

          {/* ================= MODE 2: WEEKLY VIEW ================= */}
          {viewMode === 'weekly' && (
            <div className="space-y-3 pt-1">
              {/* 7-Day Day Selector Strip */}
              <div className="grid grid-cols-7 gap-1">
                {weekDates.map((dateObj) => {
                  const dayIso = formatDateToIso(dateObj);
                  const dayName = daysOfWeek[dateObj.getDay()];
                  const dayNum = dateObj.getDate();
                  const isSelected = selectedDateStr === dayIso;
                  const isToday = formatDateToIso(new Date()) === dayIso;
                  const dayTasks = tasks.filter((t) => t.dueDate === dayIso);

                  return (
                    <button
                      key={dayIso}
                      onClick={() => {
                        setSelectedDateStr(dayIso);
                        setCurrentDate(dateObj);
                      }}
                      className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-md font-bold scale-102'
                          : isToday
                          ? 'bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white'
                          : 'bg-slate-50 dark:bg-black text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-tight opacity-75">{dayName}</span>
                      <span className="text-sm font-extrabold my-0.5">{dayNum}</span>
                      <div className="h-2 flex items-center justify-center">
                        {dayTasks.length > 0 ? (
                          <span
                            className={`text-[9px] font-bold px-1 rounded-full ${
                              isSelected
                                ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                                : 'bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200'
                            }`}
                          >
                            {dayTasks.length}
                          </span>
                        ) : (
                          <span className="text-[9px] opacity-30">·</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Weekly Day Breakdown List */}
              <div className="space-y-2 mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400 px-1">
                  <span>Weekly Task Schedule</span>
                  <button
                    onClick={() => onOpenCreateTask(selectedDateStr)}
                    className="text-xs text-indigo-600 dark:text-zinc-200 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
                  {weekDates.map((dateObj) => {
                    const dayIso = formatDateToIso(dateObj);
                    const dayTasks = tasks.filter((t) => t.dueDate === dayIso);
                    const isSelected = selectedDateStr === dayIso;

                    return (
                      <div
                        key={dayIso}
                        onClick={() => setSelectedDateStr(dayIso)}
                        className={`p-2.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-slate-800 dark:border-zinc-500 bg-slate-50/70 dark:bg-black/40'
                            : 'border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                              {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                              ({dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'})
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCreateTask(dayIso);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            title={`Add task for ${dayIso}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {dayTasks.length > 0 ? (
                          <div className="space-y-1.5">
                            {dayTasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectTask(task);
                                }}
                                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 hover:border-slate-400 dark:hover:border-zinc-700 cursor-pointer shadow-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-1.5 h-6 rounded-full shrink-0 ${
                                      task.priority === 'high'
                                        ? 'bg-rose-500'
                                        : task.priority === 'medium'
                                        ? 'bg-amber-500'
                                        : 'bg-zinc-400'
                                    }`}
                                  />
                                  <div className="min-w-0">
                                    <h4
                                      className={`text-xs font-bold truncate ${
                                        task.status === 'completed'
                                          ? 'line-through text-slate-400 dark:text-zinc-500'
                                          : 'text-slate-900 dark:text-zinc-100'
                                      }`}
                                    >
                                      {task.title}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500">
                                      <span>{task.category}</span>
                                      <span>·</span>
                                      <span>{task.dueTime || 'All Day'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {task.status === 'completed' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                                      {task.dueTime}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 dark:text-zinc-600 italic py-1">
                            No tasks scheduled for this day.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE 3: DAILY VIEW ================= */}
          {viewMode === 'daily' && (
            <div className="space-y-3 pt-1">
              {/* Daily KPI overview */}
              <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-2xl bg-slate-50 dark:bg-black border border-slate-200/80 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Total</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-zinc-100 font-mono">
                    {selectedDateTasks.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Done</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {selectedDateTasks.filter((t) => t.status === 'completed').length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Pending</span>
                  <span className="text-base font-extrabold text-amber-600 dark:text-zinc-200 font-mono">
                    {selectedDateTasks.filter((t) => t.status !== 'completed').length}
                  </span>
                </div>
              </div>

              {/* Time Blocking / Hourly Timeline Grid */}
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5">
                {dailyHours.map((hourStr) => {
                  const hourInt = parseInt(hourStr.split(':')[0], 10);
                  // Match tasks falling in this hour (e.g. 09:15 -> 09:00 hour slot)
                  const matchingTasks = selectedDateTasks.filter((t) => {
                    if (!t.dueTime) return false;
                    const taskHour = parseInt(t.dueTime.split(':')[0], 10);
                    return taskHour === hourInt;
                  });

                  return (
                    <div
                      key={hourStr}
                      className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-black/60 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-all"
                    >
                      {/* Hour stamp */}
                      <span className="w-12 text-[11px] font-mono font-semibold text-slate-400 dark:text-zinc-500 pt-0.5 shrink-0">
                        {hourStr}
                      </span>

                      {/* Content block in this hour */}
                      <div className="flex-1 min-w-0">
                        {matchingTasks.length > 0 ? (
                          <div className="space-y-1.5">
                            {matchingTasks.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => onSelectTask(t)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer shadow-xs transition-all ${
                                  t.status === 'completed'
                                    ? 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 opacity-70'
                                    : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-1.5 h-6 rounded-full shrink-0 ${
                                      t.priority === 'high'
                                        ? 'bg-rose-500'
                                        : t.priority === 'medium'
                                        ? 'bg-amber-500'
                                        : 'bg-zinc-400'
                                    }`}
                                  />
                                  <div className="min-w-0">
                                    <h4
                                      className={`text-xs font-bold truncate ${
                                        t.status === 'completed'
                                          ? 'line-through text-slate-400 dark:text-zinc-500'
                                          : 'text-slate-900 dark:text-zinc-100'
                                      }`}
                                    >
                                      {t.title}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500">
                                      <span>{t.category}</span>
                                      <span>·</span>
                                      <span>{t.dueTime}</span>
                                      {t.assignedTo && (
                                        <>
                                          <span>·</span>
                                          <span className="truncate">{t.assignedTo}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToGoogleCalendar(t);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200"
                                    title="Add to Google Calendar"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            onClick={() => onOpenCreateTask(selectedDateStr, hourStr)}
                            className="h-8 rounded-lg border border-dashed border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between px-2 text-[11px] text-slate-300 dark:text-zinc-700 hover:text-slate-600 dark:hover:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                          >
                            <span>+ Slot task at {hourStr}</span>
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Date Agenda (Visible in Monthly mode or for quick inspection) */}
        {viewMode === 'monthly' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                  Scheduled for {selectedDateStr}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''} assigned
                </p>
              </div>

              <button
                onClick={() => onOpenCreateTask(selectedDateStr)}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white text-white rounded-lg transition-colors flex items-center gap-1"
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
                    className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500 mb-1">
                          <span className="font-semibold text-slate-800 dark:text-zinc-300">{task.category}</span>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.dueTime || 'All Day'}</span>
                          </div>
                          {task.isRecurring && (
                            <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-0.5">
                              <Repeat className="w-2.5 h-2.5" />
                              <span>{task.recurringFrequency}</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {task.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToGoogleCalendar(task);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Add to Google Calendar Online"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateEmailReminder(task);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
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
              <div className="p-6 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-zinc-400">No events or tasks on this date.</p>
                <button
                  onClick={() => onOpenCreateTask(selectedDateStr)}
                  className="mt-2 text-xs font-semibold text-slate-900 dark:text-zinc-100 hover:underline"
                >
                  + Add task for {selectedDateStr}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Calendar Integrations Section */}
        <div className="bg-slate-100/70 dark:bg-zinc-950 rounded-2xl p-3 border border-slate-200 dark:border-zinc-800 text-xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
            Third-Party Calendar & Meetings Integration
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportIcs}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left"
            >
              <Download className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate text-slate-900 dark:text-zinc-100">Export .ICS</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Apple / Outlook</span>
              </div>
            </button>

            <button
              onClick={() => window.open('https://meet.google.com/new', '_blank')}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left"
            >
              <Video className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate text-slate-900 dark:text-zinc-100">Instant Meet</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Google Meet link</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
