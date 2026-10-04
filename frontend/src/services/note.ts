import { apiGet, apiList, apiPost, apiPatch, apiDelete, unwrapItems } from './http';
import type { PaginatedResponse } from './http';

export interface NoteDoc {
  id: string;
  title: string;
  content: string;
  category: string;
  color: string;
  isPinned: boolean;
  author: string;
  authorId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  category: string;
  color: string;
  isPinned: boolean;
}

function mapNote(doc: Record<string, any>): NoteDoc {
  return {
    id: doc._id ?? doc.id,
    title: doc.title,
    content: doc.content ?? '',
    category: doc.category ?? 'Personal Reminders',
    color: doc.color ?? '',
    isPinned: doc.isPinned ?? false,
    author: doc.author ?? '',
    authorId: doc.authorId ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listNotes(limit = 100): Promise<NoteDoc[]> {
  const data = await apiGet<{ items: Record<string, any>[] }>(`/notes?limit=${limit}`);
  return unwrapItems(data).map(mapNote);
}

export async function createNote(input: CreateNoteInput): Promise<NoteDoc> {
  const data = await apiPost<Record<string, any>>('/notes', input);
  return mapNote(data);
}

export async function updateNote(id: string, patch: Partial<CreateNoteInput>): Promise<NoteDoc> {
  const data = await apiPatch<Record<string, any>>(`/notes/${id}`, patch);
  return mapNote(data);
}

export async function deleteNote(id: string): Promise<void> {
  await apiDelete(`/notes/${id}`);
}

export interface ListNotePageParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  pinned?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listNotePage(params: ListNotePageParams = {}): Promise<PaginatedResponse<NoteDoc>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 12));
  query.set('sortBy', params.sortBy ?? 'createdAt');
  query.set('sortOrder', params.sortOrder ?? 'desc');
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.pinned) query.set('pinned', params.pinned);
  const res = await apiList<Record<string, any>>(`/notes?${query.toString()}`);
  return { items: res.items.map(mapNote), pagination: res.pagination };
}
