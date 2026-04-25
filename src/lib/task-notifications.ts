/**
 * Task Notification Helpers
 * Integrates task operations with the WebSocket notification system
 */

import { sendNotificationToUser, sendNotificationToUsers } from '@/ws-handlers/notifications';

export interface TaskNotificationPayload {
  task_id: string;
  task_title: string;
  assignee_id?: string;
  creator_id?: string;
  due_date?: string;
  status?: string;
  priority?: string;
  message: string;
}

/**
 * Send notification when a task is assigned to a user
 */
export function notifyTaskAssigned(payload: TaskNotificationPayload) {
  if (!payload.assignee_id) return;

  sendNotificationToUser(payload.assignee_id, {
    type: 'task_assigned',
    payload: {
      task_id: payload.task_id,
      task_title: payload.task_title,
      priority: payload.priority,
      due_date: payload.due_date,
      message: payload.message || `You have been assigned to task: ${payload.task_title}`,
    },
  });
}

/**
 * Send notification when task status changes
 */
export function notifyTaskStatusChanged(
  userIds: string[],
  payload: TaskNotificationPayload
) {
  sendNotificationToUsers(userIds, {
    type: 'task_updated',
    payload: {
      task_id: payload.task_id,
      task_title: payload.task_title,
      status: payload.status,
      message: payload.message || `Task "${payload.task_title}" status changed to ${payload.status}`,
    },
  });
}

/**
 * Send notification when task due date is approaching
 */
export function notifyTaskDueSoon(userId: string, payload: TaskNotificationPayload) {
  sendNotificationToUser(userId, {
    type: 'task_due_soon',
    payload: {
      task_id: payload.task_id,
      task_title: payload.task_title,
      due_date: payload.due_date,
      message: payload.message || `Task "${payload.task_title}" is due soon`,
    },
  });
}

/**
 * Send notification when a comment is added to a task
 */
export function notifyTaskComment(
  userIds: string[],
  payload: TaskNotificationPayload
) {
  sendNotificationToUsers(userIds, {
    type: 'task_comment',
    payload: {
      task_id: payload.task_id,
      task_title: payload.task_title,
      message: payload.message || `New comment on task: ${payload.task_title}`,
    },
  });
}

/**
 * Send notification when task priority changes
 */
export function notifyTaskPriorityChanged(
  userIds: string[],
  payload: TaskNotificationPayload
) {
  sendNotificationToUsers(userIds, {
    type: 'task_priority_changed',
    payload: {
      task_id: payload.task_id,
      task_title: payload.task_title,
      priority: payload.priority,
      message: payload.message || `Task "${payload.task_title}" priority changed to ${payload.priority}`,
    },
  });
}

/**
 * Get notification recipients for a task
 */
export function getTaskNotificationRecipients(task: {
  assignee_id?: string;
  creator_id?: string;
}): string[] {
  const recipients: string[] = [];
  
  if (task.assignee_id) {
    recipients.push(task.assignee_id);
  }
  if (task.creator_id && task.creator_id !== task.assignee_id) {
    recipients.push(task.creator_id);
  }
  
  return recipients;
}
