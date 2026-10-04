import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as chatService from './chat.service';

export const createGroup = catchAsync(async (req: Request, res: Response) => {
  const group = await chatService.createGroup(req.body, { id: req.user!.id, name: req.user!.name });
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Group created', group));
});

export const getGroups = catchAsync(async (req: Request, res: Response) => {
  const options = chatService.buildListOptions(req.query);
  const result = await chatService.listGroups(options);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Groups fetched', result.items, result));
});

export const getGroup = catchAsync(async (req: Request, res: Response) => {
  const group = await chatService.getGroupById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Group fetched', group));
});

export const updateGroup = catchAsync(async (req: Request, res: Response) => {
  const group = await chatService.updateGroup(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Group updated', group));
});

export const deleteGroup = catchAsync(async (req: Request, res: Response) => {
  await chatService.deleteGroup(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Group deleted'));
});

export const joinGroup = catchAsync(async (req: Request, res: Response) => {
  const group = await chatService.joinGroup(req.params.id, req.user!.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Joined group', group));
});

export const leaveGroup = catchAsync(async (req: Request, res: Response) => {
  const group = await chatService.leaveGroup(req.params.id, req.user!.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Left group', group));
});

export const getMessages = catchAsync(async (req: Request, res: Response) => {
  const options = chatService.buildMessageListOptions(req.query);
  const result = await chatService.listMessages(req.params.id, options);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Messages fetched', result.items, result));
});

export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const message = await chatService.sendMessage(
    req.params.id,
    req.body as { text: string; isNotice?: boolean },
    { id: req.user!.id, name: req.user!.name, role: req.user!.role },
  );
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Message sent', message));
});

export const editMessage = catchAsync(async (req: Request, res: Response) => {
  const message = await chatService.editMessage(
    req.params.messageId,
    req.body.text,
    { id: req.user!.id, role: req.user!.role },
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Message edited', message));
});

export const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  await chatService.deleteMessage(req.params.messageId, { id: req.user!.id, role: req.user!.role });
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Message deleted'));
});
