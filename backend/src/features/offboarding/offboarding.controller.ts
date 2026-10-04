import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as offboardingService from './offboarding.service';
import type { ClearanceStatus } from '../../types';

export const createOffboarding = catchAsync(async (req: Request, res: Response) => {
  const offboarding = await offboardingService.createOffboarding(req.body);
  res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, 'Offboarding profile created', offboarding));
});

export const getOffboardings = catchAsync(async (req: Request, res: Response) => {
  const options = offboardingService.buildListOptions(req.query);
  const result = await offboardingService.listOffboardings(options);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Offboarding profiles fetched', result.items, result));
});

export const getOffboarding = catchAsync(async (req: Request, res: Response) => {
  const offboarding = await offboardingService.getOffboardingById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Offboarding profile fetched', offboarding));
});

export const updateOffboarding = catchAsync(async (req: Request, res: Response) => {
  const offboarding = await offboardingService.updateOffboarding(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Offboarding profile updated', offboarding));
});

export const updateClearance = catchAsync(async (req: Request, res: Response) => {
  const { department, status } = req.body as {
    department: 'hr' | 'finance' | 'it' | 'operations';
    status: ClearanceStatus;
  };
  const offboarding = await offboardingService.updateClearance(req.params.id, department, status);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Clearance updated', offboarding));
});

export const archiveEmployee = catchAsync(async (req: Request, res: Response) => {
  const result = await offboardingService.archiveEmployee(req.params.id);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Employee archived and credentials revoked', result));
});

export const deleteOffboarding = catchAsync(async (req: Request, res: Response) => {
  await offboardingService.deleteOffboarding(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Offboarding profile deleted'));
});
