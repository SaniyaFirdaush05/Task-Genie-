import { TaskItem, TeamMember, UserProfile, ReminderAlert, AssignmentStatus } from '../types/task';

const D1_STORAGE_KEY = 'task_genie_d1_taskstore_v1';
const USER_STORAGE_KEY = 'task_genie_current_user_v1';
const ALERTS_STORAGE_KEY = 'task_genie_alerts_v1';

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'mem_1',
    name: 'Sarah Chen',
    email: 'sarah.chen@taskgenie.app',
    role: 'Lead UX Specialist',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    completedCount: 14,
    activeCount: 3,
  },
  {
    id: 'mem_2',
    name: 'Alex Rivera',
    email: 'alex.rivera@taskgenie.app',
    role: 'Project Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    completedCount: 22,
    activeCount: 5,
  },
  {
    id: 'mem_3',
    name: 'David Kim',
    email: 'david.kim@taskgenie.app',
    role: 'Full Stack Engineer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    completedCount: 19,
    activeCount: 4,
  },
  {
    id: 'mem_4',
    name: 'Emma Watson',
    email: 'emma.watson@taskgenie.app',
    role: 'Content & Strategy Analyst',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    completedCount: 16,
    activeCount: 2,
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
    assignedTo: 'Sarah Chen',
    assignedBy: 'Alex Rivera',
    assignmentStatus: 'accepted',
    comments: [
      {
        id: 'c_1',
        authorName: 'Alex Rivera',
        authorRole: 'manager',
        text: 'Please make sure slide 5 highlights the Ask Genie AI subtask division capabilities.',
        timestamp: '10:30 AM',
      },
      {
        id: 'c_2',
        authorName: 'Sarah Chen',
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
    assignedTo: 'Sarah Chen',
    assignedBy: 'Alex Rivera',
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
    assignedTo: 'David Kim',
    assignedBy: 'Alex Rivera',
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
    assignedTo: 'Sarah Chen',
    assignedBy: 'Alex Rivera',
    assignmentStatus: 'pending_acceptance', // Awaiting User -> Accept / Resign / Reject
    comments: [
      {
        id: 'c_31',
        authorName: 'Alex Rivera',
        authorRole: 'manager',
        text: 'Genie suggested you for this based on your prompt engineering strengths. Please accept or reject.',
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
    assignedTo: 'Sarah Chen',
    assignedBy: 'Alex Rivera',
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
      return JSON.parse(data);
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

  static logFocusMinutes(taskId: string, minutes: number) {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.focusMinutesSpent = (task.focusMinutesSpent || 0) + minutes;
    this.saveTasks(tasks);
  }

  // --- Current User Session Management ---
  static getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
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

  static resetToDemoData() {
    localStorage.setItem(D1_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
    this.notify();
  }
}
