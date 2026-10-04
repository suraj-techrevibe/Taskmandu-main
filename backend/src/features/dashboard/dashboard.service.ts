import { Employee } from '../employee/employee.model';
import { Attendance } from '../attendance/attendance.model';
import { Roster } from '../roster/roster.model';
import { Task } from '../task/task.model';
import { JobApplication, UpcomingInterview } from '../recruitment/recruitment.model';
import { Leave } from '../leave/leave.model';

export interface DashboardSummary {
  workforce: {
    totalEmployees: number;
    activeEmployees: number;
    onboarding: number;
    offboarding: number;
    archived: number;
    departments: number;
  };
  attendanceToday: {
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    totalLogged: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completionRate: number;
  };
  leave: {
    pending: number;
    approved: number;
    rejected: number;
  };
  recruitment: {
    totalApplications: number;
    hired: number;
    interviewsScheduled: number;
  };
  shiftsToday: {
    total: number;
    byShiftType: Record<string, number>;
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = new Date().toISOString().slice(0, 10);

  const [
    workforce,
    attendanceToday,
    tasks,
    overdueCount,
    leave,
    applications,
    hiredCount,
    interviewsScheduled,
    shiftsToday,
  ] = await Promise.all([
    Employee.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
          onboarding: { $sum: { $cond: [{ $eq: ['$status', 'Onboarding'] }, 1, 0] } },
          offboarding: { $sum: { $cond: [{ $eq: ['$status', 'Offboarding'] }, 1, 0] } },
          archived: { $sum: { $cond: [{ $eq: ['$status', 'Archived'] }, 1, 0] } },
          departments: { $addToSet: '$department' },
        },
      },
    ]),
    Attendance.aggregate([
      { $match: { date: today } },
      {
        $group: {
          _id: null,
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          onLeave: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } },
        },
      },
    ]),
    Task.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $in: ['$status', ['Assigned', 'Pending']] }, 1, 0] },
          },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        },
      },
    ]),
    Task.countDocuments({
      status: { $nin: ['Completed', 'Cancelled'] },
      dueDate: { $lt: today },
    }),
    Leave.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    JobApplication.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]),
    JobApplication.countDocuments({ stage: 'Hired' }),
    UpcomingInterview.countDocuments({ status: 'Scheduled' }),
    Roster.aggregate([
      { $match: { date: today } },
      { $group: { _id: '$shiftType', count: { $sum: 1 } } },
    ]),
  ]);

  const w = workforce[0];
  const aToday = attendanceToday[0];
  const t = tasks[0];
  const l = leave;

  const totalLogged = aToday ? aToday.present + aToday.late + aToday.onLeave : 0;
  const activeCount = w?.active ?? 0;
  const completedTasks = t?.completed ?? 0;
  const totalTasks = t?.total ?? 0;

  return {
    workforce: {
      totalEmployees: w?.total ?? 0,
      activeEmployees: activeCount,
      onboarding: w?.onboarding ?? 0,
      offboarding: w?.offboarding ?? 0,
      archived: w?.archived ?? 0,
      departments: w?.departments?.length ?? 0,
    },
    attendanceToday: {
      present: aToday?.present ?? 0,
      late: aToday?.late ?? 0,
      absent: activeCount > 0 ? Math.max(0, activeCount - totalLogged) : 0,
      onLeave: aToday?.onLeave ?? 0,
      totalLogged,
    },
    tasks: {
      total: totalTasks,
      pending: (t?.pending ?? 0) + (t?.inProgress ?? 0),
      inProgress: t?.inProgress ?? 0,
      completed: completedTasks,
      overdue: overdueCount,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    leave: {
      pending: l.find((x) => x._id === 'Pending')?.count ?? 0,
      approved: l.find((x) => x._id === 'Approved')?.count ?? 0,
      rejected: l.find((x) => x._id === 'Rejected')?.count ?? 0,
    },
    recruitment: {
      totalApplications: applications[0]?.total ?? 0,
      hired: hiredCount,
      interviewsScheduled,
    },
    shiftsToday: {
      total: shiftsToday.reduce((acc, s) => acc + s.count, 0),
      byShiftType: Object.fromEntries(shiftsToday.map((s) => [s._id, s.count])),
    },
  };
}
