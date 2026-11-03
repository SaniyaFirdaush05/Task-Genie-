export type Priority = 'high' | 'medium' | 'low';

export type TaskCategory = 'Work' | 'Study' | 'Project' | 'Assignment' | 'Meeting' | 'Personal';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';

export type AssignmentStatus = 'unassigned' | 'pending_acceptance' | 'accepted' | 'rejected' | 'resigned';

export type UserRole = 'user' | 'manager';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface TaskComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  timestamp: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: Priority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  nextOccurrenceDate?: string;
  subtasks: Subtask[];
  attachments: Attachment[];
  assignedTo?: string; // Team member name or email
  assignedBy?: string;
  assignmentStatus?: AssignmentStatus;
  assignmentResponseNote?: string;
  comments: TaskComment[];
  focusMinutesSpent: number;
  completedAt?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  completedCount: number;
  activeCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
}

export interface ReminderAlert {
  id: string;
  taskId: string;
  taskTitle: string;
  dueTime: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface DailyGoal {
  id: string;
  objective: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  linkedTaskId?: string;
  completedAt?: string;
  createdAt: string;
}

