import React from 'react';
import { UserProfile } from '../types/task';
import { CheckSquare, Calendar, Users, Timer, BarChart3, FileCode, LogOut, X, Shield, UserCheck } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  activeScreen: 'tasks' | 'calendar' | 'collaboration' | 'focus' | 'analytics';
  onNavigate: (screen: 'tasks' | 'calendar' | 'collaboration' | 'focus' | 'analytics') => void;
  onSwitchRole: () => void;
  onOpenArchitecture: () => void;
  onLogout: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeScreen,
  onNavigate,
  onSwitchRole,
  onOpenArchitecture,
  onLogout,
}) => {
  if (!isOpen) return null;

  const navItems = [
    { id: 'tasks', label: 'Tasks Dashboard', icon: CheckSquare, badge: 'Main' },
    { id: 'calendar', label: 'Scheduling & Calendar', icon: Calendar, badge: 'L1 DFD' },
    { id: 'collaboration', label: 'Collaboration (Work Plot)', icon: Users, badge: 'Team' },
    { id: 'focus', label: 'Focus Mode (Pomodoro FM)', icon: Timer, badge: 'Spec' },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, badge: 'PDF' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-72 max-w-[80%] h-full bg-white dark:bg-black shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 border-r border-transparent dark:border-zinc-800">
        <div>
          {/* Header Profile Section */}
          <div className="p-4 bg-slate-900 dark:bg-zinc-900 text-white relative border-b border-transparent dark:border-zinc-800">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mt-2">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/30"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate">{currentUser.name}</h3>
                <p className="text-[11px] text-white/80 truncate">{currentUser.email}</p>
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-medium backdrop-blur-xs uppercase">
                  {currentUser.role === 'manager' ? (
                    <>
                      <Shield className="w-3 h-3" />
                      <span>Manager Role</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3" />
                      <span>User Role</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Switch Role button */}
            <button
              onClick={onSwitchRole}
              className="mt-3 w-full py-1.5 px-3 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-medium text-white transition-colors flex items-center justify-center gap-1.5 text-center"
            >
              <span>Switch to {currentUser.role === 'manager' ? 'User Mode' : 'Manager Mode'}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-slate-900 dark:text-white font-semibold border border-transparent dark:border-zinc-800'
                      : 'text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-slate-400 dark:text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-transparent dark:border-zinc-800">
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="px-4 py-2 space-y-2">
            <PWAInstallButton variant="drawer" />
            <div className="border-t border-slate-200 dark:border-zinc-800 my-2"></div>
            <button
              onClick={() => {
                onOpenArchitecture();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-colors"
            >
              <FileCode className="w-4 h-4 text-zinc-400" />
              <span>Diagrams & DFD Specifications</span>
            </button>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-zinc-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-900 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
