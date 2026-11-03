import React from 'react';
import { UserProfile, ReminderAlert } from '../types/task';
import { Menu, Plus, Bell, Moon, Sun, Filter } from 'lucide-react';

interface TopAppBarProps {
  currentUser: UserProfile;
  alerts: ReminderAlert[];
  onOpenMenu: () => void;
  onOpenCreateTask: () => void;
  onOpenAlerts: () => void;
  onToggleFilter: () => void;
  isFilterActive: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentUser,
  alerts,
  onOpenMenu,
  onOpenCreateTask,
  onOpenAlerts,
  onToggleFilter,
  isFilterActive,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const unreadAlerts = alerts.filter((a) => !a.read).length;
  // Get first name for "Hi, user !" sketch format
  const firstName = currentUser.name.split(' ')[0] || 'User';

  return (
    <div className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 py-2.5 flex items-center justify-between gap-2">
      {/* Left Slot: Hamburger Menu & Greeting */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onOpenMenu}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shrink-0"
          title="Open Navigation Menu"
          aria-label="Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Hi, {firstName}!
            </h2>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider shrink-0 ${
                currentUser.role === 'manager'
                  ? 'bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300'
                  : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {currentUser.role}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate hidden sm:block">
            {currentUser.title}
          </p>
        </div>
      </div>

      {/* Right Slot: Actions matching Wireframe Sketch */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Filter / Edit Button from wireframe */}
        <button
          onClick={onToggleFilter}
          className={`h-8 px-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
            isFilterActive
              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Filter / Edit View"
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Filter</span>
        </button>

        {/* Primary Create Button: [ Create + ] from sketch */}
        <button
          onClick={onOpenCreateTask}
          className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
          title="Create New Task"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create</span>
        </button>

        {/* Notification Bell (Level 1: Reminder Alerts) */}
        <button
          onClick={onOpenAlerts}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reminder Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlerts > 0 && (
            <span className="absolute 1 top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadAlerts}
            </span>
          )}
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
