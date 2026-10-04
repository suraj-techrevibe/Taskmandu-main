import { apiDelete, apiGet, apiPatch, apiPost } from './http';
import type { SystemNotification } from '../types';

export interface NotificationDoc extends Omit<SystemNotification, 'id'> {
  _id: string;
  recipientId?: string | null;
}

function mapNotification(doc: NotificationDoc): SystemNotification {
  return {
    id: doc._id,
    title: doc.title,
    message: doc.message,
    type: doc.type,
    createdAt: doc.createdAt,
    read: doc.read,
  };
}

export async function listNotifications(limit = 50): Promise<SystemNotification[]> {
  const res = await apiGet<NotificationDoc[]>(`/notifications?limit=${limit}`);
  return res.map(mapNotification);
}

export async function markAllRead(): Promise<void> {
  await apiPatch<{ modified: number }>('/notifications/read-all', {});
}

export async function clearAll(): Promise<void> {
  await apiDelete<{ deleted: number }>('/notifications/clear-all');
}

export async function createNotification(input: {
  title: string;
  message: string;
  type: SystemNotification['type'];
}): Promise<SystemNotification> {
  const res = await apiPost<NotificationDoc>('/notifications', input);
  return mapNotification(res);
}
