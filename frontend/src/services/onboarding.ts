import { apiGet, apiList, apiPatch, apiPost, unwrapItems } from './http';
import type { PaginatedResponse } from './http';
import type { Employee, OnboardingDecision, OnboardingProfile } from '../types';
import type { EmployeeDoc } from './employee';

export interface OnboardingDoc extends Omit<OnboardingProfile, 'id'> {
  _id: string;
}

export type CreateOnboardingInput = Omit<OnboardingProfile, 'id' | 'currentStep' | 'isCompleted'>;

function mapOnboarding(doc: OnboardingDoc): OnboardingProfile {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id };
}

export async function listOnboardings(limit = 100): Promise<OnboardingProfile[]> {
  const res = await apiGet<{ items: OnboardingDoc[] }>(`/onboarding?limit=${limit}`);
  return unwrapItems(res).map(mapOnboarding);
}

export async function createOnboarding(input: CreateOnboardingInput): Promise<OnboardingProfile> {
  const res = await apiPost<OnboardingDoc>('/onboarding', input);
  return mapOnboarding(res);
}

export async function updateOnboarding(
  id: string,
  patch: Partial<OnboardingProfile>,
): Promise<OnboardingProfile> {
  const res = await apiPatch<OnboardingDoc>(`/onboarding/${id}`, patch);
  return mapOnboarding(res);
}

export async function activateOnboarding(
  id: string,
): Promise<{
  employee: Employee;
  accountCreated: boolean;
  emailSent: boolean;
  activationLink: string;
}> {
  const res = await apiPost<{
    employee: EmployeeDoc;
    accountCreated: boolean;
    emailSent: boolean;
    activationLink: string;
  }>(`/onboarding/${id}/activate`);
  return {
    employee: { ...res.employee, id: res.employee._id },
    accountCreated: Boolean(res.accountCreated),
    emailSent: Boolean(res.emailSent),
    activationLink: res.activationLink,
  };
}

export async function getOnboardingDecision(token: string): Promise<OnboardingDecision> {
  const res = await apiGet<OnboardingDecision>(`/onboarding/decision/${token}`, {
    skipErrorToast: true,
  });
  return res;
}

export async function acceptOnboardingDecision(
  token: string,
  password: string,
): Promise<{ email: string; name: string; role: string }> {
  const res = await apiPost<{ email: string; name: string; role: string }>(
    `/onboarding/decision/${token}/accept`,
    { password },
  );
  return res;
}

export interface ListOnboardingPageParams {
  page?: number;
  limit?: number;
  search?: string;
  isCompleted?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listOnboardingPage(
  params: ListOnboardingPageParams = {},
): Promise<PaginatedResponse<OnboardingProfile>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  query.set('sortBy', params.sortBy ?? 'createdAt');
  query.set('sortOrder', params.sortOrder ?? 'desc');
  if (params.search) query.set('search', params.search);
  if (params.isCompleted) query.set('isCompleted', params.isCompleted);
  if (params.department) query.set('department', params.department);
  const res = await apiList<OnboardingDoc>(`/onboarding?${query.toString()}`);
  return { items: res.items.map(mapOnboarding), pagination: res.pagination };
}
