import { apiGet, apiList, apiPost, unwrapItems } from './http';
import type { PaginatedResponse } from './http';
import type { Attendance } from '../types';

export interface CheckInInput {
  locationType: 'Onsite' | 'WFH';
}

export interface CheckOutInput {}

export interface AttendanceDoc {
  _id: string;
  employeeId: string;
  checkInTime: string;
  locationType: 'Onsite' | 'WFH';
  checkOutTime?: string | null;
  date: string;
  status: Attendance['status'];
  workingHours?: number;
}

export interface TodaySessionsResponse {
  sessions: AttendanceDoc[];
  totalWorkingHours: number;
  activeSession: AttendanceDoc | null;
}

function mapAttendance(doc: AttendanceDoc): Attendance {
  return {
    id: doc._id,
    employeeId: doc.employeeId,
    checkInTime: doc.checkInTime,
    locationType: doc.locationType ?? 'Onsite',
    checkOutTime: doc.checkOutTime ?? undefined,
    date: doc.date,
    status: doc.status,
    workingHours: doc.workingHours,
  };
}

export async function checkIn(input: CheckInInput): Promise<Attendance> {
  const res = await apiPost<AttendanceDoc>('/attendance/check-in', input);
  return mapAttendance(res);
}

export async function checkOut(input: CheckOutInput = {}): Promise<Attendance> {
  const res = await apiPost<AttendanceDoc>('/attendance/check-out', input);
  return mapAttendance(res);
}

export async function getMyAttendance(
  params: { from?: string; to?: string; limit?: number } = {},
): Promise<Attendance[]> {
  const query = new URLSearchParams();
  query.set('limit', String(params.limit ?? 30));
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const res = await apiGet<AttendanceDoc[]>(`/attendance/my?${query.toString()}`);
  return res.map(mapAttendance);
}

export async function getTodaySessions(): Promise<{
  sessions: Attendance[];
  totalWorkingHours: number;
  activeSession: Attendance | null;
}> {
  const res = await apiGet<TodaySessionsResponse>('/attendance/today-sessions');
  return {
    sessions: res.sessions.map(mapAttendance),
    totalWorkingHours: res.totalWorkingHours,
    activeSession: res.activeSession ? mapAttendance(res.activeSession) : null,
  };
}

export async function listAttendances(
  params: { limit?: number; date?: string; from?: string; to?: string; status?: string } = {},
): Promise<Attendance[]> {
  const query = new URLSearchParams();
  query.set('limit', String(params.limit ?? 100));
  query.set('sortBy', 'date');
  query.set('sortOrder', 'desc');
  if (params.date) query.set('date', params.date);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.status) query.set('status', params.status);
  const res = await apiGet<AttendanceDoc[]>(`/attendance?${query.toString()}`);
  return unwrapItems(res).map(mapAttendance);
}

export interface MyStats {
  totalWorkHours: number;
  totalShifts: number;
  lateCount: number;
  attendancePercentage: number;
}

export async function getMyStats(): Promise<MyStats> {
  return apiGet<MyStats>('/attendance/my-stats');
}

export interface MyHistoryParams {
  from?: string;
  to?: string;
  status?: string;
  locationType?: string;
}

export async function getMyHistory(params: MyHistoryParams = {}): Promise<Attendance[]> {
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.status) query.set('status', params.status);
  if (params.locationType) query.set('locationType', params.locationType);
  const qs = query.toString();
  const res = await apiGet<AttendanceDoc[]>(`/attendance/my-history${qs ? `?${qs}` : ''}`);
  return Array.isArray(res) ? res.map(mapAttendance) : [];
}

export interface ListAttendancePageParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listAttendancePage(
  params: ListAttendancePageParams = {},
): Promise<PaginatedResponse<Attendance>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));
  query.set('sortBy', params.sortBy ?? 'date');
  query.set('sortOrder', params.sortOrder ?? 'desc');
  if (params.employeeId) query.set('employeeId', params.employeeId);
  if (params.status) query.set('status', params.status);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const res = await apiList<AttendanceDoc>(`/attendance?${query.toString()}`);
  return { items: res.items.map(mapAttendance), pagination: res.pagination };
}
