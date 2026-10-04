import { apiGet, apiList, apiPost, unwrapItems } from './http';
import type { PaginatedResponse } from './http';
import type { Roster } from '../types';

export interface RosterDoc extends Omit<Roster, 'id'> {
  _id: string;
}

export interface CreateRosterInput extends Omit<Roster, 'id'> {}

function mapRoster(doc: RosterDoc): Roster {
  return { ...doc, id: doc._id };
}

export async function listRosters(
  params: { limit?: number; from?: string; to?: string; date?: string; department?: string; shiftType?: string } = {},
): Promise<Roster[]> {
  const query = new URLSearchParams();
  query.set('limit', String(params.limit ?? 100));
  query.set('sortBy', 'date');
  query.set('sortOrder', 'asc');
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.date) query.set('date', params.date);
  if (params.department) query.set('department', params.department);
  if (params.shiftType) query.set('shiftType', params.shiftType);
  const res = await apiGet<{ items: RosterDoc[] }>(`/rosters?${query.toString()}`);
  return unwrapItems(res).map(mapRoster);
}

export async function createRoster(input: CreateRosterInput): Promise<Roster> {
  const res = await apiPost<RosterDoc>('/rosters', input);
  return mapRoster(res);
}

export async function copyRosters(
  sourceDate: string,
  targetDate: string,
  department?: string,
): Promise<{ copied: number }> {
  return apiPost<{ copied: number }>('/rosters/copy', { sourceDate, targetDate, department });
}

export interface ListRosterPageParams {
  page?: number;
  limit?: number;
  date?: string;
  from?: string;
  to?: string;
  department?: string;
  shiftType?: string;
  employeeId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listRosterPage(
  params: ListRosterPageParams = {},
): Promise<PaginatedResponse<Roster>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  query.set('sortBy', params.sortBy ?? 'date');
  query.set('sortOrder', params.sortOrder ?? 'asc');
  if (params.date) query.set('date', params.date);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.department) query.set('department', params.department);
  if (params.shiftType) query.set('shiftType', params.shiftType);
  if (params.employeeId) query.set('employeeId', params.employeeId);
  const res = await apiList<RosterDoc>(`/rosters?${query.toString()}`);
  return { items: res.items.map(mapRoster), pagination: res.pagination };
}
