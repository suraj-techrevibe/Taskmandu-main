import type { FilterQuery } from 'mongoose';
import { Offboarding, type Offboarding as OffboardingDoc } from './offboarding.model';
import { Employee } from '../employee/employee.model';
import { User } from '../auth/auth.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import type { Lean } from '../../types/lean';
import type { ClearanceStatus } from '../../types';

export interface ListOffboardingsOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  isCompleted?: boolean;
  employeeId?: string;
}

function buildFilter(options: ListOffboardingsOptions): FilterQuery<OffboardingDoc> {
  const filter: FilterQuery<OffboardingDoc> = {};

  if (options.isCompleted !== undefined) {
    filter.isCompleted = options.isCompleted;
  }
  if (options.employeeId) {
    filter.employeeId = options.employeeId;
  }

  return filter;
}

export async function listOffboardings(
  options: ListOffboardingsOptions,
): Promise<PaginatedResult<Lean<Offboarding>>> {
  const filter = buildFilter(options);

  const [items, totalItems] = await Promise.all([
    Offboarding.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Offboarding.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getOffboardingById(id: string): Promise<Lean<Offboarding>> {
  const offboarding = await Offboarding.findById(id).lean();
  if (!offboarding) {
    throw ApiError.notFound('Offboarding profile not found');
  }
  return offboarding;
}

export async function createOffboarding(
  data: Record<string, unknown>,
): Promise<Lean<Offboarding>> {
  const employeeId = data.employeeId as string;
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw ApiError.badRequest('Referenced employee does not exist');
  }

  const existing = await Offboarding.exists({ employeeId });
  if (existing) {
    throw ApiError.conflict('An offboarding profile already exists for this employee');
  }

  const offboarding = await Offboarding.create(data);
  return offboarding.toObject();
}

export async function updateOffboarding(
  id: string,
  data: Record<string, unknown>,
): Promise<Lean<Offboarding>> {
  const offboarding = await Offboarding.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!offboarding) {
    throw ApiError.notFound('Offboarding profile not found');
  }
  return offboarding;
}

export async function updateClearance(
  id: string,
  department: 'hr' | 'finance' | 'it' | 'operations',
  status: ClearanceStatus,
): Promise<Lean<Offboarding>> {
  const offboarding = await Offboarding.findById(id);
  if (!offboarding) {
    throw ApiError.notFound('Offboarding profile not found');
  }

  offboarding.clearanceStatus[department] = status;

  const allApproved = Object.values(offboarding.clearanceStatus).every((s) => s === 'Approved');
  if (allApproved && offboarding.currentStep < 1) {
    offboarding.currentStep = 1;
  }
  await offboarding.save();

  return offboarding.toObject();
}

export async function archiveEmployee(id: string): Promise<{ employee: Lean<Employee> }> {
  const offboarding = await Offboarding.findById(id);
  if (!offboarding) {
    throw ApiError.notFound('Offboarding profile not found');
  }

  const employee = await Employee.findById(offboarding.employeeId);
  if (!employee) {
    throw ApiError.notFound('Linked employee not found');
  }

  employee.status = 'Archived';
  await employee.save();

  offboarding.isCompleted = true;
  offboarding.currentStep = 4;
  await offboarding.save();

  // Deactivate the linked user account if one exists
  await User.updateOne(
    { employeeId: employee._id.toString() },
    { isActive: false, $unset: { refreshToken: 1 } },
  );

  return { employee: employee.toObject() };
}

export async function deleteOffboarding(id: string): Promise<void> {
  const result = await Offboarding.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Offboarding profile not found');
  }
}

export function buildListOptions(query: Record<string, unknown>): ListOffboardingsOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    isCompleted:
      query.isCompleted === 'true' ? true : query.isCompleted === 'false' ? false : undefined,
    employeeId: query.employeeId as string | undefined,
  };
}
