import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import { ApiError } from '../../utils/ApiError';
import * as projectService from './project.service';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const createProject = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.createProject({
    ...req.body,
    createdBy: req.user!.id,
    members: [{
      userId: req.user!.id,
      role: 'owner',
      joinedAt: new Date(),
    }],
  });
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Project created', project));
});

export const getProjects = catchAsync(async (req: Request, res: Response) => {
  const options = projectService.buildListOptions(req.query);
  const result = await projectService.listProjects(options, req.user!.id, req.user!.role, req.user!.permissions);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Projects fetched', result.items, result));
});

export const getProject = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(req.params.id, req.user!.id, req.user!.role, req.user!.permissions);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Project fetched', project));
});

export const updateProject = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.updateProject(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Project updated', project));
});

export const deleteProject = catchAsync(async (req: Request, res: Response) => {
  await projectService.deleteProject(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Project deleted'));
});

export const addDocument = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) throw ApiError.badRequest('No file uploaded');
  const relativePath = `projects/${req.params.id}/${file.filename}`;
  const project = await projectService.addDocument(req.params.id, {
    name: (req.body?.name as string)?.trim() || file.originalname,
    size: formatBytes(file.size),
    uploadedBy: String(req.body?.uploadedBy ?? ''),
    uploadedAt: new Date().toISOString(),
    description: ((req.body?.description as string) || '').trim(),
    filePath: relativePath,
    mimeType: file.mimetype,
  });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Document added', project));
});

export const deleteDocument = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.deleteDocument(req.params.id, req.params.subId);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Document removed', project));
});

export const updateDocument = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.updateDocument(req.params.id, req.params.subId, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Document updated', project));
});

export const addVariable = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.addVariable(req.params.id, {
    ...req.body,
    updatedAt: new Date().toISOString(),
  });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Variable added', project));
});

export const updateVariable = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.updateVariable(req.params.id, req.params.subId, {
    ...req.body,
    updatedAt: new Date().toISOString(),
  });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Variable updated', project));
});

export const deleteVariable = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.deleteVariable(req.params.id, req.params.subId);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Variable removed', project));
});

export const addTask = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.addTask(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Task added', project));
});

export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.updateTask(req.params.id, req.params.subId, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Task updated', project));
});

export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.deleteTask(req.params.id, req.params.subId);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Task removed', project));
});

export const addComment = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.addComment(
    req.params.id,
    req.params.subId,
    req.body.text,
    { id: req.user!.id, name: req.user!.name, role: req.user!.role },
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Comment added', project));
});

export const addSubTask = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.addSubTask(
    req.params.id,
    req.params.subId,
    req.body,
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Sub-task added', project));
});

export const updateSubTask = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.updateSubTask(
    req.params.id,
    req.params.subId,
    req.params.subSubId,
    req.body,
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Sub-task updated', project));
});

export const deleteSubTask = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.deleteSubTask(
    req.params.id,
    req.params.subId,
    req.params.subSubId,
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Sub-task removed', project));
});

export const addSubTaskComment = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.addSubTaskComment(
    req.params.id,
    req.params.subId,
    req.params.subSubId,
    req.body.text,
    { id: req.user!.id, name: req.user!.name, role: req.user!.role },
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Comment added', project));
});

export const addMember = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.addMember(req.params.id, req.body, {
    id: req.user!.id,
    name: req.user!.name,
  });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Member added', project));
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.removeMember(req.params.id, req.params.subId);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Member removed', project));
});

export const listMembers = catchAsync(async (req: Request, res: Response) => {
  const members = await projectService.listMembers(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Members fetched', members));
});
