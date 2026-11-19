import { TaskItem, TeamMember, UserProfile, ReminderAlert, AssignmentStatus, DailyGoal, DailyFocusStats } from '../types/task';

const D1_STORAGE_KEY = 'task_genie_d1_taskstore_v1';
const USER_STORAGE_KEY = 'task_genie_current_user_v1';
const ALERTS_STORAGE_KEY = 'task_genie_alerts_v1';
const DAILY_GOAL_STORAGE_KEY = 'task_genie_daily_goal_v1';
const DAILY_FOCUS_STORAGE_KEY = 'task_genie_daily_focus_v1';
const DAILY_FOCUS_GOAL_MINUTES_KEY = 'task_genie_daily_focus_goal_mins_v1';

const makeAvatar = (initials: string, bgStart: string, bgEnd: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bgStart}"/><stop offset="100%" stop-color="${bgEnd}"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(#g)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui,-apple-system,sans-serif" font-size="42" font-weight="700">${initials}</text></svg>`
  )}`;

const LEGACY_MEMBER_MAP: Record<string, string> = {
  'Sarah Chen': 'Jyoti Kumari',
  'Alex Rivera': 'Saniya Firdaush',
  'David Kim': 'Utpreksha Kashyap',
  'Emma Watson': 'Shambhavi Maddheshiya',
};

const normalizeLegacyName = (value?: string): string | undefined => {
  if (!value) return value;
  let updated = value;
  for (const [oldName, newName] of Object.entries(LEGACY_MEMBER_MAP)) {
    if (updated.includes(oldName)) {
      updated = updated.replaceAll(oldName, newName);
    }
  }
  return updated;
};

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'mem_1',
    name: 'Jyoti Kumari',
    email: 'jyoti.kumari@taskgenie.app',
    role: 'Project Analyst',
    sharedResponsibility: 'Development & Coding',
    avatar: makeAvatar('JK', '#334155', '#0f172a'),
    completedCount: 0,
    activeCount: 0,
  },
  {
    id: 'mem_2',
    name: 'Shambhavi Maddheshiya',
    email: 'shambhavi.maddheshiya@taskgenie.app',
    role: 'Requirement Analyst',
    sharedResponsibility: 'Development & Coding',
    avatar: makeAvatar('SM', '#3f3f46', '#18181b'),
    completedCount: 0,
    activeCount: 0,
  },
  {
    id: 'mem_3',
    name: 'Saniya Firdaush',
    email: 'saniya.firdaush@taskgenie.app',
    role: 'Project Manager',
    sharedResponsibility: 'Development & Coding',
    avatar: makeAvatar('SF', '#312e81', '#1e1b4b'),
    completedCount: 0,
    activeCount: 0,
  },
  {
    id: 'mem_4',
    name: 'Utpreksha Kashyap',
    email: 'utpreksha.kashyap@taskgenie.app',
    role: 'System Designer',
    sharedResponsibility: 'Development & Coding',
    avatar: makeAvatar('UK', '#27272a', '#09090b'),
    completedCount: 0,
    activeCount: 0,
  },
  {
    id: 'mem_5',
    name: 'Riya Pant',
    email: 'riya.pant@taskgenie.app',
    role: 'QA Engineer',
    sharedResponsibility: 'Development & Coding',
    avatar: makeAvatar('RP', '#475569', '#1e293b'),
    completedCount: 0,
    activeCount: 0,
  },
];

