import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as rosterService from './roster.service';

export const createRoster = catchAsync(async (req: Request, res: Response) => {
  const roster = await rosterService.createRoster(req.body);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Roster created', roster));
});

export const getRosters = catchAsync(async (req: Request, res: Response) => {
  const options = rosterService.buildListOptions(req.query);
  const result = await rosterService.listRosters(options);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Rosters fetched', result.items, result));
});

export const getRoster = catchAsync(async (req: Request, res: Response) => {
  const roster = await rosterService.getRosterById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Roster fetched', roster));
});

export const updateRoster = catchAsync(async (req: Request, res: Response) => {
  const roster = await rosterService.updateRoster(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Roster updated', roster));
});

export const deleteRoster = catchAsync(async (req: Request, res: Response) => {
  await rosterService.deleteRoster(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Roster deleted'));
});

export const copyRosters = catchAsync(async (req: Request, res: Response) => {
  const { sourceDate, targetDate, department } = req.body as {
    sourceDate: string;
    targetDate: string;
    department?: string;
  };
  const result = await rosterService.copyRosters(sourceDate, targetDate, department);
  res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, 'Rosters cloned to target date', result));
});
