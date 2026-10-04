import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as leaveService from './leave.service';

export const createLeave = catchAsync(async (req: Request, res: Response) => {
  const { employeeId, startDate, endDate, leaveType, reason } = req.body as {
    employeeId?: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    reason?: string;
  };

  const leave = await leaveService.createLeave(
    { employeeId, startDate, endDate, leaveType, reason },
    { id: req.user!.id, name: req.user!.name, employeeId: req.user!.employeeId },
  );

  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Leave request submitted', leave));
});

export const getLeaves = catchAsync(async (req: Request, res: Response) => {
  const options = leaveService.buildListOptions(req.query);
  const result = await leaveService.listLeaves(options);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Leave requests fetched', result.items, result));
});

export const getLeave = catchAsync(async (req: Request, res: Response) => {
  const leave = await leaveService.getLeaveById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Leave request fetched', leave));
});

export const getMyLeaves = catchAsync(async (req: Request, res: Response) => {
  const { status, limit } = req.query as { status?: string; limit?: string };
  const leaves = await leaveService.getMyLeaves(
    req.user!.employeeId ?? req.user!.id,
    status,
    limit ? parseInt(limit, 10) : 50,
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'My leave requests fetched', leaves));
});

export const updateLeave = catchAsync(async (req: Request, res: Response) => {
  const leave = await leaveService.updateLeave(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Leave request updated', leave));
});

export const actionLeave = catchAsync(async (req: Request, res: Response) => {
  const { status, notes } = req.body as { status: 'Approved' | 'Rejected'; notes?: string };
  const leave = await leaveService.actionLeave(req.params.id, status, notes ?? '', {
    id: req.user!.id,
    name: req.user!.name,
  });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, `Leave request ${status.toLowerCase()}`, leave));
});

export const deleteLeave = catchAsync(async (req: Request, res: Response) => {
  await leaveService.deleteLeave(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Leave request deleted'));
});
