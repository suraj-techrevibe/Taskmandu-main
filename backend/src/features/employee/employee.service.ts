import type { FilterQuery } from 'mongoose';
import { Employee, type Employee as EmployeeDoc } from './employee.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import type { Lean } from '../../types/lean';

export interface ListEmployeesOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  search?: string;
  department?: string;
  status?: string;
  employmentType?: string;
}

function buildFilter(options: ListEmployeesOptions): FilterQuery<EmployeeDoc> {
  const filter: FilterQuery<EmployeeDoc> = {};

  if (options.search) {
    filter.$text = { $search: options.search };
  }
  if (options.department) {
    filter.department = options.department;
  }
  if (options.status) {
    filter.status = options.status;
  }
  if (options.employmentType) {
    filter.employmentType = options.employmentType;
  }

  return filter;
}

export async function listEmployees(
  options: ListEmployeesOptions,
): Promise<PaginatedResult<Lean<Employee>>> {
  const filter = buildFilter(options);

  const [items, totalItems] = await Promise.all([
    Employee.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getEmployeeById(id: string): Promise<Lean<Employee>> {
  const employee = await Employee.findById(id).lean();
  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }
  return employee;
}

export async function createEmployee(
  data: Record<string, unknown>,
): Promise<Lean<Employee>> {
  const employee = await Employee.create(data);
  return employee.toObject();
}

export async function updateEmployee(
  id: string,
  data: Record<string, unknown>,
): Promise<Lean<Employee>> {
  const employee = await Employee.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }
  return employee;
}

export async function updateEmployeeStatus(
  id: string,
  status: string,
): Promise<Lean<Employee>> {
  return updateEmployee(id, { status });
}

export async function deleteEmployee(id: string): Promise<void> {
  const result = await Employee.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Employee not found');
  }
}

export async function getDepartments(): Promise<string[]> {
  return Employee.distinct('department');
}

export function buildListOptions(
  query: Record<string, unknown>,
): ListEmployeesOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    search: query.search as string | undefined,
    department: query.department as string | undefined,
    status: query.status as string | undefined,
    employmentType: query.employmentType as string | undefined,
  };
}
