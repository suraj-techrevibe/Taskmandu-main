import type { FilterQuery } from 'mongoose';
import { Department, type Department as DepartmentDoc } from './department.model';
import { Employee } from '../employee/employee.model';
import { ApiError } from '../../utils/ApiError';
import type { Lean } from '../../types/lean';

export interface DepartmentWithEmployeeCount extends Lean<DepartmentDoc> {
  employeeCount: number;
}

export async function listDepartments(): Promise<DepartmentWithEmployeeCount[]> {
  const departments = await Department.find().sort({ name: 1 }).lean();

  const counts = await Employee.aggregate<{ _id: string; count: number }>([
    { $match: { status: { $ne: 'Archived' } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);
  const countByDept = new Map(counts.map((c) => [c._id, c.count]));

  return departments.map((d) => ({ ...d, employeeCount: countByDept.get(d.name) ?? 0 }));
}

export async function createDepartment(data: {
  name: string;
  description?: string;
  headEmployeeId?: string | null;
  isActive?: boolean;
}): Promise<Lean<DepartmentDoc>> {
  const existing = await Department.findOne({ name: { $regex: `^${data.name}$`, $options: 'i' } });
  if (existing) {
    throw ApiError.conflict(`Department '${data.name}' already exists`);
  }

  const department = await Department.create({
    name: data.name,
    description: data.description ?? '',
    headEmployeeId: data.headEmployeeId ?? null,
    isActive: data.isActive ?? true,
  });

  return department.toObject();
}

export async function updateDepartment(
  id: string,
  data: { name?: string; description?: string; headEmployeeId?: string | null; isActive?: boolean },
): Promise<Lean<DepartmentDoc>> {
  const department = await Department.findById(id);
  if (!department) {
    throw ApiError.notFound('Department not found');
  }

  if (data.name && data.name.toLowerCase() !== department.name.toLowerCase()) {
    const existing = await Department.findOne({
      name: { $regex: `^${data.name}$`, $options: 'i' },
      _id: { $ne: id },
    });
    if (existing) {
      throw ApiError.conflict(`Department '${data.name}' already exists`);
    }
  }

  if (data.name !== undefined) department.name = data.name;
  if (data.description !== undefined) department.description = data.description;
  if (data.headEmployeeId !== undefined) department.headEmployeeId = data.headEmployeeId;
  if (data.isActive !== undefined) department.isActive = data.isActive;
  await department.save();

  return department.toObject();
}

export async function deleteDepartment(id: string): Promise<void> {
  const department = await Department.findById(id);
  if (!department) {
    throw ApiError.notFound('Department not found');
  }

  const inUse = await Employee.countDocuments({ department: department.name });
  if (inUse > 0) {
    throw ApiError.conflict(
      `Department '${department.name}' has ${inUse} active employee(s). Reassign or archive them before deleting.`,
    );
  }

  await department.deleteOne();
}

export function buildDepartmentFilter(
  options: { search?: string; isActive?: boolean },
): FilterQuery<DepartmentDoc> {
  const filter: FilterQuery<DepartmentDoc> = {};
  if (options.search) {
    filter.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { description: { $regex: options.search, $options: 'i' } },
    ];
  }
  if (options.isActive !== undefined) {
    filter.isActive = options.isActive;
  }
  return filter;
}
