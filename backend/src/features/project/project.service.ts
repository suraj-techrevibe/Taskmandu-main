import type { FilterQuery } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Project, type Project as ProjectDoc } from './project.model';
import { User } from '../auth/auth.model';
import { Employee } from '../employee/employee.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import { UPLOAD_ROOT } from '../../middlewares/upload';
import { sendTaskAssignmentEmail, sendProjectMemberEmail } from '../../services/email.service';
import { env } from '../../config/env';
import logger from '../../config/logger';
import type { Lean } from '../../types/lean';

function removeUploadedFile(relativePath?: string): void {
  if (!relativePath) return;
  const absolute = path.resolve(UPLOAD_ROOT, relativePath);
  if (absolute.startsWith(UPLOAD_ROOT)) {
    fs.unlink(absolute, () => undefined);
  }
}

async function notifyAssignee(
  project: { _id: unknown; name: string },
  task: { _id: unknown; title: string },
  assigneeIds: unknown,
  assignedByName?: string,
): Promise<void> {
  const ids = Array.isArray(assigneeIds) ? assigneeIds : typeof assigneeIds === 'string' ? [assigneeIds] : [];
  for (const assigneeId of ids) {
    if (!assigneeId || typeof assigneeId !== 'string') continue;
    try {
      const assignee = await Employee.findById(assigneeId)
        .select('firstName lastName email')
        .lean();
      if (!assignee?.email) continue;

      const emails: string[] = [assignee.email];
      const user = await User.findOne({ email: assignee.email.trim().toLowerCase() })
        .select('email')
        .lean();
      if (user?.email) {
        emails.push(user.email);
      }
      const uniqueEmails = [...new Set(emails.map((e) => e.trim().toLowerCase()))];

      const taskLink = `${env.FRONTEND_URL}/projects/${String(project._id)}/tasks/${String(task._id)}`;
      for (const email of uniqueEmails) {
        await sendTaskAssignmentEmail({
          to: email,
          name: `${assignee.firstName} ${assignee.lastName}`,
          taskTitle: task.title || 'Untitled task',
          projectName: project.name,
          taskLink,
          assignedByName,
        });
      }
    } catch (err) {
      logger.warn({ err }, 'Failed to send task assignment email');
    }
  }
}

function resolveUserProjectIds(userId: string): string[] {
  return [userId];
}

async function ensureAssigneeIsMember(
  projectId: string,
  assignedToIds: unknown,
): Promise<void> {
  const ids = Array.isArray(assignedToIds) ? assignedToIds : typeof assignedToIds === 'string' ? [assignedToIds] : [];
  for (const assigneeId of ids) {
    if (!assigneeId || typeof assigneeId !== 'string' || assigneeId === '') continue;
    try {
      const employee = await Employee.findById(assigneeId).select('email').lean();
      if (!employee?.email) continue;
      const user = await User.findOne({ email: employee.email.toLowerCase() }).lean();
      if (!user) continue;
      const project = await Project.findById(projectId).lean();
      if (!project) continue;
      const isAlreadyMember = project.members?.some(
        (m: any) => m.userId && m.userId.toString() === user._id.toString(),
      );
      if (isAlreadyMember) continue;
      await Project.findByIdAndUpdate(projectId, {
        $push: {
          members: {
            userId: user._id,
            role: 'member',
            joinedAt: new Date(),
          },
        },
      });
    } catch (err) {
      logger.warn({ err }, 'Failed to auto-add task assignee as project member');
    }
  }
}

export interface ListProjectsOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  search?: string;
  status?: string;
}

function buildFilter(options: ListProjectsOptions, userIds?: string[]): FilterQuery<ProjectDoc> {
  const filter: FilterQuery<ProjectDoc> = {};
  if (options.search) {
    filter.$text = { $search: options.search };
  }
  if (options.status) {
    filter.status = options.status;
  }
  if (userIds && userIds.length > 0) {
    filter.$or = [
      { createdBy: { $in: userIds } },
      { 'members.userId': { $in: userIds } },
    ];
  }
  return filter;
}

