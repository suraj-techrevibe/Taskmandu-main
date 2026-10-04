import type { FilterQuery } from 'mongoose';
import { Roster, type Roster as RosterDoc } from './roster.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import type { Lean } from '../../types/lean';

export interface ListRostersOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  date?: string;
  from?: string;
  to?: string;
  department?: string;
  shiftType?: string;
  employeeId?: string;
}

function buildFilter(options: ListRostersOptions): FilterQuery<RosterDoc> {
  const filter: FilterQuery<RosterDoc> = {};

  if (options.date) {
    filter.date = options.date;
  } else if (options.from || options.to) {
    filter.date = {};
    if (options.from) filter.date.$gte = options.from;
    if (options.to) filter.date.$lte = options.to;
  }
  if (options.department) {
    filter.department = options.department;
  }
  if (options.shiftType) {
    filter.shiftType = options.shiftType;
  }
  if (options.employeeId) {
    filter.employeeIds = options.employeeId;
  }

  return filter;
}

export async function listRosters(
  options: ListRostersOptions,
): Promise<PaginatedResult<Lean<Roster>>> {
  const filter = buildFilter(options);

  const [items, totalItems] = await Promise.all([
    Roster.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Roster.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getRosterById(id: string): Promise<Lean<Roster>> {
  const roster = await Roster.findById(id).lean();
  if (!roster) {
    throw ApiError.notFound('Roster not found');
  }
  return roster;
}

export async function createRoster(data: Record<string, unknown>): Promise<Lean<Roster>> {
  const roster = await Roster.create(data);
  return roster.toObject();
}

export async function updateRoster(
  id: string,
  data: Record<string, unknown>,
): Promise<Lean<Roster>> {
  const roster = await Roster.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!roster) {
    throw ApiError.notFound('Roster not found');
  }
  return roster;
}

export async function deleteRoster(id: string): Promise<void> {
  const result = await Roster.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Roster not found');
  }
}

export async function copyRosters(
  sourceDate: string,
  targetDate: string,
  department?: string,
): Promise<{ copied: number }> {
  const filter: FilterQuery<RosterDoc> = { date: sourceDate };
  if (department) {
    filter.department = department;
  }

  const sourceRosters = await Roster.find(filter).lean();
  if (sourceRosters.length === 0) {
    throw ApiError.notFound(`No rosters found for source date ${sourceDate}`);
  }

  const existing = await Roster.exists({ date: targetDate });
  if (existing) {
    throw ApiError.conflict(`Rosters already exist for target date ${targetDate}`);
  }

  const clones = sourceRosters.map((r) => ({
    employeeIds: r.employeeIds,
    department: r.department,
    shiftType: r.shiftType,
    startTime: r.startTime,
    endTime: r.endTime,
    location: r.location,
    date: targetDate,
    recurring: r.recurring,
  }));

  const inserted = await Roster.insertMany(clones);
  return { copied: inserted.length };
}

export function buildListOptions(query: Record<string, unknown>): ListRostersOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    date: query.date as string | undefined,
    from: query.from as string | undefined,
    to: query.to as string | undefined,
    department: query.department as string | undefined,
    shiftType: query.shiftType as string | undefined,
    employeeId: query.employeeId as string | undefined,
  };
}
