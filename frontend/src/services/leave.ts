import { apiGet, apiList, apiPatch, apiPost, unwrapItems } from './http';
import type { PaginatedResponse } from './http';
import type { LeaveRequest } from '../types';

export type LeaveStatus = LeaveRequest['status'];
export type LeaveType = LeaveRequest['leaveType'];

export interface CreateLeaveInput {
  employeeId?: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason?: string;
}

export interface LeaveDoc {
  _id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  actionedAt?: string | null;
  actionedById?: string | null;
  managerNotes?: string;
  createdAt?: string;
}

function mapLeave(doc: LeaveDoc): LeaveRequest {
  return {
    id: doc._id,
    employeeId: doc.employeeId,
    employeeName: doc.employeeName,
    startDate: doc.startDate,
    endDate: doc.endDate,
    leaveType: doc.leaveType,
    reason: doc.reason,
    status: doc.status,
    createdAt: doc.createdAt ?? new Date().toISOString(),
    actionedAt: doc.actionedAt ?? undefined,
    managerNotes: doc.managerNotes,
  };
}

export async function createLeave(input: CreateLeaveInput): Promise<LeaveRequest> {
  const res = await apiPost<LeaveDoc>('/leaves', input);
  return mapLeave(res);
}

export async function getMyLeaves(
  params: { status?: string; limit?: number } = {},
): Promise<LeaveRequest[]> {
  const query = new URLSearchParams();
  query.set('limit', String(params.limit ?? 50));
  if (params.status) query.set('status', params.status);
  const res = await apiGet<LeaveDoc[]>(`/leaves/my?${query.toString()}`);
  return res.map(mapLeave);
}

export async function listLeaves(
  params: { limit?: number; status?: string; employeeId?: string } = {},
): Promise<LeaveRequest[]> {
  const query = new URLSearchParams();
  query.set('limit', String(params.limit ?? 100));
  if (params.status) query.set('status', params.status);
  if (params.employeeId) query.set('employeeId', params.employeeId);
  const res = await apiGet<{ items: LeaveDoc[] }>(`/leaves?${query.toString()}`);
  return unwrapItems(res).map(mapLeave);
}

export async function actionLeave(
  id: string,
  status: 'Approved' | 'Rejected',
  notes = '',
): Promise<LeaveRequest> {
  const res = await apiPatch<LeaveDoc>(`/leaves/${id}/action`, { status, notes });
  return mapLeave(res);
}

export interface ListLeavePageParams {
  page?: number;
  limit?: number;
  status?: string;
  leaveType?: string;
  employeeId?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listLeavePage(
  params: ListLeavePageParams = {},
): Promise<PaginatedResponse<LeaveRequest>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  query.set('sortBy', params.sortBy ?? 'createdAt');
  query.set('sortOrder', params.sortOrder ?? 'desc');
  if (params.status) query.set('status', params.status);
  if (params.leaveType) query.set('leaveType', params.leaveType);
  if (params.employeeId) query.set('employeeId', params.employeeId);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const res = await apiList<LeaveDoc>(`/leaves?${query.toString()}`);
  return { items: res.items.map(mapLeave), pagination: res.pagination };
}
