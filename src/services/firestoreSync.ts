import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  deleteField,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  TaskItem,
  DailyGoal,
  DailyFocusStats,
  ReminderAlert,
  UserProfile,
} from '../types/task';

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

function buildTaskPayload(task: TaskItem, uid: string, isCreate: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: (task.title || 'Untitled Task').slice(0, 200),
    description: (task.description || '').slice(0, 2000),
    category: task.category,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    isRecurring: Boolean(task.isRecurring),
    subtasks: (task.subtasks || []).slice(0, 50),
    attachments: (task.attachments || []).slice(0, 20),
    comments: (task.comments || []).slice(0, 100),
    focusMinutesSpent: Math.max(0, Number(task.focusMinutesSpent || 0)),
    updatedAt: serverTimestamp(),
  };

  if (isCreate) {
    payload.id = sanitizeId(task.id);
    payload.ownerUid = uid;
    payload.createdAtIso = (task.createdAt || new Date().toISOString()).slice(0, 64);
    payload.createdAt = serverTimestamp();
  }

  if (task.dueTime !== undefined) {
    payload.dueTime = task.dueTime.slice(0, 10);
  } else if (!isCreate) {
    payload.dueTime = deleteField();
  }

  if (task.recurringFrequency !== undefined) {
    payload.recurringFrequency = task.recurringFrequency;
  } else if (!isCreate) {
    payload.recurringFrequency = deleteField();
  }

  if (task.nextOccurrenceDate !== undefined) {
    payload.nextOccurrenceDate = task.nextOccurrenceDate.slice(0, 10);
  } else if (!isCreate) {
    payload.nextOccurrenceDate = deleteField();
  }

  if (task.assignedTo !== undefined) {
    payload.assignedTo = task.assignedTo.slice(0, 120);
  } else if (!isCreate) {
    payload.assignedTo = deleteField();
  }

  if (task.assignedBy !== undefined) {
    payload.assignedBy = task.assignedBy.slice(0, 120);
  } else if (!isCreate) {
    payload.assignedBy = deleteField();
  }

  if (task.assignmentStatus !== undefined) {
    payload.assignmentStatus = task.assignmentStatus;
  } else if (!isCreate) {
    payload.assignmentStatus = deleteField();
  }

  if (task.assignmentResponseNote !== undefined) {
    payload.assignmentResponseNote = task.assignmentResponseNote.slice(0, 500);
  } else if (!isCreate) {
    payload.assignmentResponseNote = deleteField();
  }

  if (task.completedAt !== undefined) {
    payload.completedAt = task.completedAt.slice(0, 64);
  } else if (!isCreate) {
    payload.completedAt = deleteField();
  }

  return payload;
}

export interface FirestoreSyncCallbacks {
  onProfileLoaded: (profile: UserProfile, dailyFocusGoalMinutes: number) => void;
  onTasksSnapshot: (tasks: TaskItem[]) => void;
  onDailyGoalsSnapshot: (goalsByDate: Record<string, DailyGoal>) => void;
  onDailyFocusSnapshot: (focusByDate: Record<string, DailyFocusStats>) => void;
  onAlertsSnapshot: (alerts: ReminderAlert[]) => void;
}

export class FirestoreSyncManager {
  private uid: string | null = null;
  private unsubscribers: Unsubscribe[] = [];
  private existingTaskIds = new Set<string>();
  private existingGoalIds = new Set<string>();
  private existingFocusDates = new Set<string>();

  public isActive(): boolean {
    return this.uid !== null;
  }

  public getUid(): string | null {
    return this.uid;
  }

