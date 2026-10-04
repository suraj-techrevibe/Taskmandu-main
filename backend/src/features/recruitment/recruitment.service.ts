import type { FilterQuery } from 'mongoose';
import {
  Job,
  JobApplication,
  UpcomingInterview,
  type Job as JobDoc,
  type JobApplication as ApplicationDoc,
  type UpcomingInterview as InterviewDoc,
} from './recruitment.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import type { Lean } from '../../types/lean';

// ---------- Jobs ----------

export interface ListJobsOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  search?: string;
  status?: string;
  department?: string;
  employmentType?: string;
}

function buildJobFilter(options: ListJobsOptions): FilterQuery<JobDoc> {
  const filter: FilterQuery<JobDoc> = {};
  if (options.search) {
    filter.$or = [
      { title: { $regex: new RegExp(options.search, 'i') } },
      { department: { $regex: new RegExp(options.search, 'i') } },
      { location: { $regex: new RegExp(options.search, 'i') } },
    ];
  }
  if (options.status) {
    filter.status = options.status;
  }
  if (options.department) {
    filter.department = options.department;
  }
  if (options.employmentType) {
    filter.employmentType = options.employmentType;
  }
  return filter;
}

export async function listJobs(options: ListJobsOptions): Promise<PaginatedResult<Lean<JobDoc>>> {
  const filter = buildJobFilter(options);

  const [items, totalItems] = await Promise.all([
    Job.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return { items, totalItems, totalPages: Math.ceil(totalItems / options.limit), currentPage: options.page, limit: options.limit };
}

export async function getJobById(id: string): Promise<Lean<JobDoc>> {
  const job = await Job.findById(id).lean();
  if (!job) {
    throw ApiError.notFound('Job not found');
  }
  return job;
}

export async function createJob(data: Record<string, unknown>): Promise<Lean<JobDoc>> {
  const job = await Job.create(data);
  return job.toObject();
}

export async function updateJob(id: string, data: Record<string, unknown>): Promise<Lean<JobDoc>> {
  const job = await Job.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  if (!job) {
    throw ApiError.notFound('Job not found');
  }
  return job;
}

export async function deleteJob(id: string): Promise<void> {
  const result = await Job.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Job not found');
  }
  await Promise.all([
    JobApplication.updateMany({ jobId: id }, { $set: { jobId: null } }),
    UpcomingInterview.updateMany({ jobId: id }, { $set: { jobId: null } }),
  ]);
}

export function buildJobListOptions(query: Record<string, unknown>): ListJobsOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    search: query.search as string | undefined,
    status: query.status as string | undefined,
    department: query.department as string | undefined,
    employmentType: query.employmentType as string | undefined,
  };
}

async function resolveRoleFromJob(jobId: unknown): Promise<string | undefined> {
  if (typeof jobId !== 'string') return undefined;
  const job = await Job.findById(jobId);
  if (!job) {
    throw ApiError.badRequest('Referenced job does not exist');
  }
  return job.title;
}

// ---------- Job Applications ----------

export interface ListApplicationsOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  search?: string;
  stage?: string;
  roleApplied?: string;
  source?: string;
  jobId?: string;
}

function buildApplicationFilter(options: ListApplicationsOptions): FilterQuery<ApplicationDoc> {
  const filter: FilterQuery<ApplicationDoc> = {};

  if (options.search) {
    filter.$text = { $search: options.search };
  }
  if (options.stage) {
    filter.stage = options.stage;
  }
  if (options.roleApplied) {
    filter.roleApplied = options.roleApplied;
  }
  if (options.source) {
    filter.source = options.source;
  }
  if (options.jobId) {
    filter.jobId = options.jobId;
  }

  return filter;
}

