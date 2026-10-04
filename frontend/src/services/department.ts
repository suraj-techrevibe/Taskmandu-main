import { apiDelete, apiGet, apiPatch, apiPost } from './http';
import type { Department } from '../types';

export interface DepartmentDoc extends Omit<Department, 'id'> {
  _id: string;
}

export async function listDepartments(): Promise<Department[]> {
  const res = await apiGet<{ departments: DepartmentDoc[] }>(`/departments?limit=100`);
  return res.departments.map((d) => ({ ...d, id: d._id }));
}

export async function createDepartment(data: {
  name: string;
  description?: string;
  headEmployeeId?: string | null;
  isActive?: boolean;
}): Promise<Department> {
  const res = await apiPost<DepartmentDoc>(`/departments`, data);
  return { ...res, id: res._id };
}

export async function updateDepartment(
  id: string,
  data: { name?: string; description?: string; headEmployeeId?: string | null; isActive?: boolean },
): Promise<Department> {
  const res = await apiPatch<DepartmentDoc>(`/departments/${id}`, data);
  return { ...res, id: res._id };
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiDelete(`/departments/${id}`);
}
