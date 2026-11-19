import React from 'react';
import { UserProfile, ReminderAlert } from '../types/task';
import { Menu, Plus, Bell, Moon, Sun, Filter } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

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

  const isManager = currentUser.role === 'manager';

  return (
    <div
      className={`sticky top-0 z-30 w-full backdrop-blur-md border-b px-3 py-2.5 flex items-center justify-between gap-2 ${
        isManager
          ? 'bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 border-teal-800/80 text-white'
          : 'bg-white/95 dark:bg-black/95 border-indigo-100 dark:border-zinc-800'
      }`}
    >
      {/* Left Slot: Hamburger Menu & Greeting */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onOpenMenu}
          className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0 ${
            isManager
              ? 'text-teal-100 hover:bg-teal-800/60'
              : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
          title="Open Navigation Menu"
          aria-label="Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <div className="flex items-center gap-1.5">
            <h2
              className={`text-sm font-bold truncate ${
                isManager ? 'text-white' : 'text-slate-900 dark:text-zinc-100'
              }`}
            >
              {isManager ? `Command · ${firstName}` : `Hi, ${firstName}!`}
            </h2>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                isManager
                  ? 'bg-amber-400 text-zinc-950 border border-amber-300'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70'
              }`}
            >
              {currentUser.role}
            </span>
          </div>
          <p
            className={`text-[10px] truncate hidden sm:block ${
              isManager ? 'text-teal-200/80' : 'text-slate-400 dark:text-zinc-500'
            }`}
          >
            {isManager ? 'Manager Command Hub' : currentUser.title}
          </p>
        </div>
      </div>

      {/* Right Slot: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToggleFilter}
          className={`h-8 px-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
            isFilterActive
              ? isManager
                ? 'bg-teal-700 text-white border border-teal-500'
                : 'bg-indigo-600 text-white border border-indigo-500'
              : isManager
              ? 'text-teal-100 hover:bg-teal-800/60'
              : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
          title="Filter View"
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Filter</span>
        </button>

        <button
          onClick={onOpenCreateTask}
          className={`h-8 px-3 rounded-lg active:scale-95 text-xs font-bold flex items-center gap-1 shadow-sm transition-all ${
            isManager
              ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
              : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white'
          }`}
          title={isManager ? 'Assign New Team Task' : 'Create New Task'}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{isManager ? 'Assign' : 'Create'}</span>
        </button>

        <button
          onClick={onOpenAlerts}
          className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isManager
              ? 'text-teal-100 hover:bg-teal-800/60'
              : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
          title="Reminder Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlerts > 0 && (
            <span
              className={`absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                isManager
                  ? 'bg-amber-400 text-zinc-950 border border-teal-950'
                  : 'bg-indigo-600 text-white border border-white dark:border-black'
              }`}
            >
              {unreadAlerts}
            </span>
          )}
        </button>

        <PWAInstallButton variant="compact" />

        <button
          onClick={onToggleDarkMode}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isManager
              ? 'text-teal-100 hover:text-white hover:bg-teal-800/60'
              : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
          }`}
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
