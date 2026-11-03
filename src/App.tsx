/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TaskItem, UserProfile, ReminderAlert } from './types/task';
import { D1TaskStoreService, INITIAL_TASKS } from './store/taskStore';
import { AndroidFrame } from './components/AndroidFrame';
import { LoginScreen } from './components/LoginScreen';
import { TopAppBar } from './components/TopAppBar';
import { NavigationDrawer } from './components/NavigationDrawer';
import { TaskDashboard } from './components/TaskDashboard';
import { TaskModal } from './components/TaskModal';
import { CalendarModule } from './components/CalendarModule';
import { CollaborationWorkPlot } from './components/CollaborationWorkPlot';
import { FocusModePomodoro } from './components/FocusModePomodoro';
import { AnalyticsReports } from './components/AnalyticsReports';
import { AskGenieChatDrawer } from './components/AskGenieChatDrawer';
import { NotificationAlerts } from './components/NotificationAlerts';
import { ContextDiagramModal } from './components/ContextDiagramModal';
import {
  CheckSquare,
  Calendar as CalendarNavIcon,
  Users,
  Timer,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    D1TaskStoreService.getCurrentUser()
  );
  const [tasks, setTasks] = useState<TaskItem[]>(() => D1TaskStoreService.getTasks());
  const [alerts, setAlerts] = useState<ReminderAlert[]>(() => D1TaskStoreService.getAlerts());

  const [activeScreen, setActiveScreen] = useState<
    'tasks' | 'calendar' | 'collaboration' | 'focus' | 'analytics'
  >('tasks');

  // Modal / Drawer visibility
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [initialTemplate, setInitialTemplate] = useState<string | undefined>(undefined);
  const [isGenieDrawerOpen, setIsGenieDrawerOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTaskForFocus, setSelectedTaskForFocus] = useState<TaskItem | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Subscribe to D1 TaskStore changes
  useEffect(() => {
    const unsubscribe = D1TaskStoreService.subscribe(() => {
      setTasks(D1TaskStoreService.getTasks());
      setAlerts(D1TaskStoreService.getAlerts());
      setCurrentUser(D1TaskStoreService.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLoginSuccess = (user: UserProfile) => {
    D1TaskStoreService.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    D1TaskStoreService.setCurrentUser(null);
    setCurrentUser(null);
    setIsDrawerOpen(false);
  };

  const handleSwitchRole = () => {
    if (!currentUser) return;
    const newRole = currentUser.role === 'manager' ? 'user' : 'manager';
    const updated: UserProfile = {
      ...currentUser,
      role: newRole,
      title: newRole === 'manager' ? 'Project Manager' : 'Task Specialist',
    };
    D1TaskStoreService.setCurrentUser(updated);
    setCurrentUser(updated);
  };

  const handleOpenCreateTask = (templateTitle?: string) => {
    setTaskToEdit(null);
    setInitialTemplate(templateTitle);
    setIsCreateModalOpen(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setTaskToEdit(task);
    setInitialTemplate(undefined);
    setIsCreateModalOpen(true);
  };

  const handleStartFocus = (task: TaskItem) => {
    setSelectedTaskForFocus(task);
    setActiveScreen('focus');
  };

  const handleResetDemoData = () => {
    if (confirm('Reset D1 TaskStore to default items matching the notebook diagrams?')) {
      D1TaskStoreService.resetToDemoData();
    }
  };

  return (
    <AndroidFrame
      onResetDemoData={handleResetDemoData}
      onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
      onOpenGenie={() => setIsGenieDrawerOpen(true)}
    >
      {/* 1. If not logged in, render Login System first as requested */}
      {!currentUser ? (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
        />
      ) : (
        /* 2. Logged In -> Android Task Manager Dashboard */
        <div className="flex-1 w-full h-full flex flex-col overflow-hidden relative">
          {/* Top App Bar matching Wireframe: menu, "Hi, user!", Create (+), Edit/Filter */}
          <TopAppBar
            currentUser={currentUser}
            alerts={alerts}
            onOpenMenu={() => setIsDrawerOpen(true)}
            onOpenCreateTask={() => handleOpenCreateTask()}
            onOpenAlerts={() => setIsAlertsModalOpen(true)}
            onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
            isFilterActive={isFilterOpen}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          />

          {/* Active Screen Content */}
          <div className="flex-1 w-full flex flex-col overflow-hidden relative">
            {activeScreen === 'tasks' && (
              <TaskDashboard
                tasks={tasks}
                currentUser={currentUser}
                onOpenCreateTask={handleOpenCreateTask}
                onEditTask={handleEditTask}
                onStartFocus={handleStartFocus}
                onOpenGenieWithTask={(task) => {
                  setSelectedTaskForFocus(task);
                  setIsGenieDrawerOpen(true);
                }}
                onSelectTab={(tab) => setActiveScreen(tab)}
                activeMainTab={activeScreen}
                isFilterOpen={isFilterOpen}
              />
            )}

            {activeScreen === 'calendar' && (
              <CalendarModule
                tasks={tasks}
                currentUser={currentUser}
                onOpenCreateTask={(dateStr) => {
                  setTaskToEdit(null);
                  setInitialTemplate(undefined);
                  setIsCreateModalOpen(true);
                }}
                onSelectTask={(task) => handleEditTask(task)}
                onToggleMainTab={(tab) => setActiveScreen(tab)}
              />
            )}

            {activeScreen === 'collaboration' && (
              <CollaborationWorkPlot
                tasks={tasks}
                currentUser={currentUser}
                onToggleMainTab={(tab) => setActiveScreen(tab)}
                onSelectTask={(task) => handleEditTask(task)}
              />
            )}

            {activeScreen === 'focus' && (
              <FocusModePomodoro
                tasks={tasks}
                selectedTask={selectedTaskForFocus}
                onSelectTask={(t) => setSelectedTaskForFocus(t)}
                onExitFocus={() => setActiveScreen('tasks')}
              />
            )}

            {activeScreen === 'analytics' && (
              <AnalyticsReports tasks={tasks} currentUser={currentUser} />
            )}
          </div>

          {/* Floating "AI" Genie Action Button (matching circle AI button in Image 1 wireframe sketch) */}
          <div className="absolute right-4 bottom-18 z-30">
            <button
              onClick={() => setIsGenieDrawerOpen(true)}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-white shadow-xl shadow-amber-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all ring-4 ring-white dark:ring-slate-900 group"
              title="Open Ask Genie AI Assistant"
            >
              <div className="flex flex-col items-center justify-center leading-none">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
                <span className="text-[9px] font-black tracking-tighter mt-0.5">AI</span>
              </div>
            </button>
          </div>

          {/* Android Bottom Navigation Bar (Pattern 1 from Mobile touch guideline) */}
          <div className="w-full h-15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-5 items-center px-1 shrink-0 z-20">
            <button
              onClick={() => setActiveScreen('tasks')}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                activeScreen === 'tasks'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-1">Tasks</span>
            </button>

            <button
              onClick={() => setActiveScreen('calendar')}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                activeScreen === 'calendar'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <CalendarNavIcon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-1">Calendar</span>
            </button>

            <button
              onClick={() => setActiveScreen('collaboration')}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                activeScreen === 'collaboration'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-1">Team</span>
            </button>

            <button
              onClick={() => setActiveScreen('focus')}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                activeScreen === 'focus'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Timer className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-1">Focus FM</span>
            </button>

            <button
              onClick={() => setActiveScreen('analytics')}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                activeScreen === 'analytics'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-1">Reports</span>
            </button>
          </div>

          {/* Navigation Drawer Menu */}
          <NavigationDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            currentUser={currentUser}
            activeScreen={activeScreen}
            onNavigate={(screen) => setActiveScreen(screen)}
            onSwitchRole={handleSwitchRole}
            onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
            onLogout={handleLogout}
          />

          {/* Task Create / Edit Dialog */}
          <TaskModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            taskToEdit={taskToEdit}
            initialTitleTemplate={initialTemplate}
          />

          {/* Ask Genie AI Chat Drawer */}
          <AskGenieChatDrawer
            isOpen={isGenieDrawerOpen}
            onClose={() => setIsGenieDrawerOpen(false)}
            tasks={tasks}
            currentUser={currentUser}
          />

          {/* Reminder Notifications Dialog */}
          <NotificationAlerts
            isOpen={isAlertsModalOpen}
            onClose={() => setIsAlertsModalOpen(false)}
            alerts={alerts}
            onSelectTaskId={(id) => {
              const t = tasks.find((item) => item.id === id);
              if (t) handleEditTask(t);
            }}
          />

          {/* Context Diagram & Level 1 DFD Architecture Modal */}
          <ContextDiagramModal
            isOpen={isArchitectureModalOpen}
            onClose={() => setIsArchitectureModalOpen(false)}
            onNavigateToModule={(mod) => setActiveScreen(mod)}
          />
        </div>
      )}
    </AndroidFrame>
  );
}
