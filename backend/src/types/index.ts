export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  HR: 'HR',
  MANAGER: 'Manager',
  TEAM_LEAD: 'Team Lead',
  EMPLOYEE: 'Employee',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = Object.values(ROLES);

export const ROLES_PRIORITY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 5,
  [ROLES.HR]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.TEAM_LEAD]: 2,
  [ROLES.EMPLOYEE]: 1,
};

export const GENDERS = ['Male', 'Female', 'Other'] as const;
export type Gender = (typeof GENDERS)[number];

export const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Intern'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYEE_STATUSES = ['Active', 'Onboarding', 'Offboarding', 'Archived'] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const SHIFT_TYPES = ['Morning', 'Evening', 'Night', 'Flexible', 'Custom'] as const;
export type ShiftType = (typeof SHIFT_TYPES)[number];

export const ATTENDANCE_STATUSES = ['Present', 'Late', 'Half Day', 'Absent', 'Leave', 'Holiday'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ['Assigned', 'Pending', 'In Progress', 'Blocked', 'Completed', 'Cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const LEAVE_TYPES = [
  'Sick Leave',
  'Casual Leave',
  'Annual Leave',
  'Maternity/Paternity Leave',
  'Unpaid Leave',
] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const NOTIFICATION_TYPES = ['attendance', 'shift', 'task', 'hr', 'leave'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const APPLICATION_STAGES = [
  'Applied',
  'Screening',
  'Technical Round',
  'Manager Round',
  'HR Round',
  'Offer Extended',
  'Hired',
  'Rejected',
] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const INTERVIEW_TYPES = [
  'Screening',
  'Technical Coding',
  'System Design',
  'Cultural Fit',
  'HR Round',
  'Executive Loop',
] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No Show'] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const JOB_STATUSES = ['Open', 'On Hold', 'Closed', 'Filled'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const CLEARANCE_STATUSES = ['Pending', 'Approved', 'Rejected'] as const;
export type ClearanceStatus = (typeof CLEARANCE_STATUSES)[number];

export const REHIRE_ELIGIBILITIES = ['Yes', 'No', 'Conditional'] as const;
export type RehireEligibility = (typeof REHIRE_ELIGIBILITIES)[number];

export const CHAT_GROUP_CATEGORIES = ['Notice', 'EOD', 'General', 'Project'] as const;
export type ChatGroupCategory = (typeof CHAT_GROUP_CATEGORIES)[number];

export const NOTE_CATEGORIES = [
  'Shift Handover',
  'Company Policies',
  'Personal Reminders',
  'Technical Docs',
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export const PROJECT_STATUSES = ['Planning', 'Active', 'Blocked', 'On Hold', 'Completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const VARIABLE_TYPES = ['Environment', 'Server Creds', 'Database', 'Other'] as const;
export type VariableType = (typeof VARIABLE_TYPES)[number];
