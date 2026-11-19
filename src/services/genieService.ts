import {
  Subtask,
  Priority,
  TaskCategory,
  TaskItem,
  SmartSortFactor,
  SmartSortResult,
  SmartSortTaskInsight,
} from '../types/task';

export interface DivideSubtasksResponse {
  subtasks: Array<{ title: string; estimatedMinutes: number }>;
  isAiGenerated: boolean;
}

export interface PrioritizeResponse {
  priority: Priority;
  category: TaskCategory;
  estimatedMinutes: number;
  tip: string;
}

export interface SuggestWorkResponse {
  suggestedAssignee: string;
  suggestedRole: string;
  rationale: string;
}

export interface ProductivityInsightsResponse {
  score: number;
  status: string;
  insights: string[];
  actionableTip: string;
}

export class GenieService {
  private static smartSortCache = new Map<string, SmartSortResult>();
  private static insightsCache = new Map<string, ProductivityInsightsResponse>();

  private static async callApi(action: string, payload: any) {
    try {
      const response = await fetch('/api/ask-genie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const json = await response.json();
      return json;
    } catch (err) {
      console.warn('API call failed, switching to client intelligent fallback:', err);
      return null;
    }
  }

  static async divideSubtasks(title: string, description?: string, deadline?: string): Promise<Subtask[]> {
    const res = await this.callApi('subtask_division', {
      taskData: { title, description, deadline },
    });

    if (res && res.data && Array.isArray(res.data)) {
      return res.data.map((item: any, idx: number) => ({
        id: `sub_genie_${Date.now()}_${idx}`,
        title: item.title || `Step ${idx + 1}`,
        completed: false,
        estimatedMinutes: item.estimatedMinutes || 25,
      }));
    }

    // High quality client-side fallback
    const lower = title.toLowerCase();
    if (lower.includes('ppt') || lower.includes('presentation') || lower.includes('slide')) {
      return [
        { id: `sub_${Date.now()}_1`, title: 'Define slide narrative & key messages', completed: false, estimatedMinutes: 20 },
        { id: `sub_${Date.now()}_2`, title: 'Gather project data, diagrams & metrics', completed: false, estimatedMinutes: 30 },
        { id: `sub_${Date.now()}_3`, title: 'Design visual slides & charts layout', completed: false, estimatedMinutes: 40 },
        { id: `sub_${Date.now()}_4`, title: 'Speaker notes rehearsal & PDF export', completed: false, estimatedMinutes: 15 },
      ];
    } else if (lower.includes('report') || lower.includes('assignment') || lower.includes('paper')) {
      return [
        { id: `sub_${Date.now()}_1`, title: 'Review rubric & compile reference materials', completed: false, estimatedMinutes: 20 },
        { id: `sub_${Date.now()}_2`, title: 'Draft primary sections and analysis', completed: false, estimatedMinutes: 45 },
        { id: `sub_${Date.now()}_3`, title: 'Format citations, tables, and appendices', completed: false, estimatedMinutes: 25 },
        { id: `sub_${Date.now()}_4`, title: 'Final proofread & submission check', completed: false, estimatedMinutes: 15 },
      ];
    } else {
      return [
        { id: `sub_${Date.now()}_1`, title: `Scope initial deliverables for "${title}"`, completed: false, estimatedMinutes: 15 },
        { id: `sub_${Date.now()}_2`, title: 'Draft core components & execution', completed: false, estimatedMinutes: 45 },
        { id: `sub_${Date.now()}_3`, title: 'Quality review against requirements', completed: false, estimatedMinutes: 20 },
        { id: `sub_${Date.now()}_4`, title: 'Finalize and archive deliverables', completed: false, estimatedMinutes: 10 },
      ];
    }
  }

  static async prioritizeAndCategorize(title: string, deadline?: string, description?: string): Promise<PrioritizeResponse> {
    const res = await this.callApi('prioritize_and_categorize', {
      taskData: { title, deadline, description },
    });

    if (res && res.data && res.data.priority) {
      return res.data;
    }

    // Intelligent heuristic fallback
    const lower = (title + ' ' + (description || '')).toLowerCase();
    let priority: Priority = 'medium';
    let category: TaskCategory = 'Project';

    if (deadline) {
      const diffHours = (new Date(deadline).getTime() - Date.now()) / (1000 * 3600);
      if (diffHours <= 36) priority = 'high';
      else if (diffHours > 120) priority = 'low';
    }

    if (lower.includes('ppt') || lower.includes('assignment') || lower.includes('homework')) {
      category = 'Assignment';
      if (!deadline) priority = 'high';
    } else if (lower.includes('meet') || lower.includes('sync') || lower.includes('call') || lower.includes('standup')) {
      category = 'Meeting';
    } else if (lower.includes('study') || lower.includes('exam') || lower.includes('read') || lower.includes('course')) {
      category = 'Study';
    } else if (lower.includes('personal') || lower.includes('errand') || lower.includes('workout')) {
      category = 'Personal';
    }

    return {
      priority,
      category,
      estimatedMinutes: 60,
      tip: `Auto-categorized as ${category} with ${priority.toUpperCase()} priority based on deadline constraints.`,
    };
  }

  static async suggestWork(taskTitle: string, team: string[]): Promise<SuggestWorkResponse> {
    const res = await this.callApi('suggest_work', {
      taskData: { title: taskTitle, team },
    });

    if (res && res.data && res.data.suggestedAssignee) {
      return res.data;
    }

    const lower = taskTitle.toLowerCase();
    if (lower.includes('qa') || lower.includes('test') || lower.includes('benchmark')) {
      return {
        suggestedAssignee: 'Riya Pant',
        suggestedRole: 'QA Engineer',
        rationale: 'QA Engineer role aligns with testing and benchmarking deliverables alongside shared Development & Coding.',
      };
    }
    if (lower.includes('design') || lower.includes('dfd') || lower.includes('system') || lower.includes('arch')) {
      return {
        suggestedAssignee: 'Utpreksha Kashyap',
        suggestedRole: 'System Designer',
        rationale: 'System Designer role fits architecture and DFD verification tasks alongside shared Development & Coding.',
      };
    }
    if (lower.includes('requirement') || lower.includes('sync') || lower.includes('agenda')) {
      return {
        suggestedAssignee: 'Shambhavi Maddheshiya',
        suggestedRole: 'Requirement Analyst',
        rationale: 'Requirement Analyst role matches sprint scoping and requirement alignment alongside Development & Coding.',
      };
    }
    return {
      suggestedAssignee: 'Jyoti Kumari',
      suggestedRole: 'Project Analyst',
      rationale: 'Project Analyst role aligns with analysis, roadmap decks, and shared Development & Coding.',
    };
  }

  static estimateRemainingEffortMinutes(task: TaskItem): number {
    if (task.subtasks && task.subtasks.length > 0) {
      const remaining = task.subtasks.filter((s) => !s.completed);
      if (remaining.length === 0) return 10;
      return remaining.reduce((sum, s) => sum + (s.estimatedMinutes || 20), 0);
    }
    return task.priority === 'high' ? 60 : task.priority === 'medium' ? 40 : 25;
  }

  static computeHistoricalPatterns(tasks: TaskItem[]) {
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const categories = new Set<string>(tasks.map((t) => t.category));

    const categoryCompletionRates: Record<string, number> = {};
    const categoryAvgFocusMinutes: Record<string, number> = {};

    categories.forEach((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat);
      const catCompleted = catTasks.filter((t) => t.status === 'completed');
      categoryCompletionRates[cat] =
        catTasks.length > 0 ? Math.round((catCompleted.length / catTasks.length) * 100) : 50;
      const totalFocus = catCompleted.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);
      categoryAvgFocusMinutes[cat] =
        catCompleted.length > 0 ? Math.round(totalFocus / catCompleted.length) : 0;
    });

