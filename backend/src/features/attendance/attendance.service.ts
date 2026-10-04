import type { FilterQuery } from 'mongoose';
import { Attendance, type Attendance as AttendanceDoc } from './attendance.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import type { Lean } from '../../types/lean';

export const LATE_GRACE_MINUTES = 15;
export const STANDARD_SHIFT_START_HOUR = 8;

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function deriveStatus(checkInTime: Date): 'Present' | 'Late' {
  const isLate =
    checkInTime.getUTCHours() > STANDARD_SHIFT_START_HOUR ||
    (checkInTime.getUTCHours() === STANDARD_SHIFT_START_HOUR &&
      checkInTime.getUTCMinutes() > LATE_GRACE_MINUTES);
  return isLate ? 'Late' : 'Present';
}

export async function checkIn(
  employeeId: string,
  data: { locationType?: 'Onsite' | 'WFH' },
): Promise<Lean<Attendance>> {
  const now = new Date();
  const date = toDateString(now);

  // Check if there's an active (unchecked-out) session for today
  const activeSession = await Attendance.findOne({ employeeId, date, checkOutTime: null }).sort({ checkInTime: -1 });
  if (activeSession) {
    throw ApiError.conflict('You are already checked in. Please check out first before checking in again.');
  }

  const attendance = await Attendance.create({
    employeeId,
    checkInTime: now,
    locationType: data.locationType ?? 'Onsite',
    date,
    status: deriveStatus(now),
    workingHours: 0,
  });

  return attendance.toObject();
}

export async function checkOut(
  employeeId: string,
): Promise<Lean<Attendance>> {
  const date = toDateString(new Date());

  // Find the latest unchecked-out session for today
  const attendance = await Attendance.findOne({ employeeId, date, checkOutTime: null }).sort({ checkInTime: -1 });
  if (!attendance) {
    throw ApiError.notFound('No active check-in session found for today. Please check in first.');
  }

  const checkOutTime = new Date();
  const workingHours = Math.abs(checkOutTime.getTime() - attendance.checkInTime.getTime()) / 36e5;

  attendance.checkOutTime = checkOutTime;
  attendance.workingHours = Math.round(workingHours * 100) / 100;

  await attendance.save();
  return attendance.toObject();
}

export async function getTodaySessions(employeeId: string): Promise<{
  sessions: Lean<Attendance>[];
  totalWorkingHours: number;
  activeSession: Lean<Attendance> | null;
}> {
  const date = toDateString(new Date());
  const sessions = await Attendance.find({ employeeId, date }).sort({ checkInTime: 1 }).lean();

  const totalWorkingHours = sessions.reduce((sum, s) => sum + (s.workingHours || 0), 0);
  const activeSession = sessions.find(s => !s.checkOutTime) ?? null;

  return {
    sessions,
    totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
    activeSession,
  };
}

export interface ListAttendancesOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  employeeId?: string;
  date?: string;
  from?: string;
  to?: string;
  status?: string;
}

function buildFilter(options: ListAttendancesOptions): FilterQuery<AttendanceDoc> {
  const filter: FilterQuery<AttendanceDoc> = {};
  const today = new Date().toISOString().slice(0, 10);

  if (options.employeeId) {
    filter.employeeId = options.employeeId;
  }
  if (options.date) {
    // No future-dated records are ever returned.
    filter.date = options.date <= today ? options.date : { $gt: today };
  } else if (options.from || options.to) {
    filter.date = {};
    if (options.from) filter.date.$gte = options.from;
    filter.date.$lte = options.to && options.to < today ? options.to : today;
  } else {
    filter.date = { $lte: today };
  }
  if (options.status) {
    filter.status = options.status;
  }

  return filter;
}

export async function listAttendances(
  options: ListAttendancesOptions,
): Promise<PaginatedResult<Lean<Attendance>>> {
  const filter = buildFilter(options);

  const [items, totalItems] = await Promise.all([
    Attendance.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Attendance.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getAttendanceById(id: string): Promise<Lean<Attendance>> {
  const attendance = await Attendance.findById(id).lean();
  if (!attendance) {
    throw ApiError.notFound('Attendance record not found');
  }
  return attendance;
}

export async function getMyRecent(employeeId: string, from?: string, to?: string, limit = 30) {
  const filter: FilterQuery<AttendanceDoc> = { employeeId };
  const today = new Date().toISOString().slice(0, 10);
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    filter.date.$lte = to && to < today ? to : today;
  } else {
    filter.date = { $lte: today };
  }

  return Attendance.find(filter).sort({ date: -1 }).limit(limit).lean();
}

export interface MyStats {
  totalWorkHours: number;
  totalShifts: number;
  lateCount: number;
  attendancePercentage: number;
}

export async function getMyStats(employeeId: string): Promise<MyStats> {
  const result = await Attendance.aggregate<MyStats>([
    { $match: { employeeId } },
    {
      $group: {
        _id: null,
        totalWorkHours: { $sum: { $ifNull: ['$workingHours', 0] } },
        totalShifts: { $sum: 1 },
        lateCount: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
        leaveCount: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        totalWorkHours: { $round: ['$totalWorkHours', 2] },
        totalShifts: 1,
        lateCount: 1,
        attendancePercentage: {
          $cond: [
            { $eq: ['$totalShifts', 0] },
            0,
            {
              $round: [
                {
                  $multiply: [
                    { $divide: [{ $subtract: ['$totalShifts', '$leaveCount'] }, '$totalShifts'] },
                    100,
                  ],
                },
                0,
              ],
            },
          ],
        },
      },
    },
  ]);

  return result[0] ?? { totalWorkHours: 0, totalShifts: 0, lateCount: 0, attendancePercentage: 0 };
}

export interface MyHistoryOptions {
  from?: string;
  to?: string;
  status?: string;
  locationType?: string;
}

export async function getMyHistory(employeeId: string, options: MyHistoryOptions = {}): Promise<Lean<Attendance>[]> {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const currentMonthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const currentMonthEnd = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const filter: FilterQuery<AttendanceDoc> = { employeeId };

  const fromDate = options.from || currentMonthStart;
  const toDate = options.to && options.to < today ? options.to : currentMonthEnd;

  filter.date = { $gte: fromDate, $lte: toDate };

  if (options.status) {
    filter.status = options.status;
  }
  if (options.locationType) {
    filter.locationType = options.locationType;
  }

  return Attendance.find(filter).sort({ date: -1, checkInTime: -1 }).lean();
}

export async function updateAttendance(
  id: string,
  data: Record<string, unknown>,
): Promise<Lean<Attendance>> {
  const attendance = await Attendance.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!attendance) {
    throw ApiError.notFound('Attendance record not found');
  }
  return attendance;
}

export async function deleteAttendance(id: string): Promise<void> {
  const result = await Attendance.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Attendance record not found');
  }
}

export function buildListOptions(query: Record<string, unknown>): ListAttendancesOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    employeeId: query.employeeId as string | undefined,
    date: query.date as string | undefined,
    from: query.from as string | undefined,
    to: query.to as string | undefined,
    status: query.status as string | undefined,
  };
}
