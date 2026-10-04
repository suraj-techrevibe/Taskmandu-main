import type { FilterQuery } from 'mongoose';
import { Note, type Note as NoteDoc } from './note.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import type { Lean } from '../../types/lean';

export interface ListNotesOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  search?: string;
  category?: string;
  pinned?: boolean;
}

function buildFilter(options: ListNotesOptions): FilterQuery<NoteDoc> {
  const filter: FilterQuery<NoteDoc> = {};

  if (options.search) {
    filter.$text = { $search: options.search };
  }
  if (options.category) {
    filter.category = options.category;
  }
  if (options.pinned !== undefined) {
    filter.isPinned = options.pinned;
  }

  return filter;
}

export async function listNotes(
  options: ListNotesOptions,
): Promise<PaginatedResult<Lean<Note>>> {
  const filter = buildFilter(options);

  // Pinned notes float to the top regardless of sort order
  const sort: Record<string, 1 | -1> = { isPinned: -1, [options.sortBy]: options.sortOrder };

  const [items, totalItems] = await Promise.all([
    Note.find(filter)
      .sort(sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Note.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getNoteById(id: string): Promise<Lean<Note>> {
  const note = await Note.findById(id).lean();
  if (!note) {
    throw ApiError.notFound('Note not found');
  }
  return note;
}

export async function createNote(
  data: Record<string, unknown>,
  actor: { id: string; name: string },
): Promise<Lean<Note>> {
  const note = await Note.create({
    ...data,
    author: data.author ?? actor.name,
    authorId: actor.id,
  });
  return note.toObject();
}

export async function updateNote(
  id: string,
  data: Record<string, unknown>,
  actor: { id: string; role: string },
): Promise<Lean<Note>> {
  const existing = await Note.findById(id).lean();
  assertNoteAccess(existing, actor);
  const note = await Note.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!note) {
    throw ApiError.notFound('Note not found');
  }
  return note;
}

const MANAGER_ROLES = new Set(['Super Admin', 'HR', 'Manager', 'Team Lead']);

function assertNoteAccess(
  note: { authorId?: string | null } | null,
  actor: { id: string; role: string },
): void {
  if (!note) {
    throw ApiError.notFound('Note not found');
  }
  if (!MANAGER_ROLES.has(actor.role) && note.authorId !== actor.id) {
    throw ApiError.forbidden('You can only modify or delete your own notes');
  }
}

export async function deleteNote(
  id: string,
  actor: { id: string; role: string },
): Promise<void> {
  const existing = await Note.findById(id).lean();
  assertNoteAccess(existing, actor);
  const result = await Note.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Note not found');
  }
}

export function buildListOptions(query: Record<string, unknown>): ListNotesOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    search: query.search as string | undefined,
    category: query.category as string | undefined,
    pinned: query.pinned === 'true' ? true : query.pinned === 'false' ? false : undefined,
  };
}
