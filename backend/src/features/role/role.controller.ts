import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import { PERMISSION_CATALOG } from '../../types/permissions';
import * as roleService from './role.service';

export const getRoles = catchAsync(async (_req: Request, res: Response) => {
  const roles = await roleService.listRoles();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Roles fetched successfully', { roles }));
});

export const getPermissionCatalog = catchAsync(async (_req: Request, res: Response) => {
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Permission catalog fetched successfully', { permissions: PERMISSION_CATALOG }));
});

export const createRole = catchAsync(async (req: Request, res: Response) => {
  const role = await roleService.createRole(req.body);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Role created successfully', { role }));
});

export const updateRole = catchAsync(async (req: Request, res: Response) => {
  const role = await roleService.updateRole(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Role updated successfully', { role }));
});

export const deleteRole = catchAsync(async (req: Request, res: Response) => {
  await roleService.deleteRole(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Role deleted successfully'));
});
