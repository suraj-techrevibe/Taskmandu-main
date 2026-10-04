import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as noteService from './note.service';

export const createNote = catchAsync(async (req: Request, res: Response) => {
  const note = await noteService.createNote(req.body, { id: req.user!.id, name: req.user!.name });
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Note created', note));
});

export const getNotes = catchAsync(async (req: Request, res: Response) => {
  const options = noteService.buildListOptions(req.query);
  const result = await noteService.listNotes(options);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Notes fetched', result.items, result));
});

export const getNote = catchAsync(async (req: Request, res: Response) => {
  const note = await noteService.getNoteById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Note fetched', note));
});

export const updateNote = catchAsync(async (req: Request, res: Response) => {
  const note = await noteService.updateNote(req.params.id, req.body, {
    id: req.user!.id,
    role: req.user!.role,
  });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Note updated', note));
});

export const deleteNote = catchAsync(async (req: Request, res: Response) => {
  await noteService.deleteNote(req.params.id, {
    id: req.user!.id,
    role: req.user!.role,
  });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Note deleted'));
});
