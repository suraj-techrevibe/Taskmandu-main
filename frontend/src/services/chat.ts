import { apiGet, apiPost, apiPatch, apiDelete, unwrapItems } from './http';

export interface ChatGroupDoc {
  id: string;
  name: string;
  description: string;
  category: string;
  memberIds: string[];
  createdBy: string;
  createdById?: string | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessageDoc {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  isNotice?: boolean;
  isEdited?: boolean;
  editedAt?: string | null;
  createdAt: string;
}

export interface CreateChatGroupInput {
  name: string;
  description: string;
  category: string;
  memberIds: string[];
  isLocked: boolean;
}

function mapGroup(doc: Record<string, any>): ChatGroupDoc {
  return {
    id: doc._id ?? doc.id,
    name: doc.name,
    description: doc.description ?? '',
    category: doc.category ?? 'General',
    memberIds: doc.memberIds ?? [],
    createdBy: doc.createdBy ?? '',
    createdById: doc.createdById ?? null,
    isLocked: doc.isLocked ?? false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapMessage(doc: Record<string, any>): ChatMessageDoc {
  return {
    id: doc._id ?? doc.id,
    groupId: doc.groupId?._id ?? doc.groupId,
    senderId: doc.senderId ?? '',
    senderName: doc.senderName ?? '',
    senderRole: doc.senderRole ?? '',
    text: doc.text ?? '',
    isNotice: doc.isNotice ?? false,
    isEdited: doc.isEdited ?? false,
    editedAt: doc.editedAt ?? null,
    createdAt: doc.createdAt,
  };
}

export async function listGroups(): Promise<ChatGroupDoc[]> {
  const data = await apiGet<{ items: Record<string, any>[] }>('/chat?limit=100');
  return unwrapItems(data).map(mapGroup);
}

export async function listMessages(groupId: string, limit = 100): Promise<ChatMessageDoc[]> {
  const data = await apiGet<{ items: Record<string, any>[] }>(`/chat/${groupId}/messages?limit=${limit}`);
  return unwrapItems(data).map(mapMessage);
}

export async function createGroup(input: CreateChatGroupInput): Promise<ChatGroupDoc> {
  const data = await apiPost<Record<string, any>>('/chat', input);
  return mapGroup(data);
}

export async function updateGroup(id: string, patch: Partial<CreateChatGroupInput>): Promise<ChatGroupDoc> {
  const data = await apiPatch<Record<string, any>>(`/chat/${id}`, patch);
  return mapGroup(data);
}

export async function sendMessage(groupId: string, text: string): Promise<ChatMessageDoc> {
  const data = await apiPost<Record<string, any>>(`/chat/${groupId}/messages`, { text });
  return mapMessage(data);
}

export async function editMessage(messageId: string, text: string): Promise<ChatMessageDoc> {
  const data = await apiPatch<Record<string, any>>(`/chat/messages/${messageId}`, { text });
  return mapMessage(data);
}

export async function deleteMessage(messageId: string): Promise<void> {
  await apiDelete(`/chat/messages/${messageId}`);
}

export { mapMessage as mapChatMessage }; // re-export for realtime consumers
