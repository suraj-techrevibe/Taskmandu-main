import type { FilterQuery } from 'mongoose';
import { Leave, type Leave as LeaveDoc } from './leave.model';
import { Attendance } from '../attendance/attendance.model';
import { Roster } from '../roster/roster.model';
import { Employee } from '../employee/employee.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import type { Lean } from '../../types/lean';


export interface ListLeavesOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  status?: string;
  employeeId?: string;
  leaveType?: string;
  from?: string;
  to?: string;
}

function buildFilter(options: ListLeavesOptions): FilterQuery<LeaveDoc> {
  const filter: FilterQuery<LeaveDoc> = {};

  if (options.status) {
    filter.status = options.status;
  }
  if (options.employeeId) {
    filter.employeeId = options.employeeId;
  }
  if (options.leaveType) {
    filter.leaveType = options.leaveType;
  }
  if (options.from || options.to) {
    filter.$and = [];
    if (options.to) filter.$and.push({ startDate: { $lte: options.to } });
    if (options.from) filter.$and.push({ endDate: { $gte: options.from } });
  }

  return filter;
}

export async function listLeaves(
  options: ListLeavesOptions,
): Promise<PaginatedResult<Lean<Leave>>> {
  const filter = buildFilter(options);

  const [items, totalItems] = await Promise.all([
    Leave.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Leave.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getLeaveById(id: string): Promise<Lean<Leave>> {
  const leave = await Leave.findById(id).lean();
  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }
  return leave;
}

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export async function createLeave(
  data: {
    employeeId?: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    reason?: string;
  },
  actor: { id: string; name: string; employeeId?: string | null },
): Promise<Lean<Leave>> {
  let employeeId = data.employeeId ?? actor.employeeId ?? actor.id;
  let employeeName = actor.name;

  if (data.employeeId) {
    const employee = await Employee.findById(data.employeeId).lean();
    if (!employee) {
      throw ApiError.badRequest('Referenced employee does not exist');
    }
    employeeName = `${employee.firstName} ${employee.lastName}`;
  }

  const overlapping = await Leave.findOne({
    employeeId,
    status: { $ne: 'Rejected' },
    $and: [
      { startDate: { $lte: data.endDate } },
      { endDate: { $gte: data.startDate } },
    ],
  });
  if (overlapping) {
    throw ApiError.conflict('This employee already has a leave request overlapping these dates');
  }

  const leave = await Leave.create({
    employeeId,
    employeeName,
    startDate: data.startDate,
    endDate: data.endDate,
    leaveType: data.leaveType,
    reason: data.reason ?? '',
    status: 'Pending',
  });

  return leave.toObject();
}

export async function actionLeave(
  id: string,
  status: 'Approved' | 'Rejected',
  notes: string,
  actor: { id: string; name: string },
): Promise<Lean<Leave>> {
  const leave = await Leave.findById(id);
  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }
  if (leave.status !== 'Pending') {
    throw ApiError.conflict(`This request has already been ${leave.status.toLowerCase()}`);
  }

  leave.status = status;
  leave.managerNotes = notes;
  leave.actionedAt = new Date();
  leave.actionedById = actor.id;
  await leave.save();

  if (status === 'Approved') {
    const dateRange = getDatesInRange(leave.startDate, leave.endDate);

    // 1. Mark attendance as Leave for the affected dates
    for (const date of dateRange) {
      const existing = await Attendance.findOne({ employeeId: leave.employeeId, date });
      if (existing) {
        if (existing.status !== 'Leave') {
          existing.status = 'Leave';
          await existing.save();
        }
      } else {
        await Attendance.create({
          employeeId: leave.employeeId,
          checkInTime: new Date(`${date}T09:00:00Z`),
          date,
          status: 'Leave',
          workingHours: 0,
        });
      }
    }

    // 2. Remove employee from rosters during those dates
    await Roster.updateMany(
      { date: { $in: dateRange }, employeeIds: leave.employeeId },
      { $pull: { employeeIds: leave.employeeId } },
    );
  }

  return leave.toObject();
}

export async function updateLeave(
  id: string,
  data: Record<string, unknown>,
): Promise<Lean<Leave>> {
  const leave = await Leave.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }
  return leave;
}

export async function deleteLeave(id: string): Promise<void> {
  const result = await Leave.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Leave request not found');
  }
}

export async function getMyLeaves(
  employeeId: string,
  status?: string,
  limit = 50,
): Promise<Lean<Leave>[]> {
  const filter: FilterQuery<LeaveDoc> = { employeeId };
  if (status) {
    filter.status = status;
  }
  return Leave.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
}

export function buildListOptions(query: Record<string, unknown>): ListLeavesOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    status: query.status as string | undefined,
    employeeId: query.employeeId as string | undefined,
    leaveType: query.leaveType as string | undefined,
    from: query.from as string | undefined,
    to: query.to as string | undefined,
  };
}