// Helper to get formatted dates relative to today
const getRelativeDateStr = (dayOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split('T')[0];
};

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task_create_ppt',
    title: 'Create PPT - Q4 Roadmap Presentation',
    description: 'Prepare keynote presentation deck for the upcoming executive review. Include metrics, milestones, and architectural diagrams.',
    category: 'Assignment',
    priority: 'high',
    status: 'in_progress',
    dueDate: getRelativeDateStr(0), // Today!
    dueTime: '16:00',
    isRecurring: false,
    subtasks: [
      { id: 'sub_1', title: 'Outline key slide narrative & takeaways', completed: true, estimatedMinutes: 20 },
      { id: 'sub_2', title: 'Gather Level 1 DFD and Context diagrams', completed: true, estimatedMinutes: 30 },
      { id: 'sub_3', title: 'Design visual layouts and format typography', completed: false, estimatedMinutes: 45 },
      { id: 'sub_4', title: 'Rehearse presentation timing and export PDF deck', completed: false, estimatedMinutes: 25 },
    ],
    attachments: [
      { id: 'att_1', name: 'Q4_Roadmap_Draft.pptx', size: '4.2 MB', type: 'presentation' },
      { id: 'att_2', name: 'Context_Diagram_Rough.png', size: '1.8 MB', type: 'image' },
    ],
    assignedTo: 'Jyoti Kumari',
    assignedBy: 'Saniya Firdaush',
    assignmentStatus: 'accepted',
    comments: [
      {
        id: 'c_1',
        authorName: 'Saniya Firdaush',
        authorRole: 'manager',
        text: 'Please make sure slide 5 highlights the Ask Genie AI subtask division capabilities.',
        timestamp: '10:30 AM',
      },
      {
        id: 'c_2',
        authorName: 'Jyoti Kumari',
        authorRole: 'user',
        text: 'On it! Already finished the first two sections.',
        timestamp: '11:15 AM',
      },
    ],
    focusMinutesSpent: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task_weekly_sync',
    title: 'Weekly Team Collaboration Sync',
    description: 'Review task completion status, reassign overdue items, and discuss work plot workload balancing.',
    category: 'Meeting',
    priority: 'medium',
    status: 'todo',
    dueDate: getRelativeDateStr(1), // Tomorrow
    dueTime: '11:00',
    isRecurring: true,
    recurringFrequency: 'weekly',
    nextOccurrenceDate: getRelativeDateStr(8),
    subtasks: [
      { id: 'sub_21', title: 'Review sprint deliverables', completed: false, estimatedMinutes: 15 },
      { id: 'sub_22', title: 'Allocate upcoming tasks via Ask Genie suggestions', completed: false, estimatedMinutes: 20 },
    ],
    attachments: [
      { id: 'att_21', name: 'Meeting_Agenda.pdf', size: '640 KB', type: 'document' },
    ],
    assignedTo: 'Shambhavi Maddheshiya',
    assignedBy: 'Saniya Firdaush',
    assignmentStatus: 'accepted',
    comments: [],
    focusMinutesSpent: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task_arch_review',
    title: 'Level 1 DFD & Calendar Module Verification',
    description: 'Ensure D1 TaskStore, reminder alerts, and Pomodoro focus modules are strictly aligned with system specifications.',
    category: 'Project',
    priority: 'high',
    status: 'in_progress',
    dueDate: getRelativeDateStr(2),
    dueTime: '14:30',
    isRecurring: false,
    subtasks: [
      { id: 'sub_31', title: 'Verify Manage Scheduled Task process data flow', completed: true, estimatedMinutes: 30 },
      { id: 'sub_32', title: 'Check Next Occurrence Data generation on recurring tasks', completed: false, estimatedMinutes: 25 },
      { id: 'sub_33', title: 'Validate Reminder Notification dispatch trigger', completed: false, estimatedMinutes: 15 },
    ],
    attachments: [
      { id: 'att_31', name: 'Scheduling_Calendar_Module_Spec.docx', size: '1.2 MB', type: 'document' }
    ],
    assignedTo: 'Utpreksha Kashyap',
    assignedBy: 'Saniya Firdaush',
    assignmentStatus: 'accepted',
    comments: [],
    focusMinutesSpent: 25,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task_suggested_assignment',
    title: 'AI Subtask Engine Benchmarking',
    description: 'Benchmark Ask Genie division algorithm with complex academic and engineering workloads.',
    category: 'Work',
    priority: 'medium',
    status: 'todo',
    dueDate: getRelativeDateStr(3),
    dueTime: '17:00',
    isRecurring: false,
    subtasks: [
      { id: 'sub_41', title: 'Prepare 10 prompt test cases', completed: false, estimatedMinutes: 20 },
      { id: 'sub_42', title: 'Measure subtask granularity and accuracy', completed: false, estimatedMinutes: 30 },
    ],
    attachments: [],
    assignedTo: 'Riya Pant',
    assignedBy: 'Saniya Firdaush',
    assignmentStatus: 'pending_acceptance', // Awaiting User -> Accept / Resign / Reject
    comments: [
      {
        id: 'c_31',
        authorName: 'Saniya Firdaush',
        authorRole: 'manager',
        text: 'Genie suggested you for this QA & benchmarking task. Please accept or reject.',
        timestamp: '09:00 AM',
      }
    ],
    focusMinutesSpent: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task_done_example',
    title: 'Submit Initial User Context Diagram',
    description: 'Completed submission of Level 0 context diagram with User, Manager, Gmail, and 3rd Party API nodes.',
    category: 'Assignment',
    priority: 'low',
    status: 'completed',
    dueDate: getRelativeDateStr(-1),
    dueTime: '12:00',
    isRecurring: false,
    subtasks: [
      { id: 'sub_51', title: 'Sketch node entities', completed: true, estimatedMinutes: 20 },
      { id: 'sub_52', title: 'Document notification and permission flows', completed: true, estimatedMinutes: 25 },
    ],
    attachments: [
      { id: 'att_51', name: 'Context_Diagram_Final.jpeg', size: '2.1 MB', type: 'image' }
    ],
    assignedTo: 'Jyoti Kumari',
    assignedBy: 'Saniya Firdaush',
    assignmentStatus: 'accepted',
    comments: [],
    focusMinutesSpent: 45,
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  }
];

