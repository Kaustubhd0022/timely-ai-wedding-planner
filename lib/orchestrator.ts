export interface Task {
  id: string;
  name: string;
  deadline_date: string;
  status: 'Todo' | 'In-Progress' | 'Done';
  priority: number;
  category: string;
}

export interface Dependency {
  task_id: string;
  depends_on_id: string;
}

/**
 * Returns true if the task is blocked by one or more incomplete dependencies.
 */
export function isTaskBlocked(taskId: string, allTasks: Task[], dependencies: Dependency[]): boolean {
  const taskDeps = dependencies.filter(d => d.task_id === taskId);
  if (taskDeps.length === 0) return false;

  return taskDeps.some(d => {
    const parentTask = allTasks.find(t => t.id === d.depends_on_id);
    return parentTask && parentTask.status !== 'Done';
  });
}

/**
 * Returns the list of task IDs that are blocking a specific task.
 */
export function getBlockers(taskId: string, allTasks: Task[], dependencies: Dependency[]): Task[] {
  const taskDeps = dependencies.filter(d => d.task_id === taskId);
  return taskDeps
    .map(d => allTasks.find(t => t.id === d.depends_on_id))
    .filter((t): t is Task => !!t && t.status !== 'Done');
}

/**
 * Identifies the "Next Best Action" for the user.
 * Logic: Earliest deadline, not blocked, not done.
 */
export function getNextBestAction(allTasks: Task[], dependencies: Dependency[]): { task: Task; reason: string } | null {
  const availableTasks = allTasks
    .filter(t => t.status !== 'Done' && !isTaskBlocked(t.id, allTasks, dependencies))
    .sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime());

  if (availableTasks.length === 0) return null;

  const nextTask = availableTasks[0];
  
  // Rule-based reasoning (AI-like)
  const daysToDeadline = Math.ceil((new Date(nextTask.deadline_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  let reason = `This task is next on your timeline based on its ${new Date(nextTask.deadline_date).toLocaleDateString()} deadline.`;
  
  if (nextTask.category === 'Venue') {
    reason = "Venues are the foundation of your wedding. Securing this early locks in your date and allows other planning to proceed.";
  } else if (nextTask.category === 'Catering') {
    reason = "Great food requires early booking, especially for popular dates. This ensures your preferred menu is available.";
  } else if (daysToDeadline < 7) {
    reason = "This task is due in less than a week. Completing it now prevents a bottleneck later.";
  } else if (nextTask.priority === 1) {
    reason = "This is marked as a high priority task for your wedding success. Focus here first.";
  }

  return { task: nextTask, reason };
}

/**
 * Returns a list of smart alerts based on current state.
 */
export function getSmartAlerts(allTasks: Task[], dependencies: Dependency[]): { type: 'overdue' | 'upcoming' | 'blocked', message: string }[] {
  const alerts: { type: 'overdue' | 'upcoming' | 'blocked', message: string }[] = [];
  const now = new Date();

  allTasks.forEach(task => {
    if (task.status === 'Done') return;

    const deadline = new Date(task.deadline_date);
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      alerts.push({ type: 'overdue', message: `You're ${Math.abs(diffDays)} days late on "${task.name}". Let's try to catch up.` });
    } else if (diffDays <= 7) {
      alerts.push({ type: 'upcoming', message: `"${task.name}" is due in ${diffDays} days. High attention needed.` });
    }

    if (isTaskBlocked(task.id, allTasks, dependencies) && task.priority <= 2) {
      const blockers = getBlockers(task.id, allTasks, dependencies);
      alerts.push({ type: 'blocked', message: `High priority "${task.name}" is stuck until you finish: ${blockers.map(b => b.name).join(', ')}.` });
    }
  });

  return alerts.slice(0, 5); // Limit to top 5 most relevant
}
