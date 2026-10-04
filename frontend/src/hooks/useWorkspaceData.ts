import { useEffect, useState } from 'react';
import type {
  Attendance,
  Department,
  Employee,
  Job,
  JobApplication,
  LeaveRequest,
  OffboardingProfile,
  OnboardingProfile,
  Roster,
  SystemNotification,
  Task,
  UpcomingInterview,
} from '../types';
import { listEmployees } from '../services/employee';
import * as departmentApi from '../services/department';
import * as attendanceApi from '../services/attendance';
import * as leaveApi from '../services/leave';
import * as rosterApi from '../services/roster';
import * as notificationApi from '../services/notification';
import * as onboardingApi from '../services/onboarding';
import * as offboardingApi from '../services/offboarding';
import * as recruitmentApi from '../services/recruitment';
import * as taskApi from '../services/task';
import { toast } from '../services/toast';
import { addDaysStr, todayStr } from '../utils/date';

/**
 * Owns every piece of workspace data (employees, rosters, attendance, onboarding,
 * offboarding, tasks, notifications, leaves, recruitment) plus all CRUD handlers
 * backed by the real API.
 */
export function useWorkspaceData(enabled: boolean, permissions: string[]) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [onboardings, setOnboardings] = useState<OnboardingProfile[]>([]);
  const [offboardings, setOffboardings] = useState<OffboardingProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Server-backed refreshes (replace state on success, keep empty on error)
  const refreshEmployees = async () => {
    try {
      const serverEmployees = await listEmployees(100);
      setEmployees(serverEmployees);
    } catch {
      // Error toast is surfaced by the HTTP layer
    }
  };

  const refreshAttendance = async () => {
    try {
      const records = await attendanceApi.listAttendances({ limit: 100 });
      setAttendances(records);
    } catch {
      // Error toast is surfaced by the HTTP layer
    }
  };

  const refreshLeaves = async () => {
    try {
      const requests = await leaveApi.listLeaves({ limit: 100 });
      setLeaveRequests(requests);
    } catch {
      // Error toast is surfaced by the HTTP layer
    }
  };

  const refreshRosters = async () => {
    try {
      const records = await rosterApi.listRosters({ limit: 100 });
      setRosters(records);
    } catch {
      // Error toast is surfaced by the HTTP layer
    }
  };

  const refreshNotifications = async () => {
    try {
      const records = await notificationApi.listNotifications(50);
      setNotifications(records);
    } catch {
      // Error toast is surfaced by the HTTP layer
    }
  };

  const refreshOnboardings = async () => {
    try {
      const profiles = await onboardingApi.listOnboardings(100);
      setOnboardings(profiles);
    } catch {
      // Error toast is surfaced by the HTTP layer
    }
  };

  const refreshOffboardings = async () => {
    try {
      const profiles = await offboardingApi.listOffboardings(100);
      setOffboardings(profiles);
    } catch {
      // Error toast is surfaced by the HTTP layer
    }
  };

  const refreshRecruitment = async () => {
    try {
      const [apps, interviews, jobPostings] = await Promise.all([
        recruitmentApi.listApplications(100),
        recruitmentApi.listInterviews(100),
        recruitmentApi.listJobs(100),
      ]);
      setJobApplications(apps);
      setUpcomingInterviews(interviews);
      setJobs(jobPostings);
    } catch {
      // Error toast is surfaced by the HTTP layer
    }
  };

  const refreshTasks = async () => {
    try {
      const records = await taskApi.listTasks();
      setTasks(records);
    } catch {
      // Error toast is surfaced by the HTTP layer
    }
  };

  const refreshDepartments = async () => {
    try {
      const records = await departmentApi.listDepartments();
      setDepartments(records);
    } catch {
      // Error toast is surfaced by the HTTP layer
    }
  };

  useEffect(() => {
    if (!enabled) return;
    // Only fetch data for modules the user can actually access (matches the sidebar).
    if (permissions.includes('employees:view')) void refreshEmployees();
    if (permissions.includes('attendance:view')) void refreshAttendance();
    if (permissions.includes('leaves:view')) void refreshLeaves();
    if (permissions.includes('rosters:view')) void refreshRosters();
    void refreshNotifications();
    if (permissions.includes('onboarding:manage')) void refreshOnboardings();
    if (permissions.includes('offboarding:view')) void refreshOffboardings();
    if (permissions.includes('recruitment:view')) void refreshRecruitment();
    if (permissions.includes('tasks:view')) void refreshTasks();
    if (permissions.includes('departments:view')) void refreshDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ─── ROSTERS ────────────────────────────────────────────────────────────────
  const handleAddRoster = async (newRoster: Omit<Roster, 'id'>) => {
    try {
      const created = await rosterApi.createRoster(newRoster);
      setRosters((prev) => [created, ...prev]);

      // Create Notification
      const newNot: SystemNotification = {
        id: `not-${Date.now()}`,
        title: 'Shift Schedule Released',
        message: `A new ${newRoster.shiftType} roster for ${newRoster.department} has been scheduled.`,
        type: 'shift',
        createdAt: new Date().toISOString(),
        read: false,
      };
      const updatedNots = [newNot, ...notifications];
      setNotifications(updatedNots);
      toast.success('Shift assignment saved.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleCopyRoster = async () => {
    try {
      const sourceDate = todayStr();
      const targetDate = addDaysStr(7);
      const result = await rosterApi.copyRosters(sourceDate, targetDate);
      await refreshRosters();
      toast.success(`Cloned ${result.copied} shifts to next week (${targetDate}).`);
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  // ─── ATTENDANCE ─────────────────────────────────────────────────────────────
  const handleCheckIn = async (locationType: 'Onsite' | 'WFH' = 'Onsite') => {
    try {
      const record = await attendanceApi.checkIn({ locationType });
      setAttendances((prev) => [record, ...prev]);
      toast.success('Check-in recorded successfully.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleCheckOut = async () => {
    try {
      const record = await attendanceApi.checkOut();
      setAttendances((prev) => {
        const exists = prev.some((att) => att.id === record.id);
        return exists ? prev.map((att) => (att.id === record.id ? record : att)) : [record, ...prev];
      });
      toast.success('Check-out recorded successfully.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  // ─── ONBOARDING ─────────────────────────────────────────────────────────────
  const handleUpdateOnboarding = async (id: string, updated: Partial<OnboardingProfile>) => {
    try {
      const profile = await onboardingApi.updateOnboarding(id, updated);
      setOnboardings((prev) => prev.map((p) => (p.id === profile.id ? profile : p)));
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleAddOnboarding = async (
    profile: Omit<OnboardingProfile, 'id' | 'currentStep' | 'isCompleted'>,
  ) => {
    try {
      const created = await onboardingApi.createOnboarding(profile);
      setOnboardings((prev) => [created, ...prev]);
      toast.success('Onboarding profile created.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleActivateEmployee = async (id: string) => {
    try {
      const { accountCreated, emailSent, activationLink } = await onboardingApi.activateOnboarding(id);
      setOnboardings((prev) => prev.filter((p) => p.id !== id));
      await refreshEmployees();
      if (accountCreated) {
        toast.success(
          emailSent
            ? 'Decision email sent to candidate to accept or decline the offer.'
            : `No email service configured - share this link with the candidate: ${activationLink}`,
        );
      } else {
        toast.success('Candidate linked to an existing account. A decision email has been sent.');
      }
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  // ─── OFFBOARDING ────────────────────────────────────────────────────────────
  const handleUpdateOffboarding = async (id: string, updated: Partial<OffboardingProfile>) => {
    try {
      const profile = await offboardingApi.updateOffboarding(id, updated);
      setOffboardings((prev) => prev.map((p) => (p.id === profile.id ? profile : p)));
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleAddOffboarding = async (
    profile: Omit<OffboardingProfile, 'id' | 'currentStep' | 'isCompleted'>,
  ) => {
    try {
      const created = await offboardingApi.createOffboarding(profile);
      setOffboardings((prev) => [created, ...prev]);
      toast.success('Offboarding profile created.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleArchiveEmployee = async (id: string) => {
    try {
      await offboardingApi.archiveOffboarding(id);
      setOffboardings((prev) => prev.filter((p) => p.id !== id));
      await refreshEmployees();
      toast.success('Employee safely archived and credentials deactivated.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  // ─── RECRUITMENT ────────────────────────────────────────────────────────────
  const handleAddApplication = async (app: Omit<JobApplication, 'id'>) => {
    try {
      const created = await recruitmentApi.createApplication(app);
      setJobApplications((prev) => [created, ...prev]);
      toast.success('Job application added.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleUpdateApplication = async (app: JobApplication) => {
    try {
      const updated = await recruitmentApi.updateApplication(app.id, app);
      setJobApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await recruitmentApi.deleteApplication(id);
      setJobApplications((prev) => prev.filter((a) => a.id !== id));
      toast.success('Job application removed.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleAddInterview = async (int: Omit<UpcomingInterview, 'id'>) => {
    try {
      const created = await recruitmentApi.createInterview(int);
      setUpcomingInterviews((prev) => [created, ...prev]);
      toast.success('Interview scheduled.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleUpdateInterview = async (int: UpcomingInterview) => {
    try {
      const updated = await recruitmentApi.updateInterview(int.id, int);
      setUpcomingInterviews((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleDeleteInterview = async (id: string) => {
    try {
      await recruitmentApi.deleteInterview(id);
      setUpcomingInterviews((prev) => prev.filter((i) => i.id !== id));
      toast.success('Interview removed.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleAddJob = async (job: Omit<Job, 'id'>) => {
    try {
      const created = await recruitmentApi.createJob(job);
      setJobs((prev) => [created, ...prev]);
      toast.success('Job posting created.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleUpdateJob = async (job: Job) => {
    try {
      const updated = await recruitmentApi.updateJob(job.id, job);
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await recruitmentApi.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success('Job posting removed.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  // ─── TASKS ──────────────────────────────────────────────────────────────────
  const handleAddTask = async (newTask: Omit<Task, 'id' | 'comments'>) => {
    const optimistic: Task = {
      ...newTask,
      id: `task-${Date.now()}`,
      comments: [],
    };
    setTasks((prev) => [optimistic, ...prev]);

    // Notify Assignee
    const assigneeNames = (newTask.assignedToId || []).map(id => {
      const emp = employees.find((e) => e.id === id);
      return emp ? `${emp.firstName} ${emp.lastName}` : '';
    }).filter(Boolean);
    const newNot: SystemNotification = {
      id: `not-${Date.now()}`,
      title: 'New Daily Work Assignment',
      message: `You have been assigned: "${newTask.title}". Due Date: ${newTask.dueDate}`,
      type: 'task',
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNot, ...prev]);

    try {
      const created = await taskApi.createTask({
        title: newTask.title,
        description: newTask.description,
        assignedToId: newTask.assignedToId,
        assignedByName: assigneeNames.join(', '),
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        estimatedHours: newTask.estimatedHours,
        tags: newTask.tags,
      });
      setTasks((prev) => prev.map((t) => (t.id === optimistic.id ? created : t)));
    } catch {
      // Error toast is surfaced by the HTTP layer
    }
  };

  const handleUpdateTask = async (id: string, updated: Partial<Task>) => {
    const prev = tasks.find((t) => t.id === id);
    let statusNotification: SystemNotification | null = null;
    if (prev) {
      const next = { ...prev, ...updated };
      setTasks((cur) => cur.map((t) => (t.id === id ? next : t)));
      // Trigger notification on status change
      if (updated.status && updated.status !== prev.status) {
        statusNotification = {
          id: `not-${Date.now()}`,
          title: 'Task Status Updated',
          message: `Task: "${prev.title}" is now "${updated.status}"`,
          type: 'task',
          createdAt: new Date().toISOString(),
          read: false,
        };
        setNotifications((cur) => [statusNotification!, ...cur]);
      }
    }

    try {
      const patch: Partial<Task> = {};
      if (updated.status) patch.status = updated.status;
      if (updated.title) patch.title = updated.title;
      if (updated.description !== undefined) patch.description = updated.description;
      if (updated.priority) patch.priority = updated.priority;
      if (updated.dueDate) patch.dueDate = updated.dueDate;
      if (updated.estimatedHours !== undefined) patch.estimatedHours = updated.estimatedHours;
      if (updated.tags) patch.tags = updated.tags;
      const saved = await taskApi.updateTask(id, patch);
      setTasks((cur) => cur.map((t) => (t.id === id ? saved : t)));
      if (statusNotification) {
        notificationApi
          .createNotification({
            title: statusNotification.title,
            message: statusNotification.message,
            type: 'task',
          })
          .catch(() => {});
      }
    } catch {
      // Error toast is surfaced by the HTTP layer — local optimistic state stands in
    }
  };

  // ─── LEAVE MANAGEMENT ───────────────────────────────────────────────────────
  const handleAddLeaveRequest = async (
    newRequest: Omit<LeaveRequest, 'id' | 'createdAt' | 'status' | 'employeeName'>,
  ) => {
    try {
      const created = await leaveApi.createLeave({
        employeeId: newRequest.employeeId,
        startDate: newRequest.startDate,
        endDate: newRequest.endDate,
        leaveType: newRequest.leaveType,
        reason: newRequest.reason,
      });
      setLeaveRequests((prev) => [created, ...prev]);
      toast.success('Leave request submitted successfully for approval!');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleActionLeaveRequest = async (
    id: string,
    status: 'Approved' | 'Rejected',
    notes: string,
  ) => {
    try {
      const updated = await leaveApi.actionLeave(id, status, notes);
      setLeaveRequests((prev) => prev.map((req) => (req.id === updated.id ? updated : req)));
      // Approving a leave cascades into attendance records + rosters server-side
      void refreshAttendance();
      toast.success(`Leave request ${status.toLowerCase()}.`);
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  // ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
  const handleMarkAllNotsRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const handleClearAllNots = async () => {
    try {
      await notificationApi.clearAll();
      setNotifications([]);
      toast.success('Notifications cleared.');
    } catch {
      // Error toast is already surfaced by the HTTP layer
    }
  };

  const addNotification = (title: string, message: string, type: SystemNotification['type']) => {
    const newNot: SystemNotification = {
      id: `not-${Date.now()}`,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNot, ...prev]);
  };

  return {
    employees,
    rosters,
    attendances,
    onboardings,
    offboardings,
    tasks,
    notifications,
    leaveRequests,
    jobApplications,
    upcomingInterviews,
    jobs,
    departments,
    handleAddRoster,
    handleCopyRoster,
    handleCheckIn,
    handleCheckOut,
    handleUpdateOnboarding,
    handleAddOnboarding,
    handleActivateEmployee,
    handleUpdateOffboarding,
    handleAddOffboarding,
    handleArchiveEmployee,
    handleAddApplication,
    handleUpdateApplication,
    handleDeleteApplication,
    handleAddInterview,
    handleUpdateInterview,
    handleDeleteInterview,
    handleAddJob,
    handleUpdateJob,
    handleDeleteJob,
    handleAddTask,
    handleUpdateTask,
    handleAddLeaveRequest,
    handleActionLeaveRequest,
    handleMarkAllNotsRead,
    handleClearAllNots,
    addNotification,
  };
}
