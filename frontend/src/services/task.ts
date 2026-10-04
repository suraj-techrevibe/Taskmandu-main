import { apiGet, apiPost, apiPatch, apiDelete, unwrapItems } from './http';
import type { Task } from '../types';

export interface CreateTaskInput {
  title: string;
  description: string;
  assignedToId: string[];
  assignedByName: string;
  priority: Task['priority'];
  dueDate: string;
  estimatedHours: number;
  tags: string[];
}

function mapComment(doc: Record<string, any>) {
  return {
    id: doc._id ?? doc.id ?? `${doc.authorId}-${doc.createdAt ?? Date.now()}`,
    authorName: doc.authorName ?? '',
    authorRole: doc.authorRole ?? '',
    text: doc.text ?? '',
    createdAt: doc.createdAt,
  };
}

function mapTask(doc: Record<string, any>): Task {
  return {
    id: doc._id ?? doc.id,
    title: doc.title,
    description: doc.description ?? '',
    assignedToId: Array.isArray(doc.assignedToId) ? doc.assignedToId : doc.assignedToId ? [doc.assignedToId] : [],
    priority: doc.priority ?? 'Medium',
    dueDate: doc.dueDate,
    estimatedHours: doc.estimatedHours ?? 0,
    status: doc.status ?? 'Assigned',
    attachments: doc.attachments ?? [],
    tags: doc.tags ?? [],
    comments: (doc.comments ?? []).map(mapComment),
    subTasks: (doc.subTasks ?? []).map((st: Record<string, any>) => ({
      id: st._id ?? st.id,
      title: st.title ?? '',
      assignedToId: Array.isArray(st.assignedToId) ? st.assignedToId : st.assignedToId ? [st.assignedToId] : [],
      assignedByName: st.assignedByName ?? '',
      status: st.status ?? 'Assigned',
      completedAt: st.completedAt ?? null,
      comments: (st.comments ?? []).map((c: Record<string, any>) => ({
        id: c._id ?? c.id ?? `${c.authorId}-${c.createdAt ?? Date.now()}`,
        authorName: c.authorName ?? '',
        authorRole: c.authorRole ?? '',
        text: c.text ?? '',
        createdAt: c.createdAt,
      })),
    })),
  };
}

export async function listTasks(limit = 100): Promise<Task[]> {
  const data = await apiGet<{ items: Record<string, any>[] }>(`/tasks?limit=${limit}`);
  return unwrapItems(data).map(mapTask);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const data = await apiPost<Record<string, any>>('/tasks', input);
  return mapTask(data);
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  const data = await apiPatch<Record<string, any>>(`/tasks/${id}`, patch);
  return mapTask(data);
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
  const data = await apiPatch<Record<string, any>>(`/tasks/${id}/status`, { status });
  return mapTask(data);
}

export async function addComment(id: string, text: string): Promise<Task> {
  const data = await apiPost<Record<string, any>>(`/tasks/${id}/comments`, { text });
  return mapTask(data);
}

export async function deleteTask(id: string): Promise<void> {
  await apiDelete(`/tasks/${id}`);
}
