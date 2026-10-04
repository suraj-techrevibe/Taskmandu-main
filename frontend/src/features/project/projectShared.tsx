import React from 'react';
import type { Task, Employee } from '../../types';
import type { ProjectDoc, ProjectMemberDoc } from '../../services/project';

export const TASK_STATUSES: Task['status'][] = [
  'Assigned',
  'Pending',
  'In Progress',
  'Blocked',
  'Completed',
  'Cancelled',
];

export const PRIORITIES: Task['priority'][] = ['Low', 'Medium', 'High', 'Critical'];

export const PROJECT_STATUSES: ProjectDoc['status'][] = [
  'Planning',
  'Active',
  'Blocked',
  'On Hold',
  'Completed',
];

export const PRIORITY_META: Record<Task['priority'], { label: string; badge: string; dot: string; glow: string }> = {
  Critical: {
    label: 'Critical',
    badge: 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30',
    dot: 'bg-white',
    glow: 'ring-2 ring-rose-300',
  },
  High: {
    label: 'High',
    badge: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30',
    dot: 'bg-white',
    glow: 'ring-2 ring-amber-300',
  },
  Medium: {
    label: 'Medium',
    badge: 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30',
    dot: 'bg-white',
    glow: 'ring-2 ring-blue-300',
  },
  Low: {
    label: 'Low',
    badge: 'bg-slate-500 text-white border-slate-500 shadow-md shadow-slate-500/20',
    dot: 'bg-white',
    glow: 'ring-2 ring-slate-300',
  },
};

export const TASK_STATUS_META: Record<Task['status'], { label: string; badge: string; chip: string; soft: string }> = {
  Assigned: {
    label: 'Assigned',
    badge: 'bg-slate-600 text-white border-slate-600 shadow-md shadow-slate-600/20',
    chip: 'bg-slate-400',
    soft: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  Pending: {
    label: 'Pending',
    badge: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30',
    chip: 'bg-amber-400',
    soft: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'In Progress': {
    label: 'In Progress',
    badge: 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30',
    chip: 'bg-blue-500',
    soft: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  Blocked: {
    label: 'Blocked',
    badge: 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30 animate-pulse',
    chip: 'bg-rose-500',
    soft: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  Completed: {
    label: 'Completed',
    badge: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30',
    chip: 'bg-emerald-500',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Cancelled: {
    label: 'Cancelled',
    badge: 'bg-slate-400 text-white border-slate-400',
    chip: 'bg-slate-300',
    soft: 'bg-slate-100 text-slate-500 border-slate-200',
  },
};

export const PROJECT_STATUS_META: Record<
  ProjectDoc['status'],
  { badge: string; dot: string; solid: string; soft: string }
> = {
  Planning: {
    badge: 'bg-slate-600 text-white border-slate-600 shadow-md shadow-slate-600/20',
    dot: 'bg-slate-400',
    solid: 'bg-slate-600',
    soft: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  Active: {
    badge: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30',
    dot: 'bg-emerald-500',
    solid: 'bg-emerald-500',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Blocked: {
    badge: 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30 animate-pulse',
    dot: 'bg-rose-500',
    solid: 'bg-rose-500',
    soft: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  'On Hold': {
    badge: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30',
    dot: 'bg-amber-500',
    solid: 'bg-amber-500',
    soft: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  Completed: {
    badge: 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30',
    dot: 'bg-blue-500',
    solid: 'bg-blue-500',
    soft: 'bg-blue-50 text-blue-700 border-blue-200',
  },
};

export function initials(name: string): string {
  return (name || '?')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function employeeName(emp?: Employee): string {
  return emp ? `${emp.firstName} ${emp.lastName}` : 'Unassigned';
}

export function findEmployee(employees: Employee[], id?: string): Employee | undefined {
  if (!id) return undefined;
  return employees.find((e) => e.id === id);
}

export function formatDue(date?: string): string {
  if (!date) return 'No due date';
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays === -1) return 'Due yesterday';
  if (diffDays > 1) return `Due in ${diffDays} days`;
  return `Overdue by ${Math.abs(diffDays)} days`;
}

export function isOverdue(date?: string): boolean {
  if (!date) return false;
  const d = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export function formatTimestamp(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateOnly(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function taskProgress(task: Task): { done: number; total: number; pct: number } {
  const total = (task.subTasks ?? []).length;
  const done = (task.subTasks ?? []).filter((s) => s.status === 'Completed').length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function projectProgress(project: ProjectDoc): { done: number; total: number; pct: number } {
  const total = project.tasks.length;
  const done = project.tasks.filter((t) => t.status === 'Completed').length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function AssigneeAvatar({
  name,
  size = 'h-7 w-7 text-[10px]',
}: {
  name?: string;
  size?: string;
}) {
  return (
    <div
      title={name || 'Unassigned'}
      className={`${size} shrink-0 rounded-full bg-teal-50 text-teal-800 ring-1 ring-teal-100 flex items-center justify-center font-extrabold`}
    >
      {name ? initials(name) : '–'}
    </div>
  );
}

export function PriorityBadge({ priority, compact }: { priority: Task['priority']; compact?: boolean }) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.Medium;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-black tracking-wide uppercase ${meta.badge} ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function TaskStatusBadge({ status, compact }: { status: Task['status']; compact?: boolean }) {
  const meta = TASK_STATUS_META[status] ?? TASK_STATUS_META.Assigned;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-black uppercase ${meta.badge} ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.chip}`} />
      {meta.label}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectDoc['status'] }) {
  const meta = PROJECT_STATUS_META[status] ?? PROJECT_STATUS_META.Planning;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-black uppercase ${meta.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {status}
    </span>
  );
}

export function MemberStack({ members, max = 3 }: { members: ProjectMemberDoc[]; max?: number }) {
  const visible = members.slice(0, max);
  const extra = members.length - visible.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((m) => (
        <div
          key={m._id ?? m.userId}
          title={m.name}
          className="h-6 w-6 rounded-full bg-teal-50 text-teal-800 ring-2 ring-white text-[8px] font-extrabold flex items-center justify-center"
        >
          {initials(m.name)}
        </div>
      ))}
      {extra > 0 && (
        <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 ring-2 ring-white text-[8px] font-extrabold flex items-center justify-center">
          +{extra}
        </div>
      )}
    </div>
  );
}