export async function listProjects(
  options: ListProjectsOptions,
  userId?: string,
  _userRole?: string,
  permissions?: string[],
): Promise<PaginatedResult<Lean<Project>>> {
  const userIds =
    userId && !permissions?.includes('projects:manage') ? resolveUserProjectIds(userId) : undefined;
  const filter = buildFilter(options, userIds);
  const sort: Record<string, 1 | -1> = { [options.sortBy]: options.sortOrder };

  const [items, totalItems] = await Promise.all([
    Project.find(filter)
      .sort(sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getProjectById(
  id: string,
  userId?: string,
  _userRole?: string,
  permissions?: string[],
): Promise<Lean<Project>> {
  const project = await Project.findById(id).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  if (userId && !permissions?.includes('projects:manage')) {
    const userIds = resolveUserProjectIds(userId);
    const isMember =
      userIds.includes(project.createdBy?.toString() ?? '') ||
      project.members?.some((m: any) => m.userId && userIds.includes(m.userId.toString()));
    if (!isMember) {
      throw ApiError.forbidden('You do not have access to this project');
    }
  }
  return project;
}

export async function createProject(data: Record<string, unknown>): Promise<Lean<Project>> {
  const project = await Project.create(data);
  return project.toObject();
}

export async function updateProject(id: string, data: Record<string, unknown>): Promise<Lean<Project>> {
  const project = await Project.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  const result = await Project.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Project not found');
  }
  const dir = path.resolve(UPLOAD_ROOT, 'projects', id);
  if (dir.startsWith(UPLOAD_ROOT)) {
    fs.rm(dir, { recursive: true, force: true }, () => undefined);
  }
}

export async function addDocument(id: string, data: Record<string, unknown>): Promise<Lean<Project>> {
  try {
    const project = await Project.findByIdAndUpdate(
      id,
      { $push: { documents: data } },
      { new: true, runValidators: true },
    ).lean();
    if (!project) {
      throw ApiError.notFound('Project not found');
    }
    return project;
  } catch (err) {
    removeUploadedFile(typeof data.filePath === 'string' ? data.filePath : undefined);
    throw err;
  }
}

export async function deleteDocument(id: string, docId: string): Promise<Lean<Project>> {
  const project = await Project.findById(id).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  const target = project.documents?.find((doc) => doc._id.toString() === docId);
  const updated = await Project.findByIdAndUpdate(
    id,
    { $pull: { documents: { _id: docId } } },
    { new: true },
  ).lean();
  if (!updated) {
    throw ApiError.notFound('Project not found');
  }
  if (target?.filePath) {
    removeUploadedFile(target.filePath);
  }
  return updated;
}

export async function updateDocument(
  id: string,
  docId: string,
  data: Record<string, unknown>,
): Promise<Lean<Project>> {
  const project = await Project.findById(id).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  const target = project.documents.find((d) => d._id.toString() === docId);
  if (!target) {
    throw ApiError.notFound('Document not found');
  }
  const updated = await Project.findOneAndUpdate(
    { _id: id, 'documents._id': docId },
    { $set: { 'documents.$': { ...target, ...data } } },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) {
    throw ApiError.notFound('Project or document not found');
  }
  return updated;
}

export async function addVariable(id: string, data: Record<string, unknown>): Promise<Lean<Project>> {
  const project = await Project.findByIdAndUpdate(
    id,
    { $push: { sharedVariables: data } },
    { new: true, runValidators: true },
  ).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  return project;
}

export async function updateVariable(
  id: string,
  varId: string,
  data: Record<string, unknown>,
): Promise<Lean<Project>> {
  const project = await Project.findById(id).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  const target = project.sharedVariables.find((v) => v._id.toString() === varId);
  if (!target) {
    throw ApiError.notFound('Variable not found');
  }
  const updated = await Project.findOneAndUpdate(
    { _id: id, 'sharedVariables._id': varId },
    { $set: { 'sharedVariables.$': { ...target, ...data } } },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) {
    throw ApiError.notFound('Project or variable not found');
  }
  return updated;
}

export async function deleteVariable(id: string, varId: string): Promise<Lean<Project>> {
  const project = await Project.findByIdAndUpdate(
    id,
    { $pull: { sharedVariables: { _id: varId } } },
    { new: true },
  ).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  return project;
}

export async function addTask(id: string, data: Record<string, unknown>): Promise<Lean<Project>> {
  const createdAt = new Date().toISOString();
  const project = await Project.findByIdAndUpdate(
    id,
    { $push: { tasks: { ...data, createdAt } } },
    { new: true, runValidators: true },
  ).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  const created = project.tasks[project.tasks.length - 1];
  void notifyAssignee(project, created, data.assignedToId, data.assignedByName as string | undefined);
  void ensureAssigneeIsMember(id, data.assignedToId);
  return project;
}

export async function updateTask(
  id: string,
  taskId: string,
  data: Record<string, unknown>,
): Promise<Lean<Project>> {
  const project = await Project.findById(id).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  const target = project.tasks.find((t) => t._id.toString() === taskId);
  if (!target) {
    throw ApiError.notFound('Task not found');
  }
  const updated = await Project.findOneAndUpdate(
    { _id: id, 'tasks._id': taskId },
    { $set: { 'tasks.$': { ...target, ...data } } },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) {
    throw ApiError.notFound('Project or task not found');
  }
  const newAssigneeIds = data.assignedToId as string[] | undefined;
  if (Array.isArray(newAssigneeIds)) {
    const oldIds = Array.isArray(target.assignedToId) ? target.assignedToId : [];
    const addedIds = newAssigneeIds.filter((id) => !oldIds.includes(id));
    if (addedIds.length) {
      void notifyAssignee(updated, target, addedIds, data.assignedByName as string | undefined);
      void ensureAssigneeIsMember(id, addedIds);
    }
  }
  return updated;
}

export async function deleteTask(id: string, taskId: string): Promise<Lean<Project>> {
  const project = await Project.findByIdAndUpdate(
    id,
    { $pull: { tasks: { _id: taskId } } },
    { new: true },
  ).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  return project;
}

export async function addComment(
  id: string,
  taskId: string,
  text: string,
  actor: { id: string; name: string; role: string },
): Promise<Lean<Project>> {
  const comment = {
    authorId: actor.id,
    authorName: actor.name,
    authorRole: actor.role,
    text,
    createdAt: new Date().toISOString(),
  };
  const project = await Project.findOneAndUpdate(
    { _id: id, 'tasks._id': taskId },
    { $push: { 'tasks.$.comments': comment } },
    { new: true, runValidators: true },
  ).lean();
  if (!project) {
    throw ApiError.notFound('Project or task not found');
  }
  return project;
}

export async function addSubTask(
  id: string,
  taskId: string,
  data: Record<string, unknown>,
): Promise<Lean<Project>> {
  const project = await Project.findOneAndUpdate(
    { _id: id, 'tasks._id': taskId },
    { $push: { 'tasks.$.subTasks': { ...data, createdAt: new Date().toISOString() } } },
    { new: true, runValidators: true },
  ).lean();
  if (!project) {
    throw ApiError.notFound('Project or task not found');
  }
  void ensureAssigneeIsMember(id, data.assignedToId as string | undefined);
  return project;
}

export async function updateSubTask(
  id: string,
  taskId: string,
  subTaskId: string,
  data: Record<string, unknown>,
): Promise<Lean<Project>> {
  const project = await Project.findById(id).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  const task = project.tasks.find((t) => t._id.toString() === taskId);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  const subTask = (task.subTasks as any[])?.find((st: any) => st._id.toString() === subTaskId);
  if (!subTask) {
    throw ApiError.notFound('Sub-task not found');
  }
  const updated = await Project.findOneAndUpdate(
    { _id: id, 'tasks._id': taskId, 'tasks.subTasks._id': subTaskId },
    { $set: { 'tasks.$[task].subTasks.$[subTask]': { ...subTask, ...data } } },
    { new: true, runValidators: true, arrayFilters: [
      { 'task._id': taskId },
      { 'subTask._id': subTaskId },
    ] },
  ).lean();
  if (!updated) {
    throw ApiError.notFound('Project, task, or sub-task not found');
  }
  return updated;
}

export async function deleteSubTask(
  id: string,
  taskId: string,
  subTaskId: string,
): Promise<Lean<Project>> {
  const project = await Project.findOneAndUpdate(
    { _id: id, 'tasks._id': taskId },
    { $pull: { 'tasks.$.subTasks': { _id: subTaskId } } },
    { new: true },
  ).lean();
  if (!project) {
    throw ApiError.notFound('Project or task not found');
  }
  return project;
}

export async function addSubTaskComment(
  id: string,
  taskId: string,
  subTaskId: string,
  text: string,
  actor: { id: string; name: string; role: string },
): Promise<Lean<Project>> {
  const comment = {
    authorId: actor.id,
    authorName: actor.name,
    authorRole: actor.role,
    text,
    createdAt: new Date().toISOString(),
  };
  const project = await Project.findOneAndUpdate(
    { _id: id, 'tasks._id': taskId, 'tasks.subTasks._id': subTaskId },
    { $push: { 'tasks.$[task].subTasks.$[subTask].comments': comment } },
    { new: true, runValidators: true, arrayFilters: [
      { 'task._id': taskId },
      { 'subTask._id': subTaskId },
    ] },
  ).lean();
  if (!project) {
    throw ApiError.notFound('Project, task, or sub-task not found');
  }
  return project;
}

export async function addMember(
  id: string,
  data: Record<string, unknown>,
  actor?: { id: string; name: string },
): Promise<Lean<Project>> {
  const project = await Project.findById(id).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  // Resolve the user account: try userId directly as a User, then resolve
  // through the Employee record by email so employee-driven invites still
  // link to the correct User account.
  let user = typeof data.userId === 'string' ? await User.findById(data.userId).lean() : null;
  if (!user && typeof data.userId === 'string') {
    const employee = await Employee.findById(data.userId).select('email').lean();
    if (employee?.email) {
      user = await User.findOne({ email: employee.email.trim().toLowerCase() }).lean();
    }
  }
  if (!user && typeof data.email === 'string') {
    user = await User.findOne({ email: data.email.trim().toLowerCase() }).lean();
  }
  if (!user) {
    throw ApiError.badRequest('No user account found for this person. They need to sign up first.');
  }

  const existingMember = project.members?.find(
    (m: any) => m.userId && m.userId.toString() === user!._id.toString(),
  );
  if (existingMember) {
    throw ApiError.conflict('User is already a member of this project');
  }

  const updated = await Project.findByIdAndUpdate(
    id,
    {
      $push: {
        members: {
          userId: user._id,
          role: (data.role as string) || 'member',
          joinedAt: new Date(),
        },
      },
    },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) {
    throw ApiError.notFound('Project not found');
  }

  // Send project invitation email to Employee and User (deduplicated)
  try {
    const emails: string[] = [user.email];
    if (typeof data.userId === 'string') {
      const employee = await Employee.findById(data.userId).select('email').lean();
      if (employee?.email) {
        emails.push(employee.email);
      }
    }
    const uniqueEmails = [...new Set(emails.map((e) => e.trim().toLowerCase()))];
    if (uniqueEmails.length) {
      void sendProjectMemberEmail({
        to: uniqueEmails,
        name: (data.name as string) || user.name || 'Member',
        projectName: project.name,
        projectLink: `${env.FRONTEND_URL}/projects/${String(project._id)}`,
        addedByName: actor?.name,
      });
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to send project member email');
  }

  return updated;
}

export async function removeMember(
  id: string,
  memberId: string,
): Promise<Lean<Project>> {
  const project = await Project.findByIdAndUpdate(
    id,
    { $pull: { members: { _id: memberId } } },
    { new: true },
  ).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  return project;
}

export async function listMembers(id: string): Promise<any[]> {
  const project = await Project.findById(id).lean();
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  return project.members || [];
}

export function buildListOptions(query: Record<string, unknown>): ListProjectsOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    search: query.search as string | undefined,
    status: query.status as string | undefined,
  };
}
