import type { FilterQuery } from 'mongoose';
import { Task, type Task as TaskDoc } from './task.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import type { Lean } from '../../types/lean';
import type { TaskStatus } from '../../types';

export interface ListTasksOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  search?: string;
  assignedToId?: string;
  status?: string;
  priority?: string;
  tag?: string;
  dueBefore?: string;
  dueAfter?: string;
}

function buildFilter(options: ListTasksOptions): FilterQuery<TaskDoc> {
  const filter: FilterQuery<TaskDoc> = {};

  if (options.search) {
    filter.$text = { $search: options.search };
  }
  if (options.assignedToId) {
    filter.assignedToId = { $in: [options.assignedToId] };
  }
  if (options.status) {
    filter.status = options.status;
  }
  if (options.priority) {
    filter.priority = options.priority;
  }
  if (options.tag) {
    filter.tags = options.tag;
  }
  if (options.dueBefore || options.dueAfter) {
    filter.dueDate = {};
    if (options.dueBefore) filter.dueDate.$lte = options.dueBefore;
    if (options.dueAfter) filter.dueDate.$gte = options.dueAfter;
  }

  return filter;
}

export async function listTasks(
  options: ListTasksOptions,
): Promise<PaginatedResult<Lean<Task>>> {
  const filter = buildFilter(options);

  const [items, totalItems] = await Promise.all([
    Task.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Task.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getTaskById(id: string): Promise<Lean<Task>> {
  const task = await Task.findById(id).lean();
  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  return task;
}

export async function createTask(
  data: Record<string, unknown>,
  actor: { id: string; name: string },
): Promise<Lean<Task>> {
  const task = await Task.create({
    ...data,
    assignedByName: data.assignedByName ?? actor.name,
    createdById: actor.id,
  });
  return task.toObject();
}

export async function updateTask(
  id: string,
  data: Record<string, unknown>,
): Promise<Lean<Task>> {
  const update: Record<string, unknown> = { ...data };

  if (data.status === 'Completed') {
    update.completedAt = new Date();
  } else if (update.status !== undefined) {
    update.completedAt = null;
  }

  const task = await Task.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  return task;
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  actor: { id: string; employeeId?: string | null; role: string; permissions?: string[] },
): Promise<Lean<Task>> {
  const task = await Task.findById(id).lean();
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const isPrivileged = actor.permissions?.includes('tasks:manage') || actor.role !== 'Employee';
  const assigneeIds = Array.isArray(task.assignedToId) ? task.assignedToId : [];
  const isAssignee = assigneeIds.includes(actor.employeeId ?? actor.id);
  if (!isPrivileged && !isAssignee) {
    throw ApiError.forbidden('You can only update the status of tasks assigned to you');
  }

  return updateTask(id, { status });
}

export async function addTaskComment(
  id: string,
  text: string,
  author: { id: string; name: string; role: string },
): Promise<Lean<Task>> {
  const task = await Task.findById(id);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  task.comments.push({
    authorId: author.id,
    authorName: author.name,
    authorRole: author.role,
    text,
  });
  await task.save();

  return task.toObject();
}

export async function deleteTask(id: string): Promise<void> {
  const result = await Task.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Task not found');
  }
}

export async function countTasks(filter: FilterQuery<TaskDoc> = {}): Promise<number> {
  return Task.countDocuments(filter);
}

export function buildListOptions(query: Record<string, unknown>): ListTasksOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    search: query.search as string | undefined,
    assignedToId: query.assignedToId as string | undefined,
    status: query.status as string | undefined,
    priority: query.priority as string | undefined,
    tag: query.tag as string | undefined,
    dueBefore: query.dueBefore as string | undefined,
    dueAfter: query.dueAfter as string | undefined,
  };
}
