import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as departmentService from './department.service';

export const getDepartments = catchAsync(async (_req: Request, res: Response) => {
  const departments = await departmentService.listDepartments();
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Departments fetched successfully', { departments }));
});

export const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await departmentService.createDepartment(req.body);
  res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, 'Department created successfully', { department }));
});

export const updateDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await departmentService.updateDepartment(req.params.id, req.body);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Department updated successfully', { department }));
});

export const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
  await departmentService.deleteDepartment(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Department deleted successfully'));
});
