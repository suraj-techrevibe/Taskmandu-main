import { apiDelete, apiGet, apiList, apiPatch, apiPost, unwrapItems } from './http';
import type { PaginatedResponse } from './http';
import type { Job, JobApplication, UpcomingInterview } from '../types';

export interface JobDoc extends Omit<Job, 'id'> {
  _id: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
}

export interface JobApplicationDoc extends Omit<JobApplication, 'id'> {
  _id: string;
  resumeUrl?: string | null;
  jobId?: string | null;
}

export interface UpcomingInterviewDoc extends Omit<UpcomingInterview, 'id'> {
  _id: string;
  meetingLink?: string | null;
  jobId?: string | null;
}

function mapJob(doc: JobDoc): Job {
  const { _id, salaryMin, salaryMax, ...rest } = doc;
  return { ...rest, id: _id, salaryMin: salaryMin ?? undefined, salaryMax: salaryMax ?? undefined };
}

function mapApplication(doc: JobApplicationDoc): JobApplication {
  const { _id, resumeUrl, jobId, ...rest } = doc;
  return { ...rest, id: _id, resumeUrl: resumeUrl ?? undefined, jobId: jobId ?? undefined };
}

function mapInterview(doc: UpcomingInterviewDoc): UpcomingInterview {
  const { _id, meetingLink, jobId, ...rest } = doc;
  return { ...rest, id: _id, meetingLink: meetingLink ?? undefined, jobId: jobId ?? undefined };
}

// ---------- Jobs ----------

export async function listJobs(limit = 100): Promise<Job[]> {
  const res = await apiGet<{ items: JobDoc[] }>(`/recruitment/jobs?limit=${limit}`);
  return unwrapItems(res).map(mapJob);
}

export async function createJob(input: Omit<Job, 'id'>): Promise<Job> {
  const res = await apiPost<JobDoc>('/recruitment/jobs', input);
  return mapJob(res);
}

export async function updateJob(id: string, patch: Partial<Omit<Job, 'id'>>): Promise<Job> {
  const res = await apiPatch<JobDoc>(`/recruitment/jobs/${id}`, patch);
  return mapJob(res);
}

export async function deleteJob(id: string): Promise<void> {
  await apiDelete<void>(`/recruitment/jobs/${id}`);
}

export interface ListJobPageParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  department?: string;
  employmentType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listJobPage(params: ListJobPageParams = {}): Promise<PaginatedResponse<Job>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  query.set('sortBy', params.sortBy ?? 'createdAt');
  query.set('sortOrder', params.sortOrder ?? 'desc');
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.department) query.set('department', params.department);
  if (params.employmentType) query.set('employmentType', params.employmentType);
  const res = await apiList<JobDoc>(`/recruitment/jobs?${query.toString()}`);
  return { items: res.items.map(mapJob), pagination: res.pagination };
}

// ---------- Job Applications ----------

export async function listApplications(limit = 100): Promise<JobApplication[]> {
  const res = await apiGet<{ items: JobApplicationDoc[] }>(`/recruitment?limit=${limit}`);
  return unwrapItems(res).map(mapApplication);
}

export async function createApplication(input: Omit<JobApplication, 'id'>): Promise<JobApplication> {
  const res = await apiPost<JobApplicationDoc>('/recruitment', input);
  return mapApplication(res);
}

export async function updateApplication(
  id: string,
  patch: Partial<Omit<JobApplication, 'id'>>,
): Promise<JobApplication> {
  const res = await apiPatch<JobApplicationDoc>(`/recruitment/${id}`, patch);
  return mapApplication(res);
}

export async function deleteApplication(id: string): Promise<void> {
  await apiDelete<void>(`/recruitment/${id}`);
}

export interface ListApplicationPageParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  source?: string;
  jobId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listApplicationPage(
  params: ListApplicationPageParams = {},
): Promise<PaginatedResponse<JobApplication>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  query.set('sortBy', params.sortBy ?? 'appliedDate');
  query.set('sortOrder', params.sortOrder ?? 'desc');
  if (params.search) query.set('search', params.search);
  if (params.stage) query.set('stage', params.stage);
  if (params.source) query.set('source', params.source);
  if (params.jobId) query.set('jobId', params.jobId);
  const res = await apiList<JobApplicationDoc>(`/recruitment?${query.toString()}`);
  return { items: res.items.map(mapApplication), pagination: res.pagination };
}

// ---------- Upcoming Interviews ----------

export async function listInterviews(limit = 100): Promise<UpcomingInterview[]> {
  const res = await apiGet<{ items: UpcomingInterviewDoc[] }>(`/recruitment/interviews?limit=${limit}`);
  return unwrapItems(res).map(mapInterview);
}

export async function createInterview(input: Omit<UpcomingInterview, 'id'>): Promise<UpcomingInterview> {
  const res = await apiPost<UpcomingInterviewDoc>('/recruitment/interviews', input);
  return mapInterview(res);
}

export async function updateInterview(
  id: string,
  patch: Partial<Omit<UpcomingInterview, 'id'>>,
): Promise<UpcomingInterview> {
  const res = await apiPatch<UpcomingInterviewDoc>(`/recruitment/interviews/${id}`, patch);
  return mapInterview(res);
}

export async function deleteInterview(id: string): Promise<void> {
  await apiDelete<void>(`/recruitment/interviews/${id}`);
}

export interface ListInterviewPageParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  from?: string;
  to?: string;
  jobId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listInterviewPage(
  params: ListInterviewPageParams = {},
): Promise<PaginatedResponse<UpcomingInterview>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  query.set('sortBy', params.sortBy ?? 'date');
  query.set('sortOrder', params.sortOrder ?? 'asc');
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.jobId) query.set('jobId', params.jobId);
  const res = await apiList<UpcomingInterviewDoc>(`/recruitment/interviews?${query.toString()}`);
  return { items: res.items.map(mapInterview), pagination: res.pagination };
}
