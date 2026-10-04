import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as onboardingService from './onboarding.service';

export const createOnboarding = catchAsync(async (req: Request, res: Response) => {
  const onboarding = await onboardingService.createOnboarding(req.body);
  res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, 'Onboarding profile created', onboarding));
});

export const getOnboardings = catchAsync(async (req: Request, res: Response) => {
  const options = onboardingService.buildListOptions(req.query);
  const result = await onboardingService.listOnboardings(options);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Onboarding profiles fetched', result.items, result));
});

export const getOnboarding = catchAsync(async (req: Request, res: Response) => {
  const onboarding = await onboardingService.getOnboardingById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Onboarding profile fetched', onboarding));
});

export const updateOnboarding = catchAsync(async (req: Request, res: Response) => {
  const onboarding = await onboardingService.updateOnboarding(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Onboarding profile updated', onboarding));
});

export const advanceStep = catchAsync(async (req: Request, res: Response) => {
  const onboarding = await onboardingService.advanceOnboardingStep(
    req.params.id,
    (req.body as { step: number }).step,
  );
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Onboarding step updated', onboarding));
});

export const activateOnboarding = catchAsync(async (req: Request, res: Response) => {
  const result = await onboardingService.activateOnboarding(req.params.id);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Decision email sent to candidate', result));
});

export const getOnboardingDecision = catchAsync(async (req: Request, res: Response) => {
  const result = await onboardingService.getOnboardingDecisionByToken(req.params.token);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Onboarding decision fetched', result));
});

export const acceptOnboarding = catchAsync(async (req: Request, res: Response) => {
  const result = await onboardingService.acceptOnboarding(req.params.token, req.body.password);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Onboarding accepted. Your account is active.', result));
});

export const deleteOnboarding = catchAsync(async (req: Request, res: Response) => {
  await onboardingService.deleteOnboarding(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Onboarding profile deleted'));
});
