import type { FilterQuery } from 'mongoose';
import { Notification, type SystemNotification } from './notification.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import type { Lean } from '../../types/lean';

export interface ListNotificationsOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  type?: string;
  read?: boolean;
  recipientId?: string | null;
}

function buildFilter(options: ListNotificationsOptions): FilterQuery<SystemNotification> {
  const filter: FilterQuery<SystemNotification> = {};

  if (options.type) {
    filter.type = options.type;
  }
  if (options.read !== undefined) {
    filter.read = options.read;
  }
  // Broadcast notifications (recipientId null) are visible to everyone,
  // plus notifications addressed to this user specifically.
  if (options.recipientId !== undefined) {
    filter.$or = [{ recipientId: null }, { recipientId: options.recipientId }];
  }

  return filter;
}

export async function listNotifications(
  options: ListNotificationsOptions,
): Promise<PaginatedResult<Lean<SystemNotification>>> {
  const filter = buildFilter(options);

  const [items, totalItems] = await Promise.all([
    Notification.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getNotificationById(id: string): Promise<Lean<SystemNotification>> {
  const notification = await Notification.findById(id).lean();
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }
  return notification;
}

export async function createNotification(data: {
  title: string;
  message: string;
  type: string;
  recipientId?: string | null;
}): Promise<Lean<SystemNotification>> {
  const notification = await Notification.create(data);
  return notification.toObject();
}

export async function markAsRead(id: string): Promise<Lean<SystemNotification>> {
  const notification = await Notification.findByIdAndUpdate(
    id,
    { read: true, readAt: new Date() },
    { new: true },
  ).lean();

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }
  return notification;
}

export async function markAllAsRead(recipientId?: string | null): Promise<{ modified: number }> {
  const filter: FilterQuery<SystemNotification> = { read: false };
  if (recipientId !== undefined) {
    filter.$or = [{ recipientId: null }, { recipientId }];
  }

  const result = await Notification.updateMany(filter, { read: true, readAt: new Date() });
  return { modified: result.modifiedCount };
}

export async function deleteNotification(id: string): Promise<void> {
  const result = await Notification.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Notification not found');
  }
}

export async function clearAll(recipientId?: string | null): Promise<{ deleted: number }> {
  const filter: FilterQuery<SystemNotification> = {};
  if (recipientId !== undefined) {
    filter.$or = [{ recipientId: null }, { recipientId }];
  }

  const result = await Notification.deleteMany(filter);
  return { deleted: result.deletedCount };
}

export function buildListOptions(
  query: Record<string, unknown>,
  recipientId?: string | null,
): ListNotificationsOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    type: query.type as string | undefined,
    read: query.read === 'true' ? true : query.read === 'false' ? false : undefined,
    recipientId,
  };
}