export class D1TaskStoreService {
  private static listeners: Array<() => void> = [];

  static subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notify() {
    this.listeners.forEach((l) => l());
  }

  static getTasks(): TaskItem[] {
    try {
      const data = localStorage.getItem(D1_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(D1_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
        return INITIAL_TASKS;
      }
      const parsed: TaskItem[] = JSON.parse(data);
      let migrated = false;
      const normalized = parsed.map((t) => {
        const nextAssignedTo = normalizeLegacyName(t.assignedTo);
        const nextAssignedBy = normalizeLegacyName(t.assignedBy);
        const nextComments = (t.comments || []).map((c) => {
          const nextAuthor = normalizeLegacyName(c.authorName) || c.authorName;
          if (nextAuthor !== c.authorName) migrated = true;
          return { ...c, authorName: nextAuthor };
        });
        if (nextAssignedTo !== t.assignedTo || nextAssignedBy !== t.assignedBy) {
          migrated = true;
        }
        return {
          ...t,
          assignedTo: nextAssignedTo,
          assignedBy: nextAssignedBy,
          comments: nextComments,
        };
      });
      if (migrated) {
        localStorage.setItem(D1_STORAGE_KEY, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return INITIAL_TASKS;
    }
  }

  static saveTasks(tasks: TaskItem[]) {
    try {
      localStorage.setItem(D1_STORAGE_KEY, JSON.stringify(tasks));
      this.notify();
    } catch (e) {
      console.error('Error saving to D1 TaskStore', e);
    }
  }

  static addTask(task: Omit<TaskItem, 'id' | 'createdAt' | 'focusMinutesSpent'>): TaskItem {
    const tasks = this.getTasks();
    const newTask: TaskItem = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      focusMinutesSpent: 0,
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);

    // Auto-generate reminder alert if upcoming within 24 hours
    this.checkAndGenerateAlert(newTask);

    return newTask;
  }

  static updateTask(id: string, updates: Partial<TaskItem>): TaskItem | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    // Check if recurring task is marked complete -> calculate next occurrence as in Level 1 diagram
    const oldTask = tasks[index];
    let updatedTask: TaskItem = { ...oldTask, ...updates };

    if (updates.status === 'completed' && oldTask.status !== 'completed') {
      updatedTask.completedAt = new Date().toISOString();

      if (updatedTask.isRecurring && updatedTask.recurringFrequency) {
        // Generate next occurrence date
        const currentDue = new Date(updatedTask.dueDate);
        const nextDue = new Date(currentDue);
        if (updatedTask.recurringFrequency === 'daily') nextDue.setDate(nextDue.getDate() + 1);
        else if (updatedTask.recurringFrequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
        else if (updatedTask.recurringFrequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);

        const nextDueStr = nextDue.toISOString().split('T')[0];

        // Create the next recurring instance automatically
        const nextTask: TaskItem = {
          ...updatedTask,
          id: `task_${Date.now()}_rec`,
          status: 'todo',
          dueDate: nextDueStr,
          completedAt: undefined,
          subtasks: updatedTask.subtasks.map((s, idx) => ({ ...s, id: `sub_${Date.now()}_${idx}`, completed: false })),
          createdAt: new Date().toISOString(),
        };
        tasks.unshift(nextTask);
      }
    }

    tasks[index] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  }

  static deleteTask(id: string) {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
  }

  static toggleSubtask(taskId: string, subtaskId: string) {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.subtasks = task.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s));

    // If all subtasks completed, mark task completed
    const allDone = task.subtasks.length > 0 && task.subtasks.every((s) => s.completed);
    if (allDone && task.status !== 'completed') {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
    } else if (!allDone && task.status === 'completed') {
      task.status = 'in_progress';
      task.completedAt = undefined;
    }

    this.saveTasks(tasks);
  }

  static respondToAssignment(taskId: string, response: 'accepted' | 'resigned' | 'rejected', note?: string) {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.assignmentStatus = response;
    if (note) task.assignmentResponseNote = note;

    if (response === 'rejected' || response === 'resigned') {
      task.status = 'todo';
    }

    this.saveTasks(tasks);
  }

