import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import { ApiError } from '../../utils/ApiError';
import * as attendanceService from './attendance.service';

function requireEmployeeProfile(req: Request): string {
  const employeeId = req.user!.employeeId;
  if (!employeeId) {
    throw ApiError.badRequest(
      'No employee profile is linked to your account. Contact an administrator.',
    );
  }
  return employeeId;
}

export const checkIn = catchAsync(async (req: Request, res: Response) => {
  const { locationType } = req.body as { locationType?: 'Onsite' | 'WFH' };
  const record = await attendanceService.checkIn(requireEmployeeProfile(req), {
    locationType,
  });
  res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, 'Check-in recorded', record));
});

export const checkOut = catchAsync(async (req: Request, res: Response) => {
  const record = await attendanceService.checkOut(requireEmployeeProfile(req));
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Check-out recorded', record));
});

export const getAttendances = catchAsync(async (req: Request, res: Response) => {
  const options = attendanceService.buildListOptions(req.query);
  const result = await attendanceService.listAttendances(options);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Attendance records fetched', result.items, result));
});

export const getAttendance = catchAsync(async (req: Request, res: Response) => {
  const record = await attendanceService.getAttendanceById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Attendance fetched', record));
});

export const getMyAttendance = catchAsync(async (req: Request, res: Response) => {
  const { from, to, limit } = req.query as { from?: string; to?: string; limit?: string };
  const records = await attendanceService.getMyRecent(
    requireEmployeeProfile(req),
    from,
    to,
    limit ? parseInt(limit, 10) : 30,
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'My attendance fetched', records));
});

export const getTodaySessions = catchAsync(async (req: Request, res: Response) => {
  const result = await attendanceService.getTodaySessions(requireEmployeeProfile(req));
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Today sessions fetched', result));
});

export const getMyStats = catchAsync(async (req: Request, res: Response) => {
  const result = await attendanceService.getMyStats(requireEmployeeProfile(req));
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'My stats fetched', result));
});

export const getMyHistory = catchAsync(async (req: Request, res: Response) => {
  const { from, to, status, locationType } = req.query as {
    from?: string;
    to?: string;
    status?: string;
    locationType?: string;
  };
  const records = await attendanceService.getMyHistory(requireEmployeeProfile(req), {
    from,
    to,
    status,
    locationType,
  });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'My history fetched', records));
});

export const updateAttendance = catchAsync(async (req: Request, res: Response) => {
  const record = await attendanceService.updateAttendance(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Attendance updated', record));
});

export const deleteAttendance = catchAsync(async (req: Request, res: Response) => {
  await attendanceService.deleteAttendance(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Attendance record deleted'));
});
