import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as taskService from './task.service';
import type { TaskStatus } from '../../types';

export const createTask = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.createTask(req.body, {
    id: req.user!.id,
    name: req.user!.name,
  });
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Task created', task));
});

export const getTasks = catchAsync(async (req: Request, res: Response) => {
  const options = taskService.buildListOptions(req.query);
  const result = await taskService.listTasks(options);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Tasks fetched', result.items, result));
});

export const getTask = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.getTaskById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Task fetched', task));
});

export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.updateTask(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Task updated', task));
});

export const updateTaskStatus = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.updateTaskStatus(
    req.params.id,
    (req.body as { status: TaskStatus }).status,
    {
      id: req.user!.id,
      employeeId: req.user!.employeeId,
      role: req.user!.role,
      permissions: req.user!.permissions,
    },
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Task status updated', task));
});

export const addComment = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.addTaskComment(
    req.params.id,
    (req.body as { text: string }).text,
    { id: req.user!.id, name: req.user!.name, role: req.user!.role },
  );
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Comment added', task));
});

export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  await taskService.deleteTask(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Task deleted'));
});
