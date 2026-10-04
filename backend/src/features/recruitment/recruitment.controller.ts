import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as recruitmentService from './recruitment.service';

// ---------- Jobs ----------
export const createJob = catchAsync(async (req: Request, res: Response) => {
  const job = await recruitmentService.createJob(req.body);
  res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, 'Job created', job));
});

export const getJobs = catchAsync(async (req: Request, res: Response) => {
  const options = recruitmentService.buildJobListOptions(req.query);
  const result = await recruitmentService.listJobs(options);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Jobs fetched', result.items, result));
});

export const getJob = catchAsync(async (req: Request, res: Response) => {
  const job = await recruitmentService.getJobById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Job fetched', job));
});

export const updateJob = catchAsync(async (req: Request, res: Response) => {
  const job = await recruitmentService.updateJob(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Job updated', job));
});

export const deleteJob = catchAsync(async (req: Request, res: Response) => {
  await recruitmentService.deleteJob(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Job deleted'));
});

// ---------- Job Applications ----------

export const createApplication = catchAsync(async (req: Request, res: Response) => {
  const application = await recruitmentService.createApplication(req.body);
  res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, 'Job application created', application));
});

export const getApplications = catchAsync(async (req: Request, res: Response) => {
  const options = recruitmentService.buildApplicationListOptions(req.query);
  const result = await recruitmentService.listApplications(options);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Job applications fetched', result.items, result));
});

export const getApplication = catchAsync(async (req: Request, res: Response) => {
  const application = await recruitmentService.getApplicationById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Job application fetched', application));
});

export const updateApplication = catchAsync(async (req: Request, res: Response) => {
  const application = await recruitmentService.updateApplication(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Job application updated', application));
});

export const updateApplicationStage = catchAsync(async (req: Request, res: Response) => {
  const application = await recruitmentService.updateApplicationStage(
    req.params.id,
    (req.body as { stage: string }).stage,
  );
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Job application stage updated', application));
});

export const deleteApplication = catchAsync(async (req: Request, res: Response) => {
  await recruitmentService.deleteApplication(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Job application deleted'));
});

// ---------- Upcoming Interviews ----------

export const createInterview = catchAsync(async (req: Request, res: Response) => {
  const interview = await recruitmentService.createInterview(req.body);
  res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, 'Interview scheduled', interview));
});

export const getInterviews = catchAsync(async (req: Request, res: Response) => {
  const options = recruitmentService.buildInterviewListOptions(req.query);
  const result = await recruitmentService.listInterviews(options);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Interviews fetched', result.items, result));
});

export const getInterview = catchAsync(async (req: Request, res: Response) => {
  const interview = await recruitmentService.getInterviewById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Interview fetched', interview));
});

export const updateInterview = catchAsync(async (req: Request, res: Response) => {
  const interview = await recruitmentService.updateInterview(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Interview updated', interview));
});

export const deleteInterview = catchAsync(async (req: Request, res: Response) => {
  await recruitmentService.deleteInterview(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Interview deleted'));
});
