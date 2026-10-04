import { apiGet, apiPatch, unwrapItems } from './http';
import type { Employee } from '../types';

export interface EmployeeDoc extends Omit<Employee, 'id'> {
  _id: string;
}

export async function listEmployees(limit = 100): Promise<Employee[]> {
  const res = await apiGet<EmployeeDoc[]>(`/employees?limit=${limit}`);
  return unwrapItems<EmployeeDoc>(res).map((emp) => ({ ...emp, id: emp._id }));
}

export async function getEmployee(id: string): Promise<Employee> {
  const res = await apiGet<EmployeeDoc>(`/employees/${id}`);
  return { ...res, id: res._id };
}

export async function updateEmployee(id: string, patch: Partial<Employee>): Promise<Employee> {
  const res = await apiPatch<EmployeeDoc>(`/employees/${id}`, patch);
  return { ...res, id: res._id };
}