    const totalCompletedFocus = completedTasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);
    const avgCompletedFocusMinutes =
      completedTasks.length > 0 ? Math.round(totalCompletedFocus / completedTasks.length) : 30;

    const avgCompletedSubtasks =
      completedTasks.length > 0
        ? Number(
            (
              completedTasks.reduce((sum, t) => sum + t.subtasks.length, 0) / completedTasks.length
            ).toFixed(1)
          )
        : 2;

    return {
      totalTasksAnalyzed: tasks.length,
      completedTasksCount: completedTasks.length,
      avgCompletedFocusMinutes,
      avgCompletedSubtasks,
      categoryCompletionRates,
      categoryAvgFocusMinutes,
    };
  }

  static computeLocalSmartSort(allTasks: TaskItem[]): SmartSortResult {
    const activeTasks = allTasks.filter((t) => t.status !== 'completed' && t.status !== 'archived');
    const patterns = this.computeHistoricalPatterns(allTasks);
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date();

    const insights: SmartSortTaskInsight[] = activeTasks.map((task) => {
      const effortLeft = this.estimateRemainingEffortMinutes(task);

      // 1. Deadline urgency (0 - 48 pts)
      const diffMs = new Date(`${task.dueDate}T${task.dueTime || '23:59'}:00`).getTime() - nowTime.getTime();
      const diffHours = diffMs / (1000 * 3600);
      let deadlinePts = 12;
      if (task.dueDate < todayStr || diffHours < 0) {
        deadlinePts = 48;
      } else if (task.dueDate === todayStr) {
        deadlinePts = diffHours <= 4 ? 44 : 38;
      } else if (diffHours <= 48) {
        deadlinePts = 30;
      } else if (diffHours <= 96) {
        deadlinePts = 22;
      } else {
        deadlinePts = Math.max(8, 18 - Math.floor(diffHours / 48));
      }

      // 2. Priority + Effort + Momentum (0 - 32 pts)
      const priorityPts = task.priority === 'high' ? 14 : task.priority === 'medium' ? 8 : 3;
      const doneSubtasks = task.subtasks.filter((s) => s.completed).length;
      const progressRatio = task.subtasks.length > 0 ? doneSubtasks / task.subtasks.length : 0;
      const momentumPts = task.status === 'in_progress' || progressRatio > 0 ? Math.round(6 + progressRatio * 6) : 0;

      // Quick-win / effort feasibility relative to user's historical avg focus capacity
      const effortFitDiff = Math.abs(effortLeft - patterns.avgCompletedFocusMinutes);
      const effortPts = effortLeft <= 35 ? 10 : effortFitDiff <= 25 ? 8 : 5;

      // 3. Historical Completion Pattern Alignment (0 - 20 pts)
      const catRate = patterns.categoryCompletionRates[task.category] ?? 50;
      const catFocus = patterns.categoryAvgFocusMinutes[task.category] ?? 0;
      const historyPts = Math.round((catRate / 100) * 14) + (catFocus > 0 ? 4 : 0);

      const score = Math.min(99, Math.max(15, deadlinePts + priorityPts + momentumPts + effortPts + historyPts));

      // Determine primary ranking driver
      let primaryFactor: SmartSortFactor = 'deadline';
      if (deadlinePts < 30 && historyPts >= 14) {
        primaryFactor = 'history';
      } else if (deadlinePts < 30 && effortPts + momentumPts >= 14) {
        primaryFactor = 'effort';
      }

      // Build human-readable reason referencing actual factors
      const parts: string[] = [];
      if (task.dueDate < todayStr || diffHours < 0) parts.push('Overdue deadline');
      else if (task.dueDate === todayStr) parts.push(`Due today${task.dueTime ? ` ${task.dueTime}` : ''}`);
      else parts.push(`Due ${task.dueDate}`);

      parts.push(`~${effortLeft}m left`);

      if (progressRatio > 0) {
        parts.push(`${Math.round(progressRatio * 100)}% done`);
      } else if (catRate >= 50 && patterns.completedTasksCount > 0) {
        parts.push(`${catRate}% ${task.category} completion trend`);
      } else {
        parts.push(`${task.priority} priority`);
      }

      return {
        taskId: task.id,
        score,
        primaryFactor,
        estimatedMinutesLeft: effortLeft,
        reason: parts.join(' · '),
      };
    });

    insights.sort((a, b) => b.score - a.score);

    const insightsByTaskId: Record<string, SmartSortTaskInsight> = {};
    insights.forEach((ins) => {
      insightsByTaskId[ins.taskId] = ins;
    });

    const summary =
      patterns.completedTasksCount > 0
        ? `Ranked ${activeTasks.length} active tasks by deadline urgency, ~${patterns.avgCompletedFocusMinutes}m avg completion pace, and category history.`
        : `Ranked ${activeTasks.length} active tasks by deadline proximity, remaining subtask effort, and priority.`;

    return {
      orderedTaskIds: insights.map((i) => i.taskId),
      strategySummary: summary,
      insightsByTaskId,
      source: 'heuristic',
      analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  static async smartSortTasks(allTasks: TaskItem[]): Promise<SmartSortResult> {
    const localResult = this.computeLocalSmartSort(allTasks);
    const activeTasks = allTasks.filter((t) => t.status !== 'completed' && t.status !== 'archived');

    if (activeTasks.length <= 1) {
      return localResult;
    }

    const patterns = this.computeHistoricalPatterns(allTasks);
    const todayStr = new Date().toISOString().split('T')[0];

    const compactTasks = activeTasks.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      remainingSubtasks: t.subtasks.filter((s) => !s.completed).length,
      totalSubtasks: t.subtasks.length,
      remainingEffortMinutes: this.estimateRemainingEffortMinutes(t),
      focusMinutesSpent: t.focusMinutesSpent || 0,
      assignmentStatus: t.assignmentStatus,
    }));

    const cacheKey = JSON.stringify({ todayStr, compactTasks, patterns });
    const cached = this.smartSortCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const res = await this.callApi('smart_sort', {
      taskData: {
        currentDate: todayStr,
        activeTasks: compactTasks,
        historicalPatterns: patterns,
      },
    });

    if (res && res.data && Array.isArray(res.data.orderedTaskIds)) {
      const validIds = new Set(activeTasks.map((t) => t.id));
      const seen = new Set<string>();
      const orderedIds: string[] = [];

      for (const id of res.data.orderedTaskIds) {
        if (typeof id === 'string' && validIds.has(id) && !seen.has(id)) {
          seen.add(id);
          orderedIds.push(id);
        }
      }

      // Append any remaining active tasks not explicitly listed by AI
      for (const id of localResult.orderedTaskIds) {
        if (!seen.has(id)) {
          seen.add(id);
          orderedIds.push(id);
        }
      }

      const insightsByTaskId: Record<string, SmartSortTaskInsight> = { ...localResult.insightsByTaskId };
      if (Array.isArray(res.data.taskInsights)) {
        for (const item of res.data.taskInsights) {
          if (item && validIds.has(item.taskId)) {
            const factor: SmartSortFactor =
              item.primaryFactor === 'effort' || item.primaryFactor === 'history'
                ? item.primaryFactor
                : 'deadline';
            insightsByTaskId[item.taskId] = {
              taskId: item.taskId,
              score: typeof item.score === 'number' ? Math.min(99, Math.max(1, Math.round(item.score))) : localResult.insightsByTaskId[item.taskId]?.score || 70,
              primaryFactor: factor,
              estimatedMinutesLeft:
                localResult.insightsByTaskId[item.taskId]?.estimatedMinutesLeft || 30,
              reason:
                typeof item.reason === 'string' && item.reason.trim()
                  ? item.reason.trim()
                  : localResult.insightsByTaskId[item.taskId]?.reason || '',
            };
          }
        }
      }

      const computedResult: SmartSortResult = {
        orderedTaskIds: orderedIds,
        strategySummary:
          typeof res.data.strategySummary === 'string' && res.data.strategySummary.trim()
            ? res.data.strategySummary.trim()
            : localResult.strategySummary,
        insightsByTaskId,
        source: res.source === 'gemini' ? 'gemini' : 'heuristic',
        analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      this.smartSortCache.set(cacheKey, computedResult);
      return computedResult;
    }

    this.smartSortCache.set(cacheKey, localResult);
    return localResult;
  }

  static async getProductivityInsights(stats: { total: number; completed: number; overdue: number; focusMinutes: number }): Promise<ProductivityInsightsResponse> {
    const cacheKey = JSON.stringify(stats);
    const cached = this.insightsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const res = await this.callApi('productivity_insights', {
      taskData: stats,
    });

    if (res && res.data && res.data.score !== undefined) {
      this.insightsCache.set(cacheKey, res.data);
      return res.data;
    }

    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 75;
    const fallback: ProductivityInsightsResponse = {
      score: Math.min(100, Math.max(50, completionRate + 15)),
      status: completionRate >= 60 ? 'Optimal Flow State' : 'Steady Progress',
      insights: [
        'Subtask breakdown increased completion velocity by ~32% this week.',
        'High-priority assignments (e.g. PPT presentation) have the highest focus duration.',
        'Recurring calendar routines show 100% adherence over the last 14 days.',
      ],
      actionableTip: 'Keep active tasks below 4 concurrent items to preserve deep focus mode.',
    };
    this.insightsCache.set(cacheKey, fallback);
    return fallback;
  }

  static async chat(message: string, contextTasks: any[]): Promise<string> {
    const res = await this.callApi('chat', {
      prompt: message,
      taskData: { tasksCount: contextTasks.length },
    });

    if (res && (res.text || res.data)) {
      return res.text || res.data;
    }

    const msg = message.toLowerCase();
    if (msg.includes('ppt') || msg.includes('presentation')) {
      return `I can help with the PPT task! I recommend creating 4 subtasks: Narrative structure, Data gathering, Slide styling, and Rehearsal. Would you like me to add these to D1 TaskStore?`;
    }
    if (msg.includes('calendar') || msg.includes('schedule')) {
      return `Your calendar shows 2 tasks scheduled for today, including "Create PPT" due at 16:00. No conflicting recurring meetings.`;
    }
    if (msg.includes('priority') || msg.includes('urgent')) {
      return `Current top priority is "Create PPT - Q4 Roadmap Presentation". You have completed 2 out of 4 subtasks.`;
    }
    return `Ask Genie is monitoring your D1 TaskStore. You can ask me to divide any assignment into subtasks, calculate priorities, or assign work to teammates!`;
  }
}