export async function listApplications(
  options: ListApplicationsOptions,
): Promise<PaginatedResult<Lean<JobApplication>>> {
  const filter = buildApplicationFilter(options);

  const [items, totalItems] = await Promise.all([
    JobApplication.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    JobApplication.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getApplicationById(id: string): Promise<Lean<JobApplication>> {
  const application = await JobApplication.findById(id).lean();
  if (!application) {
    throw ApiError.notFound('Job application not found');
  }
  return application;
}

export async function createApplication(
  data: Record<string, unknown>,
): Promise<Lean<JobApplication>> {
  const jobId = data.jobId as string | null | undefined;
  if (jobId) {
    const role = await resolveRoleFromJob(jobId);
    if (role) data.roleApplied = role;
  }
  const application = await JobApplication.create(data);
  return application.toObject();
}

export async function updateApplication(
  id: string,
  data: Record<string, unknown>,
): Promise<Lean<JobApplication>> {
  const jobId = data.jobId as string | null | undefined;
  if (jobId) {
    const role = await resolveRoleFromJob(jobId);
    if (role) data.roleApplied = role;
  }
  const application = await JobApplication.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!application) {
    throw ApiError.notFound('Job application not found');
  }
  return application;
}

export async function updateApplicationStage(
  id: string,
  stage: string,
): Promise<Lean<JobApplication>> {
  return updateApplication(id, { stage });
}

export async function deleteApplication(id: string): Promise<void> {
  const result = await JobApplication.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Job application not found');
  }
  await UpcomingInterview.deleteMany({ applicationId: id });
}

// ---------- Upcoming Interviews ----------

export interface ListInterviewsOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  status?: string;
  from?: string;
  to?: string;
  applicationId?: string;
  jobId?: string;
  search?: string;
}

function buildInterviewFilter(options: ListInterviewsOptions): FilterQuery<InterviewDoc> {
  const filter: FilterQuery<InterviewDoc> = {};

  if (options.search) {
    filter.$or = [
      { candidateName: { $regex: new RegExp(options.search, 'i') } },
      { roleApplied: { $regex: new RegExp(options.search, 'i') } },
      { interviewers: { $regex: new RegExp(options.search, 'i') } },
    ];
  }
  if (options.status) {
    filter.status = options.status;
  }
  if (options.applicationId) {
    filter.applicationId = options.applicationId;
  }
  if (options.jobId) {
    filter.jobId = options.jobId;
  }
  if (options.from || options.to) {
    filter.interviewDate = {};
    if (options.from) filter.interviewDate.$gte = options.from;
    if (options.to) filter.interviewDate.$lte = options.to;
  }

  return filter;
}

export async function listInterviews(
  options: ListInterviewsOptions,
): Promise<PaginatedResult<Lean<UpcomingInterview>>> {
  const filter = buildInterviewFilter(options);

  const [items, totalItems] = await Promise.all([
    UpcomingInterview.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    UpcomingInterview.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getInterviewById(id: string): Promise<Lean<UpcomingInterview>> {
  const interview = await UpcomingInterview.findById(id).lean();
  if (!interview) {
    throw ApiError.notFound('Interview not found');
  }
  return interview;
}

export async function createInterview(
  data: Record<string, unknown>,
): Promise<Lean<UpcomingInterview>> {
  const applicationId = data.applicationId as string;
  const application = await JobApplication.findById(applicationId);
  if (!application) {
    throw ApiError.badRequest('Referenced job application does not exist');
  }

  data.jobId = application.jobId ?? null;
  const interview = await UpcomingInterview.create(data);
  return interview.toObject();
}

export async function updateInterview(
  id: string,
  data: Record<string, unknown>,
): Promise<Lean<UpcomingInterview>> {
  const interview = await UpcomingInterview.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!interview) {
    throw ApiError.notFound('Interview not found');
  }
  return interview;
}

export async function deleteInterview(id: string): Promise<void> {
  const result = await UpcomingInterview.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Interview not found');
  }
}

export function buildApplicationListOptions(query: Record<string, unknown>): ListApplicationsOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    search: query.search as string | undefined,
    stage: query.stage as string | undefined,
    roleApplied: query.roleApplied as string | undefined,
    source: query.source as string | undefined,
    jobId: query.jobId as string | undefined,
  };
}

export function buildInterviewListOptions(query: Record<string, unknown>): ListInterviewsOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    search: query.search as string | undefined,
    status: query.status as string | undefined,
    from: query.from as string | undefined,
    to: query.to as string | undefined,
    applicationId: query.applicationId as string | undefined,
    jobId: query.jobId as string | undefined,
  };
}
