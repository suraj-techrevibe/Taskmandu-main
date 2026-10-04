import { apiGet, apiList, apiPost, apiPatch, apiDelete, unwrapItems } from './http';
import type { PaginatedResponse } from './http';
import type { Task, SubTask } from '../types';

export interface ProjectDocumentDoc {
  _id: string;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string | null;
  description?: string;
  filePath?: string;
  mimeType?: string;
}

export interface SharedVariableDoc {
  _id: string;
  key: string;
  value: string;
  isSecret: boolean;
  type: 'Environment' | 'Server Creds' | 'Database' | 'Other';
  description: string;
  updatedBy: string;
  updatedAt: string | null;
}

export interface ProjectMemberDoc {
  _id: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface ProjectDoc {
  _id: string;
  name: string;
  description: string;
  status: 'Planning' | 'Active' | 'Blocked' | 'On Hold' | 'Completed';
  manager: string;
  startDate: string | null;
  endDate: string | null;
  color: string;
  createdBy: string;
  documents: ProjectDocumentDoc[];
  sharedVariables: SharedVariableDoc[];
  tasks: Task[];
  members: ProjectMemberDoc[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  status: ProjectDoc['status'];
  manager: string;
  startDate: string | null;
  endDate: string | null;
  color: string;
  members?: { userId: string; name: string; email: string; role: string }[];
}

function mapProject(doc: Record<string, any>): ProjectDoc {
  const tasks: Task[] = (doc.tasks ?? []).map((t: Record<string, any>) => ({
    id: t._id ?? t.id,
    title: t.title,
    description: t.description ?? '',
    assignedToId: Array.isArray(t.assignedToId) ? t.assignedToId : t.assignedToId ? [t.assignedToId] : [],
    priority: t.priority ?? 'Medium',
    dueDate: t.dueDate,
    estimatedHours: t.estimatedHours ?? 0,
    status: t.status ?? 'Assigned',
    createdAt: t.createdAt,
    attachments: t.attachments ?? [],
    tags: t.tags ?? [],
    comments: (t.comments ?? []).map((c: Record<string, any>) => ({
      id: c._id ?? c.id ?? `${c.authorId}-${c.createdAt ?? Date.now()}`,
      authorName: c.authorName ?? '',
      authorRole: c.authorRole ?? '',
      text: c.text ?? '',
      createdAt: c.createdAt,
    })),
    subTasks: (t.subTasks ?? []).map((st: Record<string, any>) => ({
      id: st._id ?? st.id,
      title: st.title ?? '',
      assignedToId: Array.isArray(st.assignedToId) ? st.assignedToId : st.assignedToId ? [st.assignedToId] : [],
      assignedByName: st.assignedByName ?? '',
      status: st.status ?? 'Assigned',
      completedAt: st.completedAt ?? null,
      createdAt: st.createdAt,
      comments: (st.comments ?? []).map((c: Record<string, any>) => ({
        id: c._id ?? c.id ?? `${c.authorId}-${c.createdAt ?? Date.now()}`,
        authorName: c.authorName ?? '',
        authorRole: c.authorRole ?? '',
        text: c.text ?? '',
        createdAt: c.createdAt,
      })),
    })),
  }));

  return {
    _id: doc._id ?? doc.id,
    name: doc.name,
    description: doc.description ?? '',
    status: doc.status ?? 'Planning',
    manager: doc.manager ?? '',
    startDate: doc.startDate ?? null,
    endDate: doc.endDate ?? null,
    color: doc.color ?? '',
    createdBy: doc.createdBy ?? '',
    documents: doc.documents ?? [],
    sharedVariables: doc.sharedVariables ?? [],
    tasks,
    members: (doc.members ?? []).map((m: Record<string, any>) => ({
      _id: m._id ?? m.id,
      userId: m.userId ?? '',
      name: m.name ?? '',
      email: m.email ?? '',
      role: m.role ?? 'member',
      joinedAt: m.joinedAt ?? '',
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listProjects(limit = 100): Promise<ProjectDoc[]> {
  const data = await apiGet<ProjectDoc[]>(`/projects?limit=${limit}`);
  return unwrapItems<ProjectDoc>(data).map(mapProject);
}

export interface ListProjectPageParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listProjectPage(
  params: ListProjectPageParams = {},
): Promise<PaginatedResponse<ProjectDoc>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 8));
  query.set('sortBy', params.sortBy ?? 'createdAt');
  query.set('sortOrder', params.sortOrder ?? 'desc');
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  const res = await apiList<ProjectDoc>(`/projects?${query.toString()}`);
  return { items: res.items.map(mapProject), pagination: res.pagination };
}

export async function getProject(id: string): Promise<ProjectDoc> {
  const data = await apiGet<Record<string, any>>(`/projects/${id}`);
  return mapProject(data);
}

export async function createProject(input: CreateProjectInput): Promise<ProjectDoc> {
  const data = await apiPost<Record<string, any>>('/projects', input);
  return mapProject(data);
}

export async function updateProject(id: string, patch: Partial<CreateProjectInput>): Promise<ProjectDoc> {
  const data = await apiPatch<Record<string, any>>(`/projects/${id}`, patch);
  return mapProject(data);
}

export async function deleteProject(id: string): Promise<void> {
  await apiDelete(`/projects/${id}`);
}

export async function addDocument(id: string, doc: { file: File; name: string; uploadedBy: string; description?: string }): Promise<ProjectDoc> {
  const form = new FormData();
  form.append('file', doc.file);
  form.append('name', doc.name);
  form.append('uploadedBy', doc.uploadedBy);
  if (doc.description) form.append('description', doc.description);
  const data = await apiPost<Record<string, any>>(`/projects/${id}/documents`, form);
  return mapProject(data);
}

export async function deleteDocument(id: string, docId: string): Promise<ProjectDoc> {
  const data = await apiDelete<Record<string, any>>(`/projects/${id}/documents/${docId}`);
  return mapProject(data);
}

export async function updateDocument(id: string, docId: string, patch: { name?: string; size?: string; description?: string }): Promise<ProjectDoc> {
  const data = await apiPatch<Record<string, any>>(`/projects/${id}/documents/${docId}`, patch);
  return mapProject(data);
}

export async function addVariable(id: string, variable: Omit<SharedVariableDoc, '_id' | 'updatedAt'>): Promise<ProjectDoc> {
  const data = await apiPost<Record<string, any>>(`/projects/${id}/variables`, variable);
  return mapProject(data);
}

export async function updateVariable(id: string, varId: string, patch: Partial<Omit<SharedVariableDoc, '_id'>>): Promise<ProjectDoc> {
  const data = await apiPatch<Record<string, any>>(`/projects/${id}/variables/${varId}`, patch);
  return mapProject(data);
}

export async function deleteVariable(id: string, varId: string): Promise<ProjectDoc> {
  const data = await apiDelete<Record<string, any>>(`/projects/${id}/variables/${varId}`);
  return mapProject(data);
}

export interface AddProjectTaskInput extends Omit<Task, 'id' | 'comments' | 'attachments' | 'status' | 'subTasks'> {
  assignedByName: string;
  status?: Task['status'];
}

export async function addProjectTask(id: string, task: AddProjectTaskInput): Promise<ProjectDoc> {
  const data = await apiPost<Record<string, any>>(`/projects/${id}/tasks`, task);
  return mapProject(data);
}

export async function updateProjectTask(id: string, taskId: string, patch: Partial<Task>): Promise<ProjectDoc> {
  const data = await apiPatch<Record<string, any>>(`/projects/${id}/tasks/${taskId}`, patch);
  return mapProject(data);
}

export async function addTaskComment(id: string, taskId: string, text: string): Promise<ProjectDoc> {
  const data = await apiPost<Record<string, any>>(`/projects/${id}/tasks/${taskId}/comments`, { text });
  return mapProject(data);
}

export async function deleteProjectTask(id: string, taskId: string): Promise<ProjectDoc> {
  const data = await apiDelete<Record<string, any>>(`/projects/${id}/tasks/${taskId}`);
  return mapProject(data);
}

export async function addSubTask(projectId: string, taskId: string, subTask: { title: string; assignedToId?: string[]; assignedByName?: string }): Promise<ProjectDoc> {
  const data = await apiPost<Record<string, any>>(`/projects/${projectId}/tasks/${taskId}/subtasks`, subTask);
  return mapProject(data);
}

export async function updateSubTask(projectId: string, taskId: string, subTaskId: string, patch: Partial<SubTask>): Promise<ProjectDoc> {
  const data = await apiPatch<Record<string, any>>(`/projects/${projectId}/tasks/${taskId}/subtasks/${subTaskId}`, patch);
  return mapProject(data);
}

export async function deleteSubTask(projectId: string, taskId: string, subTaskId: string): Promise<ProjectDoc> {
  const data = await apiDelete<Record<string, any>>(`/projects/${projectId}/tasks/${taskId}/subtasks/${subTaskId}`);
  return mapProject(data);
}

export async function addSubTaskComment(projectId: string, taskId: string, subTaskId: string, text: string): Promise<ProjectDoc> {
  const data = await apiPost<Record<string, any>>(`/projects/${projectId}/tasks/${taskId}/subtasks/${subTaskId}/comments`, { text });
  return mapProject(data);
}

export async function listMembers(projectId: string): Promise<ProjectMemberDoc[]> {
  const data = await apiGet<ProjectMemberDoc[]>(`/projects/${projectId}/members`);
  return unwrapItems<ProjectMemberDoc>(data);
}

export async function addMember(projectId: string, member: { userId: string; name: string; email: string; role?: string }): Promise<ProjectDoc> {
  const data = await apiPost<Record<string, any>>(`/projects/${projectId}/members`, member);
  return mapProject(data);
}

export async function removeMember(projectId: string, memberId: string): Promise<ProjectDoc> {
  const data = await apiDelete<Record<string, any>>(`/projects/${projectId}/members/${memberId}`);
  return mapProject(data);
}
