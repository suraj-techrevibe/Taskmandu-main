import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as reportService from './report.service';
import type { ReportRange } from './report.service';

function extractRange(query: Request['query']): ReportRange {
  return {
    from: query.from as string | undefined,
    to: query.to as string | undefined,
    department: query.department as string | undefined,
  };
}

export const getAttendanceReport = catchAsync(async (req: Request, res: Response) => {
  const report = await reportService.getAttendanceReport(extractRange(req.query));
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Attendance report generated', report));
});

export const getTaskReport = catchAsync(async (req: Request, res: Response) => {
  const report = await reportService.getTaskReport(extractRange(req.query));
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Task productivity report generated', report));
});

export const getHrReport = catchAsync(async (req: Request, res: Response) => {
  const report = await reportService.getHrReport(extractRange(req.query));
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'HR lifecycle report generated', report));
});

export const exportReport = catchAsync(async (req: Request, res: Response) => {
  const { filename, csv } = await reportService.exportReportAsCsv(
    req.params.type as 'attendance' | 'tasks' | 'hr',
    extractRange(req.query),
  );

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});