  public stop() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.uid = null;
    this.existingTaskIds.clear();
    this.existingGoalIds.clear();
    this.existingFocusDates.clear();
  }

  public async startForUser(
    firebaseUser: User,
    seedDefaults: {
      tasks: TaskItem[];
      dailyGoal: DailyGoal | null;
      dailyFocusMap: Record<string, DailyFocusStats>;
      alerts: ReminderAlert[];
      dailyFocusGoalMinutes: number;
    },
    callbacks: FirestoreSyncCallbacks
  ) {
    this.stop();
    const uid = firebaseUser.uid;
    this.uid = uid;

    // 1. Ensure user public profile & private PII doc exist
    const userPath = `users/${uid}`;
    const userRef = doc(db, 'users', uid);
    let profileWorkspaceMode: 'user' | 'manager' = 'user';
    let profileTitle = 'Project Analyst';
    let profileDisplayName = (firebaseUser.displayName || 'Task Genie User').slice(0, 100);
    let profileAvatar = (firebaseUser.photoURL || '').slice(0, 4096);
    let dailyFocusGoalMinutes = seedDefaults.dailyFocusGoalMinutes || 120;

    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        profileWorkspaceMode = data.workspaceMode === 'manager' ? 'manager' : 'user';
        profileTitle = typeof data.title === 'string' ? data.title : profileTitle;
        profileDisplayName =
          typeof data.displayName === 'string' ? data.displayName : profileDisplayName;
        profileAvatar = typeof data.avatar === 'string' ? data.avatar : profileAvatar;
        dailyFocusGoalMinutes =
          typeof data.dailyFocusGoalMinutes === 'number'
            ? data.dailyFocusGoalMinutes
            : dailyFocusGoalMinutes;
      } else {
        await setDoc(userRef, {
          uid,
          displayName: profileDisplayName,
          workspaceMode: profileWorkspaceMode,
          title: profileTitle,
          ...(profileAvatar ? { avatar: profileAvatar } : {}),
          dailyFocusGoalMinutes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    }

    // Isolated PII doc (email)
    const privatePath = `users/${uid}/private/info`;
    const privateRef = doc(db, 'users', uid, 'private', 'info');
    try {
      const privSnap = await getDoc(privateRef);
      const email = (firebaseUser.email || 'user@taskgenie.app').slice(0, 254);
      if (!privSnap.exists()) {
        await setDoc(privateRef, {
          uid,
          email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else if (privSnap.data().email !== email) {
        await updateDoc(privateRef, {
          email,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }

    callbacks.onProfileLoaded(
      {
        id: uid,
        name: profileDisplayName,
        email: firebaseUser.email || 'user@taskgenie.app',
        role: profileWorkspaceMode,
        avatar: profileAvatar,
        title: profileTitle,
      },
      dailyFocusGoalMinutes
    );

    // 2. Seed starter records on first sign-in if tasks collection is empty
    const tasksPath = `users/${uid}/tasks`;
    try {
      const existingTasksSnap = await getDocs(
        query(collection(db, 'users', uid, 'tasks'), where('ownerUid', '==', uid))
      );
      if (existingTasksSnap.empty) {
        for (const task of seedDefaults.tasks) {
          const id = sanitizeId(task.id);
          await setDoc(doc(db, 'users', uid, 'tasks', id), buildTaskPayload(task, uid, true));
          this.existingTaskIds.add(id);
        }

        if (seedDefaults.dailyGoal) {
          const gid = sanitizeId(seedDefaults.dailyGoal.id);
          await setDoc(doc(db, 'users', uid, 'dailyGoals', gid), {
            id: gid,
            ownerUid: uid,
            objective: seedDefaults.dailyGoal.objective.slice(0, 300),
            date: seedDefaults.dailyGoal.date,
            completed: Boolean(seedDefaults.dailyGoal.completed),
            ...(seedDefaults.dailyGoal.linkedTaskId
              ? { linkedTaskId: sanitizeId(seedDefaults.dailyGoal.linkedTaskId) }
              : {}),
            createdAtIso: seedDefaults.dailyGoal.createdAt.slice(0, 64),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          this.existingGoalIds.add(gid);
        }

        for (const [dateKey, stats] of Object.entries(seedDefaults.dailyFocusMap)) {
          await setDoc(doc(db, 'users', uid, 'dailyFocus', dateKey), {
            ownerUid: uid,
            date: dateKey,
            totalMinutes: stats.totalMinutes,
            sessionsCount: stats.sessionsCount,
            deepFocusSessions: stats.deepFocusSessions,
            pomodoroSessions: stats.pomodoroSessions,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          this.existingFocusDates.add(dateKey);
        }

        for (const alert of seedDefaults.alerts) {
          const aid = sanitizeId(alert.id);
          await setDoc(doc(db, 'users', uid, 'alerts', aid), {
            id: aid,
            ownerUid: uid,
            taskId: sanitizeId(alert.taskId),
            taskTitle: alert.taskTitle.slice(0, 200),
            dueTime: alert.dueTime.slice(0, 80),
            message: alert.message.slice(0, 500),
            read: Boolean(alert.read),
            timestamp: alert.timestamp.slice(0, 64),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, tasksPath);
    }

    // If user signed out while seeding, abort listeners
    if (this.uid !== uid) return;

    // 3. Attach real-time onSnapshot listeners scoped to ownerUid == uid
    const tasksUnsub = onSnapshot(
      query(collection(db, 'users', uid, 'tasks'), where('ownerUid', '==', uid)),
      (snapshot) => {
        const items: TaskItem[] = [];
        this.existingTaskIds.clear();
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          this.existingTaskIds.add(docSnap.id);
          items.push({
            id: docSnap.id,
            title: d.title,
            description: d.description || '',
            category: d.category,
            priority: d.priority,
            status: d.status,
            dueDate: d.dueDate,
            dueTime: d.dueTime,
            isRecurring: Boolean(d.isRecurring),
            recurringFrequency: d.recurringFrequency,
            nextOccurrenceDate: d.nextOccurrenceDate,
            subtasks: Array.isArray(d.subtasks) ? d.subtasks : [],
            attachments: Array.isArray(d.attachments) ? d.attachments : [],
            assignedTo: d.assignedTo,
            assignedBy: d.assignedBy,
            assignmentStatus: d.assignmentStatus,
            assignmentResponseNote: d.assignmentResponseNote,
            comments: Array.isArray(d.comments) ? d.comments : [],
            focusMinutesSpent: Number(d.focusMinutesSpent || 0),
            completedAt: d.completedAt,
            createdAt: d.createdAtIso || new Date().toISOString(),
          });
        });
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        callbacks.onTasksSnapshot(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, tasksPath);
      }
    );
    this.unsubscribers.push(tasksUnsub);

    const goalsPath = `users/${uid}/dailyGoals`;
    const goalsUnsub = onSnapshot(
      query(collection(db, 'users', uid, 'dailyGoals'), where('ownerUid', '==', uid)),
      (snapshot) => {
        const goalsMap: Record<string, DailyGoal> = {};
        this.existingGoalIds.clear();
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          this.existingGoalIds.add(docSnap.id);
          goalsMap[d.date] = {
            id: docSnap.id,
            objective: d.objective,
            date: d.date,
            completed: Boolean(d.completed),
            linkedTaskId: d.linkedTaskId,
            completedAt: d.completedAt,
            createdAt: d.createdAtIso || new Date().toISOString(),
          };
        });
        callbacks.onDailyGoalsSnapshot(goalsMap);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, goalsPath);
      }
    );
    this.unsubscribers.push(goalsUnsub);

    const focusPath = `users/${uid}/dailyFocus`;
    const focusUnsub = onSnapshot(
      query(collection(db, 'users', uid, 'dailyFocus'), where('ownerUid', '==', uid)),
      (snapshot) => {
        const focusMap: Record<string, DailyFocusStats> = {};
        this.existingFocusDates.clear();
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          this.existingFocusDates.add(docSnap.id);
          focusMap[d.date] = {
            date: d.date,
            totalMinutes: Number(d.totalMinutes || 0),
            sessionsCount: Number(d.sessionsCount || 0),
            deepFocusSessions: Number(d.deepFocusSessions || 0),
            pomodoroSessions: Number(d.pomodoroSessions || 0),
          };
        });
        callbacks.onDailyFocusSnapshot(focusMap);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, focusPath);
      }
    );
    this.unsubscribers.push(focusUnsub);

    const alertsPath = `users/${uid}/alerts`;
    const alertsUnsub = onSnapshot(
      query(collection(db, 'users', uid, 'alerts'), where('ownerUid', '==', uid)),
      (snapshot) => {
        const list: ReminderAlert[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            taskId: d.taskId,
            taskTitle: d.taskTitle,
            dueTime: d.dueTime,
            message: d.message,
            read: Boolean(d.read),
            timestamp: d.timestamp,
          });
        });
        callbacks.onAlertsSnapshot(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, alertsPath);
      }
    );
    this.unsubscribers.push(alertsUnsub);
  }

  public async upsertTask(task: TaskItem) {
    if (!this.uid) return;
    const uid = this.uid;
    const id = sanitizeId(task.id);
    const path = `users/${uid}/tasks/${id}`;
    const ref = doc(db, 'users', uid, 'tasks', id);
    try {
      const exists = this.existingTaskIds.has(id);
      if (exists) {
        await updateDoc(ref, buildTaskPayload(task, uid, false));
      } else {
        await setDoc(ref, buildTaskPayload(task, uid, true));
        this.existingTaskIds.add(id);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async removeTask(taskId: string) {
    if (!this.uid) return;
    const uid = this.uid;
    const id = sanitizeId(taskId);
    const path = `users/${uid}/tasks/${id}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'tasks', id));
      this.existingTaskIds.delete(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public async upsertDailyGoal(goal: DailyGoal | null, dateStr: string) {
    if (!this.uid) return;
    const uid = this.uid;
    const goalId = sanitizeId(goal?.id || `goal_${dateStr}`);
    const path = `users/${uid}/dailyGoals/${goalId}`;
    const ref = doc(db, 'users', uid, 'dailyGoals', goalId);

    try {
      if (!goal) {
        await deleteDoc(ref);
        this.existingGoalIds.delete(goalId);
        return;
      }

      if (this.existingGoalIds.has(goalId)) {
        await updateDoc(ref, {
          objective: goal.objective.slice(0, 300),
          completed: Boolean(goal.completed),
          linkedTaskId: goal.linkedTaskId ? sanitizeId(goal.linkedTaskId) : deleteField(),
          completedAt: goal.completedAt ? goal.completedAt.slice(0, 64) : deleteField(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          id: goalId,
          ownerUid: uid,
          objective: goal.objective.slice(0, 300),
          date: goal.date,
          completed: Boolean(goal.completed),
          ...(goal.linkedTaskId ? { linkedTaskId: sanitizeId(goal.linkedTaskId) } : {}),
          ...(goal.completedAt ? { completedAt: goal.completedAt.slice(0, 64) } : {}),
          createdAtIso: (goal.createdAt || new Date().toISOString()).slice(0, 64),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        this.existingGoalIds.add(goalId);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async upsertDailyFocus(stats: DailyFocusStats) {
    if (!this.uid) return;
    const uid = this.uid;
    const dateId = sanitizeId(stats.date);
    const path = `users/${uid}/dailyFocus/${dateId}`;
    const ref = doc(db, 'users', uid, 'dailyFocus', dateId);

    try {
      if (this.existingFocusDates.has(dateId)) {
        await updateDoc(ref, {
          totalMinutes: stats.totalMinutes,
          sessionsCount: stats.sessionsCount,
          deepFocusSessions: stats.deepFocusSessions,
          pomodoroSessions: stats.pomodoroSessions,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ownerUid: uid,
          date: stats.date,
          totalMinutes: stats.totalMinutes,
          sessionsCount: stats.sessionsCount,
          deepFocusSessions: stats.deepFocusSessions,
          pomodoroSessions: stats.pomodoroSessions,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        this.existingFocusDates.add(dateId);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async updateUserPreferences(updates: {
    workspaceMode?: 'user' | 'manager';
    title?: string;
    dailyFocusGoalMinutes?: number;
  }) {
    if (!this.uid) return;
    const uid = this.uid;
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async createAlert(alert: ReminderAlert) {
    if (!this.uid) return;
    const uid = this.uid;
    const aid = sanitizeId(alert.id);
    const path = `users/${uid}/alerts/${aid}`;
    try {
      await setDoc(doc(db, 'users', uid, 'alerts', aid), {
        id: aid,
        ownerUid: uid,
        taskId: sanitizeId(alert.taskId),
        taskTitle: alert.taskTitle.slice(0, 200),
        dueTime: alert.dueTime.slice(0, 80),
        message: alert.message.slice(0, 500),
        read: Boolean(alert.read),
        timestamp: alert.timestamp.slice(0, 64),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  public async markAlertRead(alertId: string) {
    if (!this.uid) return;
    const uid = this.uid;
    const aid = sanitizeId(alertId);
    const path = `users/${uid}/alerts/${aid}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'alerts', aid), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async clearAllAlerts(alertIds: string[]) {
    if (!this.uid) return;
    const uid = this.uid;
    for (const rawId of alertIds) {
      const aid = sanitizeId(rawId);
      const path = `users/${uid}/alerts/${aid}`;
      try {
        await deleteDoc(doc(db, 'users', uid, 'alerts', aid));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  }
}

export const firestoreSync = new FirestoreSyncManager();
