import { apiGet, apiList, apiPatch, apiPost, unwrapItems } from './http';
import type { PaginatedResponse } from './http';
import type { Employee, OffboardingProfile } from '../types';
import type { EmployeeDoc } from './employee';

export interface OffboardingDoc extends Omit<OffboardingProfile, 'id'> {
  _id: string;
}

export type CreateOffboardingInput = Omit<OffboardingProfile, 'id' | 'currentStep' | 'isCompleted'>;

function mapOffboarding(doc: OffboardingDoc): OffboardingProfile {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id };
}

export async function listOffboardings(limit = 100): Promise<OffboardingProfile[]> {
  const res = await apiGet<{ items: OffboardingDoc[] }>(`/offboarding?limit=${limit}`);
  return unwrapItems(res).map(mapOffboarding);
}

export async function createOffboarding(input: CreateOffboardingInput): Promise<OffboardingProfile> {
  const res = await apiPost<OffboardingDoc>('/offboarding', input);
  return mapOffboarding(res);
}

export async function updateOffboarding(
  id: string,
  patch: Partial<OffboardingProfile>,
): Promise<OffboardingProfile> {
  const res = await apiPatch<OffboardingDoc>(`/offboarding/${id}`, patch);
  return mapOffboarding(res);
}

export async function archiveOffboarding(id: string): Promise<{ employee: Employee }> {
  const res = await apiPost<{ employee: EmployeeDoc }>(`/offboarding/${id}/archive`);
  return { employee: { ...res.employee, id: res.employee._id } };
}

export interface ListOffboardingPageParams {
  page?: number;
  limit?: number;
  isCompleted?: string;
  employeeId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listOffboardingPage(
  params: ListOffboardingPageParams = {},
): Promise<PaginatedResponse<OffboardingProfile>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  query.set('sortBy', params.sortBy ?? 'createdAt');
  query.set('sortOrder', params.sortOrder ?? 'desc');
  if (params.isCompleted) query.set('isCompleted', params.isCompleted);
  if (params.employeeId) query.set('employeeId', params.employeeId);
  const res = await apiList<OffboardingDoc>(`/offboarding?${query.toString()}`);
  return { items: res.items.map(mapOffboarding), pagination: res.pagination };
}
