import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as notificationService from './notification.service';

export const createNotification = catchAsync(async (req: Request, res: Response) => {
  const notification = await notificationService.createNotification(req.body as {
    title: string;
    message: string;
    type: string;
    recipientId?: string | null;
  });
  res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, 'Notification created', notification));
});

export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const options = notificationService.buildListOptions(req.query, req.user!.id);
  const result = await notificationService.listNotifications(options);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Notifications fetched', result.items, result));
});

export const getNotification = catchAsync(async (req: Request, res: Response) => {
  const notification = await notificationService.getNotificationById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Notification fetched', notification));
});

export const markRead = catchAsync(async (req: Request, res: Response) => {
  const notification = await notificationService.markAsRead(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Notification marked as read', notification));
});

export const markAllRead = catchAsync(async (req: Request, res: Response) => {
  const result = await notificationService.markAllAsRead(req.user!.id);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'All notifications marked as read', result));
});

export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  await notificationService.deleteNotification(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Notification deleted'));
});

export const clearAll = catchAsync(async (req: Request, res: Response) => {
  const result = await notificationService.clearAll(req.user!.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Notifications cleared', result));
});
