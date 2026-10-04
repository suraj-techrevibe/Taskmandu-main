import type { FilterQuery } from 'mongoose';
import { ChatGroup, ChatMessage, type ChatGroup as GroupDoc, type ChatMessage as MessageDoc } from './chat.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import type { Lean } from '../../types/lean';
import { broadcastNewMessage, broadcastEditedMessage, broadcastDeletedMessage } from '../../services/realtime';

export interface ListGroupsOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  category?: string;
}

export async function listGroups(
  options: ListGroupsOptions,
): Promise<PaginatedResult<Lean<ChatGroup>>> {
  const filter: FilterQuery<GroupDoc> = {};
  if (options.category) {
    filter.category = options.category;
  }

  const [items, totalItems] = await Promise.all([
    ChatGroup.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    ChatGroup.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getGroupById(id: string): Promise<Lean<ChatGroup>> {
  const group = await ChatGroup.findById(id).lean();
  if (!group) {
    throw ApiError.notFound('Chat group not found');
  }
  return group;
}

export async function createGroup(
  data: Record<string, unknown>,
  actor: { id: string; name: string },
): Promise<Lean<ChatGroup>> {
  const group = await ChatGroup.create({
    ...data,
    createdBy: data.createdBy ?? actor.name,
    createdById: actor.id,
  });
  return group.toObject();
}

export async function updateGroup(
  id: string,
  data: Record<string, unknown>,
): Promise<Lean<ChatGroup>> {
  const group = await ChatGroup.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!group) {
    throw ApiError.notFound('Chat group not found');
  }
  return group;
}

export async function deleteGroup(id: string): Promise<void> {
  const result = await ChatGroup.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Chat group not found');
  }
  await ChatMessage.deleteMany({ groupId: id });
}

export async function joinGroup(id: string, userId: string): Promise<Lean<ChatGroup>> {
  const group = await ChatGroup.findById(id);
  if (!group) {
    throw ApiError.notFound('Chat group not found');
  }
  if (!group.memberIds.includes(userId)) {
    group.memberIds.push(userId);
    await group.save();
  }
  return group.toObject();
}

export async function leaveGroup(id: string, userId: string): Promise<Lean<ChatGroup>> {
  const group = await ChatGroup.findById(id);
  if (!group) {
    throw ApiError.notFound('Chat group not found');
  }
  group.memberIds = group.memberIds.filter((memberId) => memberId !== userId);
  await group.save();
  return group.toObject();
}

export interface ListMessagesOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  before?: string;
  after?: string;
}

export async function listMessages(
  groupId: string,
  options: ListMessagesOptions,
): Promise<PaginatedResult<Lean<ChatMessage>>> {
  const filter: FilterQuery<MessageDoc> = { groupId };

  if (options.before || options.after) {
    filter.createdAt = {};
    if (options.before) filter.createdAt.$lt = new Date(options.before);
    if (options.after) filter.createdAt.$gt = new Date(options.after);
  }

  const [items, totalItems] = await Promise.all([
    ChatMessage.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    ChatMessage.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function sendMessage(
  groupId: string,
  data: { text: string; isNotice?: boolean },
  actor: { id: string; name: string; role: string },
): Promise<Lean<ChatMessage>> {
  const group = await ChatGroup.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Chat group not found');
  }

  const isAdmin = actor.role === 'Super Admin' || actor.role === 'HR' || actor.role === 'Manager' || actor.role === 'Team Lead';
  if (group.isLocked && !isAdmin) {
    throw ApiError.forbidden('This group is locked. Only administrators can post messages.');
  }

  const message = await ChatMessage.create({
    groupId,
    senderId: actor.id,
    senderName: actor.name,
    senderRole: actor.role,
    text: data.text,
    isNotice: data.isNotice && isAdmin,
  });

  const savedMessage = message.toObject();
  broadcastNewMessage(group, savedMessage);

  return savedMessage;
}

export async function editMessage(
  id: string,
  text: string,
  actor: { id: string; role: string },
): Promise<Lean<ChatMessage>> {
  const message = await ChatMessage.findById(id);
  if (!message) {
    throw ApiError.notFound('Message not found');
  }

  const isAdmin = actor.role === 'Super Admin' || actor.role === 'HR' || actor.role === 'Manager' || actor.role === 'Team Lead';
  if (message.senderId !== actor.id && !isAdmin) {
    throw ApiError.forbidden('You can only edit your own messages');
  }

  message.text = text;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  const edited = message.toObject();
  broadcastEditedMessage(message.groupId.toString(), edited);

  return edited;
}

export async function deleteMessage(
  id: string,
  actor: { id: string; role: string },
): Promise<{ groupId: string }> {
  const message = await ChatMessage.findById(id);
  if (!message) {
    throw ApiError.notFound('Message not found');
  }

  const isAdmin = actor.role === 'Super Admin' || actor.role === 'HR' || actor.role === 'Manager' || actor.role === 'Team Lead';
  if (message.senderId !== actor.id && !isAdmin) {
    throw ApiError.forbidden('You can only delete your own messages');
  }

  const groupId = message.groupId.toString();
  await ChatMessage.findByIdAndDelete(id);
  broadcastDeletedMessage(groupId, id);

  return { groupId };
}

export function buildListOptions(query: Record<string, unknown>): ListGroupsOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    category: query.category as string | undefined,
  };
}

export function buildMessageListOptions(query: Record<string, unknown>): ListMessagesOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    before: query.before as string | undefined,
    after: query.after as string | undefined,
  };
}
