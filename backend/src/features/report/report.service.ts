import type { FilterQuery } from 'mongoose';
import { Attendance, type Attendance as AttendanceDoc } from '../attendance/attendance.model';
import { Task, type Task as TaskDoc } from '../task/task.model';
import { Employee } from '../employee/employee.model';
import { Onboarding } from '../onboarding/onboarding.model';
import { Offboarding } from '../offboarding/offboarding.model';
import { Leave } from '../leave/leave.model';
import { JobApplication } from '../recruitment/recruitment.model';

export interface ReportRange {
  from?: string;
  to?: string;
  department?: string;
}

export interface ReportMeta {
  generatedAt: string;
  range: ReportRange;
  recordCount: number;
}

export interface AttendanceReport {
  meta: ReportMeta;
  records: Array<{
    employeeId: string;
    date: string;
    status: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    workingHours: number;
  }>;
  summary: {
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    totalWorkingHours: number;
  };
}

export interface TaskReport {
  meta: ReportMeta;
  records: Array<{
    title: string;
    assignedToId: string[];
    priority: string;
    status: string;
    dueDate: string;
    estimatedHours: number;
    tags: string[];
  }>;
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    blocked: number;
    overdue: number;
    completionRate: number;
  };
}

export interface HrReport {
  meta: ReportMeta;
  workforce: {
    total: number;
    active: number;
    archived: number;
    byDepartment: Record<string, number>;
    byEmploymentType: Record<string, number>;
  };
  lifecycle: {
    onboardingInProgress: number;
    offboardingInProgress: number;
  };
  recruitment: {
    totalApplications: number;
    hired: number;
  };
  leave: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export async function getAttendanceReport(range: ReportRange): Promise<AttendanceReport> {
  const filter: FilterQuery<AttendanceDoc> = {};
  if (range.from || range.to) {
    filter.date = {};
    if (range.from) filter.date.$gte = range.from;
    if (range.to) filter.date.$lte = range.to;
  }
  if (range.department) {
    const employees = await Employee.find({ department: range.department }).select('_id').lean();
    filter.employeeId = { $in: employees.map((e) => e._id.toString()) };
  }

  const records = await Attendance.find(filter)
    .sort({ date: -1 })
    .limit(5000)
    .lean();

  const summary = {
    present: records.filter((r) => r.status === 'Present').length,
    late: records.filter((r) => r.status === 'Late').length,
    absent: records.filter((r) => r.status === 'Absent').length,
    onLeave: records.filter((r) => r.status === 'Leave').length,
    totalWorkingHours: Math.round(records.reduce((acc, r) => acc + (r.workingHours ?? 0), 0) * 100) / 100,
  };

  return {
    meta: { generatedAt: new Date().toISOString(), range, recordCount: records.length },
    records: records.map((r) => ({
      employeeId: r.employeeId,
      date: r.date,
      status: r.status,
      checkInTime: r.checkInTime ? r.checkInTime.toISOString() : null,
      checkOutTime: r.checkOutTime ? r.checkOutTime.toISOString() : null,
      workingHours: r.workingHours,
    })),
    summary,
  };
}

export async function getTaskReport(range: ReportRange): Promise<TaskReport> {
  const filter: FilterQuery<TaskDoc> = {};
  if (range.from || range.to) {
    filter.dueDate = {};
    if (range.from) filter.dueDate.$gte = range.from;
    if (range.to) filter.dueDate.$lte = range.to;
  }
  if (range.department) {
    const employees = await Employee.find({ department: range.department }).select('_id').lean();
    filter.assignedToId = { $in: employees.map((e) => e._id.toString()) };
  }

  const records = await Task.find(filter).sort({ dueDate: -1 }).limit(5000).lean();
  const today = new Date().toISOString().slice(0, 10);

  const summary = {
    total: records.length,
    completed: records.filter((r) => r.status === 'Completed').length,
    inProgress: records.filter((r) => r.status === 'In Progress').length,
    pending: records.filter((r) => ['Assigned', 'Pending'].includes(r.status)).length,
    blocked: records.filter((r) => r.status === 'Blocked').length,
    overdue: records.filter(
      (r) => r.status !== 'Completed' && r.status !== 'Cancelled' && r.dueDate < today,
    ).length,
    completionRate:
      records.length > 0
        ? Math.round((records.filter((r) => r.status === 'Completed').length / records.length) * 100)
        : 0,
  };

  return {
    meta: { generatedAt: new Date().toISOString(), range, recordCount: records.length },
    records: records.map((r) => ({
      title: r.title,
      assignedToId: r.assignedToId,
      priority: r.priority,
      status: r.status,
      dueDate: r.dueDate,
      estimatedHours: r.estimatedHours,
      tags: r.tags,
    })),
    summary,
  };
}

export async function getHrReport(range: ReportRange): Promise<HrReport> {
  const [byDepartment, byEmploymentType, activeCount, archivedCount, onboardingInProgress, offboardingInProgress, totalApplications, hired, leave] =
    await Promise.all([
      Employee.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]),
      Employee.aggregate([{ $group: { _id: '$employmentType', count: { $sum: 1 } } }]),
      Employee.countDocuments({ status: 'Active' }),
      Employee.countDocuments({ status: 'Archived' }),
      Onboarding.countDocuments({ isCompleted: false }),
      Offboarding.countDocuments({ isCompleted: false }),
      JobApplication.countDocuments(),
      JobApplication.countDocuments({ stage: 'Hired' }),
      Leave.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

  return {
    meta: { generatedAt: new Date().toISOString(), range, recordCount: 0 },
    workforce: {
      total: byDepartment.reduce((acc, d) => acc + d.count, 0),
      active: activeCount,
      archived: archivedCount,
      byDepartment: Object.fromEntries(byDepartment.map((d) => [d._id, d.count])),
      byEmploymentType: Object.fromEntries(byEmploymentType.map((t) => [t._id, t.count])),
    },
    lifecycle: {
      onboardingInProgress,
      offboardingInProgress,
    },
    recruitment: {
      totalApplications,
      hired,
    },
    leave: {
      pending: leave.find((x) => x._id === 'Pending')?.count ?? 0,
      approved: leave.find((x) => x._id === 'Approved')?.count ?? 0,
      rejected: leave.find((x) => x._id === 'Rejected')?.count ?? 0,
    },
  };
}

function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const body = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  return `${headerLine}\n${body}\n`;
}

