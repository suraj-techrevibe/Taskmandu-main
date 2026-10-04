import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as invitationService from './invitation.service';

export const createInvitation = catchAsync(async (req: Request, res: Response) => {
  const result = await invitationService.createInvitation({
    employeeId: req.body.employeeId,
    role: req.body.role,
    invitedBy: req.user!.id,
    invitedByName: req.user!.name,
  });
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(StatusCodes.CREATED, `Invitation sent to ${result.invitation.email}`, {
        invitation: result.invitation,
        inviteLink: result.inviteLink,
        emailDelivered: result.emailDelivered,
      }),
    );
});

export const getInvitations = catchAsync(async (_req: Request, res: Response) => {
  const invitations = await invitationService.listInvitations();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Invitations fetched successfully', { invitations }));
});

export const cancelInvitation = catchAsync(async (req: Request, res: Response) => {
  await invitationService.cancelInvitation(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Invitation cancelled'));
});

export const getInvitationByToken = catchAsync(async (req: Request, res: Response) => {
  const invitation = await invitationService.getInvitationByToken(req.params.token);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Invitation fetched successfully', { invitation }));
});

export const acceptInvitation = catchAsync(async (req: Request, res: Response) => {
  const result = await invitationService.acceptInvitation(req.params.token, req.body.password);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Invitation accepted. Your account is ready. Please sign in.', result));
});

export const rejectInvitation = catchAsync(async (req: Request, res: Response) => {
  await invitationService.rejectInvitation(req.params.token);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Invitation declined'));
});
