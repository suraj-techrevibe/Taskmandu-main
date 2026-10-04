export type Role = string;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  employeeId: string | null;
  avatar?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  employeeId: string | null;
  avatar?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  permissions: string[];
}

export interface RoleDef {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
  createdAt?: string;
}

export interface PermissionDef {
  id: string;
  label: string;
  module: string;
}

export type InvitationStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Expired';

export interface Invitation {
  _id: string;
  name: string;
  email: string;
  role: Role;
  employeeId?: string;
  status: InvitationStatus;
  expiresAt: string;
  invitedByName: string;
  invitedBy?: string;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  employeeId: string;
  department: string;
  designation: string;
  employmentType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';
  joiningDate: string;
  reportingManagerId: string;
  salary: number;
  status: 'Active' | 'Onboarding' | 'Offboarding' | 'Archived';
}

export type ShiftType = 'Morning' | 'Evening' | 'Night' | 'Flexible' | 'Custom';

export interface Roster {
  id: string;
  employeeIds: string[];
  department: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  location: string;
  date: string; // YYYY-MM-DD
  recurring: boolean;
}

export interface Attendance {
  id: string;
  employeeId: string;
  checkInTime: string; // ISO string
  locationType: 'Onsite' | 'WFH';
  checkOutTime?: string; // ISO string
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Late' | 'Half Day' | 'Absent' | 'Leave' | 'Holiday';
  workingHours?: number;
}

export interface OnboardingProfile {
  id: string;
  personalDetails: {
    firstName: string;
    lastName: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
    email: string;
    address: string;
    emergencyContact: string;
  };
  employmentInfo: {
    employeeId: string;
    department: string;
    designation: string;
    employmentType: string;
    joiningDate: string;
    reportingManagerId: string;
    salary: number;
  };
  documents: {
    citizenshipVerified: boolean;
    passportVerified: boolean;
    contractSigned: boolean;
    bankDetailsSubmitted: boolean;
  };
  assetsAllocated: {
    laptop: boolean;
    idCard: boolean;
    simCard: boolean;
    accessCard: boolean;
  };
  checklist: {
    emailCreated: boolean;
    payrollAdded: boolean;
    systemAccessGranted: boolean;
    trainingCompleted: boolean;
  };
  currentStep: number; // 0: Details, 1: Documents, 2: Assets, 3: Checklist, 4: Activate
  isCompleted: boolean;
  linkedEmployeeId?: string;
  activationStatus?: 'Pending' | 'Accepted' | 'Expired';
}

export interface OnboardingDecision {
  id: string;
  name: string;
  email: string;
  designation: string;
  status: 'Pending' | 'Accepted' | 'Expired';
  expiresAt: string;
}

export interface OffboardingProfile {
  id: string;
  employeeId: string;
  lastWorkingDay: string;
  reason: string;
  noticePeriod: number; // days
  feedback: string;
  clearanceStatus: {
    hr: 'Pending' | 'Approved' | 'Rejected';
    finance: 'Pending' | 'Approved' | 'Rejected';
    it: 'Pending' | 'Approved' | 'Rejected';
    operations: 'Pending' | 'Approved' | 'Rejected';
  };
  assetsReturned: {
    laptop: boolean;
    monitor: boolean;
    accessCard: boolean;
    simCard: boolean;
  };
  exitInterview: {
    companyFeedback: string;
    suggestions: string;
    rehireEligibility: 'Yes' | 'No' | 'Conditional';
  };
  currentStep: number; // 0: Request, 1: Clearance, 2: Assets, 3: Interview, 4: Archive
  isCompleted: boolean;
}

export interface SubTask {
  id: string;
  title: string;
  assignedToId: string[];
  assignedByName: string;
  status: 'Assigned' | 'Pending' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled';
  createdAt?: string; // ISO string
  completedAt?: string | null;
  comments: {
    id: string;
    authorName: string;
    authorRole: string;
    text: string;
    createdAt: string;
  }[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToId: string[];
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string; // YYYY-MM-DD
  estimatedHours: number;
  status: 'Assigned' | 'Pending' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled';
  attachments: { name: string; size: string; url: string }[];
  tags: string[];
  createdAt?: string; // ISO string
  comments: {
    id: string;
    authorName: string;
    authorRole: string;
    text: string;
    createdAt: string; // ISO string
  }[];
  subTasks: SubTask[];
}

export interface ProjectMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  leaveType: 'Sick Leave' | 'Casual Leave' | 'Annual Leave' | 'Maternity/Paternity Leave' | 'Unpaid Leave';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string; // ISO String
  actionedAt?: string; // ISO String
  managerNotes?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headEmployeeId: string | null;
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'attendance' | 'shift' | 'task' | 'hr' | 'leave';
  createdAt: string; // ISO string
  read: boolean;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';
  openings: number;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  requirements?: string;
  status: 'Open' | 'On Hold' | 'Closed' | 'Filled';
}

export interface JobApplication {
  id: string;
  jobId?: string;
  candidateName: string;
  email: string;
  phone: string;
  roleApplied: string;
  stage: 'Applied' | 'Screening' | 'Technical Round' | 'Manager Round' | 'HR Round' | 'Offer Extended' | 'Hired' | 'Rejected';
  experienceYears: number;
  resumeUrl?: string;
  appliedDate: string; // YYYY-MM-DD
  rating: number; // 1-5
  source: string; // LinkedIn, Referral, etc.
  notes?: string;
}

export interface UpcomingInterview {
  id: string;
  applicationId: string;
  jobId?: string;
  candidateName: string;
  roleApplied: string;
  interviewDate: string; // YYYY-MM-DD
  interviewTime: string; // HH:MM
  interviewType: 'Screening' | 'Technical Coding' | 'System Design' | 'Cultural Fit' | 'HR Round' | 'Executive Loop';
  interviewers: string[];
  meetingLink?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
  notes?: string;
}
