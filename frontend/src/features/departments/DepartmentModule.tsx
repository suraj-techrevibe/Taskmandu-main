import { useCallback, useEffect, useState } from 'react';
import { Building2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '../../services/department';
import type { Department } from '../../types';
import { toast } from '../../services/toast';

interface DepartmentModuleProps {
  canManage: boolean;
}

interface DepartmentForm {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: DepartmentForm = { name: '', description: '', isActive: true };

export default function DepartmentModule({ canManage }: DepartmentModuleProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<DepartmentForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const records = await listDepartments();
      setDepartments(records);
    } catch {
      // Global error toast handles messaging
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) {
      toast.error('Department name is required');
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await updateDepartment(form.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          isActive: form.isActive,
        });
        toast.success(`Department "${form.name}" updated`);
      } else {
        await createDepartment({
          name: form.name.trim(),
          description: form.description.trim(),
          isActive: form.isActive,
        });
        toast.success(`Department "${form.name}" created`);
      }
      setForm(null);
      void load();
    } catch {
      // Global error toast handles messaging
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!window.confirm(`Delete department "${dept.name}"?`)) return;
    setDeletingId(dept.id);
    try {
      await deleteDepartment(dept.id);
      toast.success(`Department "${dept.name}" deleted`);
      void load();
    } catch {
      // Global error toast handles messaging
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = departments.filter((d) => d.isActive).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Departments
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage the departments used across employee profiles, rosters and onboarding.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setForm({ ...EMPTY_FORM })}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{departments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Inactive</p>
          <p className="text-2xl font-bold text-rose-500 mt-1">{departments.length - activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Employees</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {departments.reduce((sum, d) => sum + (d.employeeCount ?? 0), 0)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center">Employees</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                {canManage && <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mx-auto" />
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-xs text-gray-400">
                    No departments found. Add your first department to get started.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{dept.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {dept.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      {dept.employeeCount ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          dept.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${dept.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setForm({
                                id: dept.id,
                                name: dept.name,
                                description: dept.description ?? '',
                                isActive: dept.isActive,
                              })
                            }
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(dept)}
                            disabled={deletingId === dept.id}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === dept.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                {form.id ? 'Edit Department' : 'Add Department'}
              </h2>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Department Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Engineering"
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="What does this department do?"
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
              Active (available in dropdowns)
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {form.id ? 'Save Changes' : 'Create Department'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