  static addComment(taskId: string, authorName: string, authorRole: 'user' | 'manager', text: string) {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.comments.push({
      id: `comm_${Date.now()}`,
      authorName,
      authorRole,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    this.saveTasks(tasks);
  }

  static logFocusMinutes(taskId: string | undefined, minutes: number, sessionType: 'work' | 'deepFocus' = 'work') {
    const todayStr = getRelativeDateStr(0);
    const focusMap = this.getDailyFocusMap();
    const existing = focusMap[todayStr] || {
      date: todayStr,
      totalMinutes: 0,
      sessionsCount: 0,
      deepFocusSessions: 0,
      pomodoroSessions: 0,
    };

    focusMap[todayStr] = {
      ...existing,
      totalMinutes: existing.totalMinutes + minutes,
      sessionsCount: existing.sessionsCount + 1,
      deepFocusSessions: existing.deepFocusSessions + (sessionType === 'deepFocus' ? 1 : 0),
      pomodoroSessions: existing.pomodoroSessions + (sessionType === 'work' ? 1 : 0),
    };
    localStorage.setItem(DAILY_FOCUS_STORAGE_KEY, JSON.stringify(focusMap));

    const tasks = this.getTasks();
    const task = taskId ? tasks.find((t) => t.id === taskId) : undefined;
    if (task) {
      task.focusMinutesSpent = (task.focusMinutesSpent || 0) + minutes;
      this.saveTasks(tasks);
    } else {
      this.notify();
    }
  }

  private static getDailyFocusMap(): Record<string, DailyFocusStats> {
    try {
      const raw = localStorage.getItem(DAILY_FOCUS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }

      // Seed initial per-day focus data from tasks' existing focusMinutesSpent
      const todayStr = getRelativeDateStr(0);
      const twoDaysAgoStr = getRelativeDateStr(-2);
      const seeded: Record<string, DailyFocusStats> = {};
      const tasks = this.getTasks();

      for (const task of tasks) {
        if (!task.focusMinutesSpent || task.focusMinutesSpent <= 0) continue;
        const targetDate = task.completedAt
          ? task.completedAt.split('T')[0]
          : task.dueDate <= todayStr
            ? task.dueDate
            : twoDaysAgoStr;

        const current = seeded[targetDate] || {
          date: targetDate,
          totalMinutes: 0,
          sessionsCount: 0,
          deepFocusSessions: 0,
          pomodoroSessions: 0,
        };

        const isDeep = task.focusMinutesSpent === 45;
        const estSessions = Math.max(1, Math.round(task.focusMinutesSpent / (isDeep ? 45 : 25)));
        seeded[targetDate] = {
          date: targetDate,
          totalMinutes: current.totalMinutes + task.focusMinutesSpent,
          sessionsCount: current.sessionsCount + estSessions,
          deepFocusSessions: current.deepFocusSessions + (isDeep ? estSessions : 0),
          pomodoroSessions: current.pomodoroSessions + (isDeep ? 0 : estSessions),
        };
      }

      localStorage.setItem(DAILY_FOCUS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    } catch {
      return {};
    }
  }

  static getDailyFocusSummary(days = 7): DailyFocusStats[] {
    const map = this.getDailyFocusMap();
    const result: DailyFocusStats[] = [];
    for (let i = 0; i < days; i++) {
      const dateStr = getRelativeDateStr(-i);
      result.push(
        map[dateStr] || {
          date: dateStr,
          totalMinutes: 0,
          sessionsCount: 0,
          deepFocusSessions: 0,
          pomodoroSessions: 0,
        }
      );
    }
    return result;
  }

  static getTodayFocusStats(): DailyFocusStats {
    const todayStr = getRelativeDateStr(0);
    const map = this.getDailyFocusMap();
    return (
      map[todayStr] || {
        date: todayStr,
        totalMinutes: 0,
        sessionsCount: 0,
        deepFocusSessions: 0,
        pomodoroSessions: 0,
      }
    );
  }

  static getDailyFocusGoalMinutes(): number {
    try {
      const raw = localStorage.getItem(DAILY_FOCUS_GOAL_MINUTES_KEY);
      if (!raw) return 120;
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed >= 15 ? parsed : 120;
    } catch {
      return 120;
    }
  }

  static setDailyFocusGoalMinutes(minutes: number) {
    const clamped = Math.max(15, Math.min(480, Math.round(minutes)));
    localStorage.setItem(DAILY_FOCUS_GOAL_MINUTES_KEY, String(clamped));
    this.notify();
  }

  // --- Current User Session Management ---
  static getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY);
      if (!data) return null;
      const user: UserProfile = JSON.parse(data);
      const nextName = normalizeLegacyName(user.name) || user.name;
      if (nextName !== user.name) {
        const matched = INITIAL_TEAM_MEMBERS.find((m) => m.name === nextName);
        const updated: UserProfile = {
          ...user,
          name: nextName,
          email: matched?.email || user.email,
          avatar: matched?.avatar || user.avatar,
          title: matched?.role || user.title,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }
      return user;
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: UserProfile | null) {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    this.notify();
  }

  // --- Level 1 Diagram: Generate Reminder Alerts ---
  static getAlerts(): ReminderAlert[] {
    try {
      const data = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (!data) {
        const initialAlerts: ReminderAlert[] = [
          {
            id: 'alert_1',
            taskId: 'task_create_ppt',
            taskTitle: 'Create PPT - Q4 Roadmap Presentation',
            dueTime: 'Due Today at 16:00',
            message: 'High priority task scheduled today. 2 of 4 subtasks pending.',
            read: false,
            timestamp: 'Just now',
          },
          {
            id: 'alert_2',
            taskId: 'task_suggested_assignment',
            taskTitle: 'AI Subtask Engine Benchmarking',
            dueTime: 'Pending Response',
            message: 'Manager assigned new work. Please Accept or Reject.',
            read: false,
            timestamp: '1 hour ago',
          },
        ];
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(initialAlerts));
        return initialAlerts;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static markAlertRead(alertId: string) {
    const alerts = this.getAlerts().map((a) => (a.id === alertId ? { ...a, read: true } : a));
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    this.notify();
  }

  static clearAlerts() {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify([]));
    this.notify();
  }

  private static checkAndGenerateAlert(task: TaskItem) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (task.dueDate === todayStr) {
      const alerts = this.getAlerts();
      alerts.unshift({
        id: `alert_${Date.now()}`,
        taskId: task.id,
        taskTitle: task.title,
        dueTime: task.dueTime ? `Due today at ${task.dueTime}` : 'Due today',
        message: `Task is scheduled for today (${task.priority.toUpperCase()} priority).`,
        read: false,
        timestamp: 'Just now',
      });
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts.slice(0, 10)));
    }
  }

