import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import { getDashboardSummary } from './dashboard.service';

export const getSummary = catchAsync(async (_req: Request, res: Response) => {
  const summary = await getDashboardSummary();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Dashboard summary fetched', summary));
});