export async function exportReportAsCsv(
  type: 'attendance' | 'tasks' | 'hr',
  range: ReportRange,
): Promise<{ filename: string; csv: string }> {
  let filename = `${type}_report_${new Date().toISOString().slice(0, 10)}.csv`;
  let csv = '';

  if (type === 'attendance') {
    const report = await getAttendanceReport(range);
    csv = toCsv(
      ['employeeId', 'date', 'status', 'checkInTime', 'checkOutTime', 'workingHours'],
      report.records.map((r) => [
        r.employeeId,
        r.date,
        r.status,
        r.checkInTime ?? '',
        r.checkOutTime ?? '',
        r.workingHours,
      ]),
    );
  } else if (type === 'tasks') {
    const report = await getTaskReport(range);
    csv = toCsv(
      ['title', 'assignedToId', 'priority', 'status', 'dueDate', 'estimatedHours', 'tags'],
      report.records.map((r) => [
        r.title,
        r.assignedToId,
        r.priority,
        r.status,
        r.dueDate,
        r.estimatedHours,
        r.tags.join(' | '),
      ]),
    );
  } else {
    const report = await getHrReport(range);
    csv = toCsv(
      ['metric', 'value'],
      [
        ['totalEmployees', report.workforce.total],
        ['activeEmployees', report.workforce.active],
        ['archivedEmployees', report.workforce.archived],
        ['onboardingInProgress', report.lifecycle.onboardingInProgress],
        ['offboardingInProgress', report.lifecycle.offboardingInProgress],
        ['totalApplications', report.recruitment.totalApplications],
        ['hired', report.recruitment.hired],
        ['leavePending', report.leave.pending],
        ['leaveApproved', report.leave.approved],
        ['leaveRejected', report.leave.rejected],
      ],
    );
  }

  return { filename, csv };
}