  // --- Daily Goal Management ---
  static getDailyGoal(targetDate?: string): DailyGoal | null {
    const dateStr = targetDate || new Date().toISOString().split('T')[0];
    try {
      const data = localStorage.getItem(`${DAILY_GOAL_STORAGE_KEY}_${dateStr}`);
      if (!data) {
        // Return a default demo goal for today if none exists yet
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateStr === todayStr) {
          const defaultGoal: DailyGoal = {
            id: `goal_${todayStr}`,
            objective: 'Complete keynote presentation deck & review architecture',
            date: todayStr,
            completed: false,
            linkedTaskId: 'task_create_ppt',
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(`${DAILY_GOAL_STORAGE_KEY}_${todayStr}`, JSON.stringify(defaultGoal));
          return defaultGoal;
        }
        return null;
      }
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static setDailyGoal(goal: DailyGoal | null, targetDate?: string) {
    const dateStr = targetDate || goal?.date || new Date().toISOString().split('T')[0];
    if (goal) {
      localStorage.setItem(`${DAILY_GOAL_STORAGE_KEY}_${dateStr}`, JSON.stringify(goal));
    } else {
      localStorage.removeItem(`${DAILY_GOAL_STORAGE_KEY}_${dateStr}`);
    }
    this.notify();
  }

  static toggleDailyGoalComplete(targetDate?: string): DailyGoal | null {
    const goal = this.getDailyGoal(targetDate);
    if (!goal) return null;
    goal.completed = !goal.completed;
    goal.completedAt = goal.completed ? new Date().toISOString() : undefined;
    this.setDailyGoal(goal);
    return goal;
  }

  static resetToDemoData() {
    localStorage.setItem(D1_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
    localStorage.removeItem(DAILY_FOCUS_STORAGE_KEY);
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultGoal: DailyGoal = {
      id: `goal_${todayStr}`,
      objective: 'Complete keynote presentation deck & review architecture',
      date: todayStr,
      completed: false,
      linkedTaskId: 'task_create_ppt',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(`${DAILY_GOAL_STORAGE_KEY}_${todayStr}`, JSON.stringify(defaultGoal));
    this.notify();
  }
}
