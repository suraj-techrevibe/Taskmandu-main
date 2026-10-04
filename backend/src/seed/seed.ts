import mongoose from 'mongoose';
import { env } from '../config/env';
import logger from '../config/logger';
import { ALL_PERMISSIONS } from '../types/permissions';
import { User } from '../features/auth/auth.model';
import { Role } from '../features/role/role.model';
import { Invitation } from '../features/invitation/invitation.model';
import { Employee } from '../features/employee/employee.model';
import { Roster } from '../features/roster/roster.model';
import { Attendance } from '../features/attendance/attendance.model';
import { Onboarding } from '../features/onboarding/onboarding.model';
import { Offboarding } from '../features/offboarding/offboarding.model';
import { Task } from '../features/task/task.model';
import { Leave } from '../features/leave/leave.model';
import { JobApplication, UpcomingInterview } from '../features/recruitment/recruitment.model';
import { Notification } from '../features/notification/notification.model';
import { Note } from '../features/note/note.model';
import { ChatGroup, ChatMessage } from '../features/chat/chat.model';
import { Project } from '../features/project/project.model';
import { Department } from '../features/department/department.model';

const DEMO_PASSWORD = 'Techmandu@123';

function dateStr(offsetDays: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function isoStr(offsetDays: number, time: string): Date {
  return new Date(`${dateStr(offsetDays)}T${time}Z`);
}

async function seed() {
  logger.info('🌱 Seeding database...');

  await Promise.all([
    User.deleteMany({}),
    Role.deleteMany({}),
    Invitation.deleteMany({}),
    Employee.deleteMany({}),
    Roster.deleteMany({}),
    Attendance.deleteMany({}),
    Onboarding.deleteMany({}),
    Offboarding.deleteMany({}),
    Task.deleteMany({}),
    Leave.deleteMany({}),
    JobApplication.deleteMany({}),
    UpcomingInterview.deleteMany({}),
    Notification.deleteMany({}),
    Note.deleteMany({}),
    ChatGroup.deleteMany({}),
    ChatMessage.deleteMany({}),
    Project.deleteMany({}),
    Department.deleteMany({}),
  ]);
  logger.info('Cleared existing collections');

  // ---------- Roles & Permissions (full catalog) ----------
  const HR_PERMISSIONS = [
    'dashboard:view',
    'users:view',
    'users:invite',
    'users:update',
    'users:delete',
    'roles:view',
    'employees:view',
    'employees:create',
    'employees:update',
    'employees:delete',
    'attendance:view',
    'attendance:manage',
    'tasks:view',
    'tasks:create',
    'tasks:update',
    'tasks:delete',
    'tasks:manage',
    'leaves:view',
    'leaves:approve',
    'rosters:view',
    'rosters:manage',
    'onboarding:manage',
    'offboarding:view',
    'offboarding:manage',
    'recruitment:view',
    'recruitment:manage',
    'reports:view',
    'reports:export',
    'notes:view',
    'notes:manage',
    'chat:manage',
    'notifications:manage',
    'projects:view',
    'projects:create',
    'projects:update',
    'projects:delete',
    'projects:manage',
    'departments:view',
    'departments:manage',
  ];

  const EMPLOYEE_PERMISSIONS = [
    'dashboard:view',
    'employees:view',
    'attendance:view',
    'tasks:view',
    'tasks:update',
    'leaves:view',
    'rosters:view',
    'offboarding:view',
    'recruitment:view',
    'reports:view',
    'notes:view',
    'notes:manage',
    'chat:manage',
    'projects:view',
  ];

  await Role.insertMany([
    {
      name: 'Super Admin',
      description: 'Full access to every module and permission in Taskmandu.',
      permissions: [...ALL_PERMISSIONS],
      isSystem: true,
    },
    {
      name: 'HR',
      description: 'Manages people operations: users, invites, employees, attendance, leaves, onboarding and reports.',
      permissions: HR_PERMISSIONS,
      isSystem: true,
    },
    {
      name: 'Employee',
      description: 'Default role for all staff: self-service view of attendance, tasks, leaves, rosters and reports.',
      permissions: EMPLOYEE_PERMISSIONS,
      isSystem: true,
    },
  ]);
  logger.info(`✅ Seeded 3 roles with ${ALL_PERMISSIONS.length} permissions in the catalog`);

  // ---------- Departments ----------
  await Department.insertMany([
    { name: 'Engineering', description: 'Product engineering, development and platform reliability.' },
    { name: 'HR', description: 'People operations: hiring, onboarding, attendance and payroll.' },
    { name: 'Operations', description: 'Day-to-day business operations and process management.' },
    { name: 'Marketing', description: 'Brand, growth, campaigns and communications.' },
    { name: 'Finance', description: 'Accounting, budgeting and financial reporting.' },
    { name: 'Support', description: 'Customer success and technical support.' },
  ]);
  logger.info('✅ Seeded 6 departments');

  // ---------- Employees ----------
  const demoEmployees = [
    {
      key: 'emp-101',
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'alex.rivera@company.com',
      phone: '+1 (555) 123-4567',
      dob: '1993-04-12',
      gender: 'Male',
      address: '456 Pine Ave, San Francisco, CA',
      emergencyContact: { name: 'Maria Rivera', relationship: 'Spouse', phone: '+1 (555) 987-6543' },
      employeeId: 'EMP-101',
      department: 'Engineering',
      designation: 'Senior Software Engineer',
      employmentType: 'Full-Time',
      joiningDate: '2022-03-15',
      reportingManagerId: null,
      salary: 115000,
      status: 'Active',
    },
    {
      key: 'emp-102',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.jenkins@company.com',
      phone: '+1 (555) 234-5678',
      dob: '1987-11-23',
      gender: 'Female',
      address: '789 Oak Dr, San Jose, CA',
      emergencyContact: { name: 'Robert Jenkins', relationship: 'Spouse', phone: '+1 (555) 876-5432' },
      employeeId: 'EMP-102',
      department: 'Operations',
      designation: 'Operations Director',
      employmentType: 'Full-Time',
      joiningDate: '2019-06-01',
      reportingManagerId: null,
      salary: 145000,
      status: 'Active',
    },
    {
      key: 'emp-103',
      firstName: 'David',
      lastName: 'Vance',
      email: 'david.vance@company.com',
      phone: '+1 (555) 345-6789',
      dob: '1982-08-15',
      gender: 'Male',
      address: '101 Maple Way, Oakland, CA',
      emergencyContact: { name: 'Helen Vance', relationship: 'Mother', phone: '+1 (555) 765-4321' },
      employeeId: 'EMP-103',
      department: 'Engineering',
      designation: 'Engineering Manager',
      employmentType: 'Full-Time',
      joiningDate: '2018-10-10',
      reportingManagerId: null,
      salary: 160000,
      status: 'Active',
    },
    {
      key: 'emp-104',
      firstName: 'Jessica',
      lastName: 'Carter',
      email: 'jessica.carter@company.com',
      phone: '+1 (555) 456-7890',
      dob: '1990-01-30',
      gender: 'Female',
      address: '222 Birch Ln, San Francisco, CA',
      emergencyContact: { name: 'William Carter', relationship: 'Father', phone: '+1 (555) 654-3210' },
      employeeId: 'EMP-104',
      department: 'HR',
      designation: 'HR Lead',
      employmentType: 'Full-Time',
      joiningDate: '2020-02-15',
      reportingManagerId: null,
      salary: 95000,
      status: 'Active',
    },
    {
      key: 'emp-105',
      firstName: 'Michael',
      lastName: 'Chang',
      email: 'michael.chang@company.com',
      phone: '+1 (555) 567-8901',
      dob: '1994-07-19',
      gender: 'Male',
      address: '333 Elm St, Redwood City, CA',
      emergencyContact: { name: 'Judy Chang', relationship: 'Sister', phone: '+1 (555) 543-2109' },
      employeeId: 'EMP-105',
      department: 'Engineering',
      designation: 'QA Lead / Team Lead',
      employmentType: 'Full-Time',
      joiningDate: '2021-08-01',
      reportingManagerId: null,
      salary: 105000,
      status: 'Active',
    },
    {
      key: 'emp-106',
      firstName: 'Liam',
      lastName: "O'Connor",
      email: 'liam.oconnor@company.com',
      phone: '+1 (555) 678-9012',
      dob: '1996-12-05',
      gender: 'Male',
      address: '12 Forest Hill Rd, San Francisco, CA',
      emergencyContact: { name: "Patricia O'Connor", relationship: 'Mother', phone: '+1 (555) 432-1098' },
      employeeId: 'EMP-106',
      department: 'Marketing',
      designation: 'Marketing Associate',
      employmentType: 'Full-Time',
      joiningDate: '2023-01-10',
      reportingManagerId: null,
      salary: 75000,
      status: 'Active',
    },
    {
      key: 'emp-107',
      firstName: 'Sophia',
      lastName: 'Patel',
      email: 'sophia.patel@company.com',
      phone: '+1 (555) 789-0123',
      dob: '1995-09-14',
      gender: 'Female',
      address: '888 View Dr, Daly City, CA',
      emergencyContact: { name: 'Rajesh Patel', relationship: 'Father', phone: '+1 (555) 321-0987' },
      employeeId: 'EMP-107',
      department: 'Engineering',
      designation: 'QA Analyst',
      employmentType: 'Full-Time',
      joiningDate: '2023-05-18',
      reportingManagerId: null,
      salary: 82000,
      status: 'Active',
    },
    {
      key: 'emp-108',
      firstName: 'Emily',
      lastName: 'Sanders',
      email: 'emily.sanders@company.com',
      phone: '+1 (555) 890-1234',
      dob: '1991-05-22',
      gender: 'Female',
      address: '555 Summit Rd, San Mateo, CA',
      emergencyContact: { name: 'John Sanders', relationship: 'Brother', phone: '+1 (555) 210-9876' },
      employeeId: 'EMP-108',
      department: 'Marketing',
      designation: 'Marketing Manager',
      employmentType: 'Full-Time',
      joiningDate: '2020-09-01',
      reportingManagerId: null,
      salary: 105000,
      status: 'Active',
    },
    {
      key: 'emp-109',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@company.com',
      phone: '+1 (555) 901-2345',
      dob: '1992-10-02',
      gender: 'Male',
      address: '142 Marina Blvd, San Francisco, CA',
      emergencyContact: { name: 'Clara Wilson', relationship: 'Mother', phone: '+1 (555) 109-8765' },
      employeeId: 'EMP-109',
      department: 'Operations',
      designation: 'Operations Specialist',
      employmentType: 'Full-Time',
      joiningDate: '2022-07-15',
      reportingManagerId: null,
      salary: 80000,
      status: 'Active',
    },
    {
      key: 'emp-110',
      firstName: 'Daniel',
      lastName: 'Craig',
      email: 'daniel.craig@company.com',
      phone: '+1 (555) 012-3456',
      dob: '1985-03-02',
      gender: 'Male',
      address: '246 Sky Way, Richmond, CA',
      emergencyContact: { name: 'Rachel Craig', relationship: 'Sister', phone: '+1 (555) 098-7654' },
      employeeId: 'EMP-110',
      department: 'Engineering',
      designation: 'Systems Architect',
      employmentType: 'Contract',
      joiningDate: '2024-01-15',
      reportingManagerId: null,
      salary: 130000,
      status: 'Active',
    },
  ];

  const employeeDocs = await Employee.insertMany(demoEmployees);
  logger.info(`✅ Seeded ${employeeDocs.length} employees`);

  const idByKey = new Map<string, string>();
  const idByName = new Map<string, string>();
  employeeDocs.forEach((doc, index) => {
    idByKey.set(demoEmployees[index].key, doc._id.toString());
    idByName.set(`${demoEmployees[index].firstName} ${demoEmployees[index].lastName}`, doc._id.toString());
  });

  // Set reporting managers (emp-103 manages emp-101/105/107/110, emp-102 manages 106/108/109, emp-105 manages 107)
  await Employee.updateMany({ employeeId: { $in: ['EMP-101', 'EMP-105', 'EMP-107', 'EMP-110'] } }, { reportingManagerId: idByKey.get('emp-103') });
  await Employee.updateMany({ employeeId: { $in: ['EMP-106', 'EMP-108', 'EMP-109'] } }, { reportingManagerId: idByKey.get('emp-102') });
  await Employee.updateOne({ employeeId: 'EMP-107' }, { reportingManagerId: idByKey.get('emp-105') });

  // ---------- Users ----------
  const demoUsers: Array<{ name: string; email: string; role: string; employeeName?: string }> = [
    { name: 'Alex Rivera', email: 'alex@techmandu.com', role: 'Super Admin', employeeName: 'Alex Rivera' },
    { name: 'Elena Rostova', email: 'elena@techmandu.com', role: 'HR' },
    { name: 'David Kim', email: 'david@techmandu.com', role: 'Employee' },
  ];

  await Promise.all(
    demoUsers.map((u) =>
      User.create({
        name: u.name,
        email: u.email,
        password: DEMO_PASSWORD,
        role: u.role,
        employeeId: u.employeeName ? (idByName.get(u.employeeName) ?? null) : null,
        isActive: true,
      }),
    ),
  );
  logger.info(`✅ Seeded ${demoUsers.length} users (password: ${DEMO_PASSWORD})`);

  // ---------- Rosters (today ± 3 days) ----------
  const rosterDocs: Array<Record<string, unknown>> = [];
  for (let offset = -3; offset <= 3; offset += 1) {
    rosterDocs.push(
      {
        employeeIds: ['emp-101', 'emp-105', 'emp-107', 'emp-110'].map((k) => idByKey.get(k)),
        department: 'Engineering',
        shiftType: 'Morning',
        startTime: '08:00',
        endTime: '17:00',
        location: 'San Francisco Office',
        date: dateStr(offset),
        recurring: true,
      },
      {
        employeeIds: ['emp-106', 'emp-108'].map((k) => idByKey.get(k)),
        department: 'Marketing',
        shiftType: 'Flexible',
        startTime: '09:00',
        endTime: '18:00',
        location: 'Remote',
        date: dateStr(offset),
        recurring: false,
      },
      {
        employeeIds: ['emp-102', 'emp-109'].map((k) => idByKey.get(k)),
        department: 'Operations',
        shiftType: 'Evening',
        startTime: '14:00',
        endTime: '23:00',
        location: 'San Jose Logistics Hub',
        date: dateStr(offset),
        recurring: true,
      },
    );
  }
  await Roster.insertMany(rosterDocs);
  logger.info(`✅ Seeded ${rosterDocs.length} rosters`);

  // ---------- Attendance (yesterday + today) ----------
  const attendanceDocs = [
    { key: 'emp-101', offset: -1, in: '08:02:11', out: '17:05:44', status: 'Present', hours: 9.05 },
    { key: 'emp-105', offset: -1, in: '07:58:34', out: '17:01:10', status: 'Present', hours: 9.04 },
    { key: 'emp-107', offset: -1, in: '08:15:22', out: '17:00:15', status: 'Late', hours: 8.75, notes: 'Heavy traffic on Bay Bridge.' },
    { key: 'emp-109', offset: -1, in: '14:02:44', out: '23:01:05', status: 'Present', hours: 8.97 },
    { key: 'emp-101', offset: 0, in: '08:01:05', out: null, status: 'Present', hours: 0 },
    { key: 'emp-105', offset: 0, in: '07:55:12', out: null, status: 'Present', hours: 0 },
    { key: 'emp-107', offset: 0, in: '08:04:19', out: null, status: 'Present', hours: 0 },
    { key: 'emp-109', offset: 0, in: '14:10:30', out: null, status: 'Late', hours: 0, notes: 'Public transport delayed.' },
  ];

  await Attendance.insertMany(
    attendanceDocs.map((a) => ({
      employeeId: idByKey.get(a.key),
      checkInTime: isoStr(a.offset, a.in),
      checkOutTime: a.out ? isoStr(a.offset, a.out) : null,
      date: dateStr(a.offset),
      status: a.status,
      workingHours: a.hours,
      locationType: 'Onsite',
    })),
  );
  logger.info(`✅ Seeded ${attendanceDocs.length} attendance records`);

  // ---------- Onboarding ----------
  await Onboarding.insertMany([
    {
      personalDetails: {
        firstName: 'Clarissa',
        lastName: 'Zhao',
        dob: '1997-08-25',
        gender: 'Female',
        phone: '+1 (555) 345-0987',
        email: 'clarissa.zhao@candidate.com',
        address: '77 Ocean Ave, San Francisco, CA',
        emergencyContact: 'Timothy Zhao (Father) - +1 (555) 765-0987',
      },
      employmentInfo: {
        employeeId: 'EMP-111',
        department: 'Engineering',
        designation: 'Frontend Engineer',
        employmentType: 'Full-Time',
        joiningDate: dateStr(7),
        reportingManagerId: idByKey.get('emp-103'),
        salary: 102000,
      },
      documents: { citizenshipVerified: true, passportVerified: true, contractSigned: true, bankDetailsSubmitted: true },
      assetsAllocated: { laptop: true, idCard: true, simCard: false, accessCard: true },
      checklist: { emailCreated: true, payrollAdded: true, systemAccessGranted: true, trainingCompleted: false },
      currentStep: 3,
      isCompleted: false,
    },
    {
      personalDetails: {
        firstName: 'Marcus',
        lastName: 'Brody',
        dob: '1992-02-14',
        gender: 'Male',
        phone: '+1 (555) 678-3214',
        email: 'marcus.brody@candidate.com',
        address: '109 Hills Dr, Sunnyvale, CA',
        emergencyContact: 'Sarah Brody (Spouse) - +1 (555) 234-5671',
      },
      employmentInfo: {
        employeeId: 'EMP-112',
        department: 'Marketing',
        designation: 'Content Creator',
        employmentType: 'Full-Time',
        joiningDate: dateStr(12),
        reportingManagerId: idByKey.get('emp-102'),
        salary: 68000,
      },
      documents: { citizenshipVerified: true, passportVerified: false, contractSigned: false, bankDetailsSubmitted: false },
      assetsAllocated: { laptop: false, idCard: false, simCard: false, accessCard: false },
      checklist: { emailCreated: false, payrollAdded: false, systemAccessGranted: false, trainingCompleted: false },
      currentStep: 1,
      isCompleted: false,
    },
  ]);
  logger.info('✅ Seeded 2 onboarding profiles');

  // ---------- Offboarding ----------
  await Offboarding.insertMany([
    {
      employeeId: idByKey.get('emp-110'),
      lastWorkingDay: dateStr(10),
      reason: 'Contract end & pursuing full-time opportunity elsewhere.',
      noticePeriod: 14,
      feedback: 'Had a great experience working with the engineering team. Systems are solid.',
      clearanceStatus: { hr: 'Approved', finance: 'Pending', it: 'Approved', operations: 'Pending' },
      assetsReturned: { laptop: true, monitor: false, accessCard: true, simCard: false },
      exitInterview: {
        companyFeedback: 'Excellent engineering leadership and flexible hours.',
        suggestions: 'Better cross-department tooling would prevent silos.',
        rehireEligibility: 'Yes',
      },
      currentStep: 1,
      isCompleted: false,
    },
  ]);
  logger.info('✅ Seeded 1 offboarding profile');

  // ---------- Tasks ----------
  await Task.insertMany([
    {
      title: 'Migrate DB indexes for query speedup',
      description: 'Create composites on employeeId + date in attendance log to optimize roster reports loading speeds.',
      assignedToId: idByKey.get('emp-101'),
      assignedByName: 'David Vance',
      priority: 'High',
      dueDate: dateStr(0),
      estimatedHours: 4,
      status: 'In Progress',
      attachments: [{ name: 'db_schema_v2.png', size: '245 KB', url: '#' }],
      tags: ['Database', 'Refactor'],
      comments: [
        {
          authorId: idByKey.get('emp-103'),
          authorName: 'David Vance',
          authorRole: 'Manager',
          text: 'Alex, make sure to test with a dry run on staging first to verify lock times.',
        },
      ],
    },
    {
      title: 'Review Clarissa Onboarding Docs',
      description: 'Double check verified PAN/Passport details and activate SSO email.',
      assignedToId: idByKey.get('emp-104'),
      assignedByName: 'Jessica Carter',
      priority: 'Medium',
      dueDate: dateStr(1),
      estimatedHours: 2,
      status: 'Assigned',
      attachments: [],
      tags: ['HR', 'Onboarding'],
      comments: [],
    },
    {
      title: 'Execute Logistics Audit in San Jose Hub',
      description: 'Count physical access cards, check camera coverage, and cross-reference active evening shift attendance.',
      assignedToId: idByKey.get('emp-109'),
      assignedByName: 'Sarah Jenkins',
      priority: 'Critical',
      dueDate: dateStr(0),
      estimatedHours: 6,
      status: 'Pending',
      attachments: [{ name: 'audit_instructions.pdf', size: '1.2 MB', url: '#' }],
      tags: ['Ops', 'Compliance'],
      comments: [
        {
          authorId: idByKey.get('emp-102'),
          authorName: 'Sarah Jenkins',
          authorRole: 'Team Lead',
          text: 'James, upload the access card checklist immediately after completing the count.',
        },
      ],
    },
    {
      title: 'Write Q3 Marketing Outreach Draft',
      description: 'Complete initial draft outlining social postings, newsletter blasts, and ad copy targets.',
      assignedToId: idByKey.get('emp-106'),
      assignedByName: 'Emily Sanders',
      priority: 'Low',
      dueDate: dateStr(4),
      estimatedHours: 8,
      status: 'Completed',
      attachments: [],
      tags: ['Marketing', 'Copywriting'],
      comments: [],
    },
  ]);
  logger.info('✅ Seeded 4 tasks');

  // ---------- Leaves ----------
  await Leave.insertMany([
    {
      employeeId: idByKey.get('emp-101'),
      employeeName: 'Alex Rivera',
      startDate: dateStr(2),
      endDate: dateStr(4),
      leaveType: 'Annual Leave',
      reason: 'Family trip to Hawaii',
      status: 'Pending',
    },
    {
      employeeId: idByKey.get('emp-105'),
      employeeName: 'Michael Chang',
      startDate: dateStr(0),
      endDate: dateStr(0),
      leaveType: 'Sick Leave',
      reason: 'Dental procedure appointment',
      status: 'Approved',
      actionedAt: isoStr(-1, '09:15:00'),
      managerNotes: 'Approved. Take care.',
    },
    {
      employeeId: idByKey.get('emp-108'),
      employeeName: 'Emily Sanders',
      startDate: dateStr(7),
      endDate: dateStr(8),
      leaveType: 'Casual Leave',
      reason: 'Personal matters',
      status: 'Rejected',
      actionedAt: isoStr(-1, '11:00:00'),
      managerNotes: 'We have crucial server patching operations on those days.',
    },
  ]);
  logger.info('✅ Seeded 3 leave requests');

  // ---------- Recruitment ----------
  const applications = await JobApplication.insertMany([
    {
      candidateName: 'Dianne Russell',
      email: 'dianne.russell@example.com',
      phone: '+1 (555) 019-2834',
      roleApplied: 'Senior UI/UX Designer',
      stage: 'Hired',
      experienceYears: 6,
      appliedDate: dateStr(-23),
      rating: 5,
      source: 'LinkedIn',
      notes: 'Outstanding portfolio. Strong feedback from design leads. Offered and accepted!',
    },
    {
      candidateName: 'Guy Hawkins',
      email: 'guy.hawkins@example.com',
      phone: '+1 (555) 014-9384',
      roleApplied: 'Frontend Engineer',
      stage: 'Technical Round',
      experienceYears: 4,
      appliedDate: dateStr(-7),
      rating: 4,
      source: 'Indeed',
      notes: 'Excellent Javascript fundamentals. Progressing to system design review.',
    },
    {
      candidateName: 'Kristin Watson',
      email: 'kristin.watson@example.com',
      phone: '+1 (555) 017-4829',
      roleApplied: 'Backend Developer',
      stage: 'Screening',
      experienceYears: 3,
      appliedDate: dateStr(0),
      rating: 3,
      source: 'Referral',
      notes: 'Referred by Sophia Patel. Good knowledge of Python and FastAPI.',
    },
    {
      candidateName: 'Eleanor Pena',
      email: 'eleanor.pena@example.com',
      phone: '+1 (555) 012-4821',
      roleApplied: 'Product Designer',
      stage: 'Manager Round',
      experienceYears: 5,
      appliedDate: dateStr(-10),
      rating: 5,
      source: 'LinkedIn',
      notes: 'Exceptional visual design sense. High culture-fit potential.',
    },
    {
      candidateName: 'Devon Lane',
      email: 'devon.lane@example.com',
      phone: '+1 (555) 018-3829',
      roleApplied: 'DevOps Architect',
      stage: 'Offer Extended',
      experienceYears: 8,
      appliedDate: dateStr(-20),
      rating: 5,
      source: 'Direct Sourcing',
      notes: 'Commanding knowledge of Kubernetes, Terraform, and cloud run routing structures.',
    },
    {
      candidateName: 'Courtney Henry',
      email: 'courtney.henry@example.com',
      phone: '+1 (555) 013-8472',
      roleApplied: 'Fullstack developer',
      stage: 'Hired',
      experienceYears: 5,
      appliedDate: dateStr(-12),
      rating: 4,
      source: 'Indeed',
      notes: 'Solid Node.js + React capability. Joined operations engineering team.',
    },
    {
      candidateName: 'Bessie Cooper',
      email: 'bessie.cooper@example.com',
      phone: '+1 (555) 016-9284',
      roleApplied: 'QA Lead',
      stage: 'Rejected',
      experienceYears: 6,
      appliedDate: dateStr(-20),
      rating: 2,
      source: 'LinkedIn',
      notes: 'Lacked hands-on automation experience with modern frameworks like Playwright.',
    },
  ]);
  logger.info(`✅ Seeded ${applications.length} job applications`);

  const appIdByCandidate = new Map<string, string>();
  applications.forEach((app) => appIdByCandidate.set(app.candidateName, app._id.toString()));

  await UpcomingInterview.insertMany([
    {
      applicationId: appIdByCandidate.get('Guy Hawkins'),
      candidateName: 'Guy Hawkins',
      roleApplied: 'Frontend Engineer',
      interviewDate: dateStr(9),
      interviewTime: '09:00',
      interviewType: 'Technical Coding',
      interviewers: ['Alex Rivera', 'Michael Chang'],
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'Scheduled',
      notes: 'Vite & Tailwind styling deep-dive.',
    },
    {
      applicationId: appIdByCandidate.get('Kristin Watson'),
      candidateName: 'Kristin Watson',
      roleApplied: 'Backend Developer',
      interviewDate: dateStr(9),
      interviewTime: '10:00',
      interviewType: 'Screening',
      interviewers: ['Jessica Carter'],
      meetingLink: 'https://meet.google.com/qwe-rtyu-iop',
      status: 'Scheduled',
      notes: 'Initial HR screen and core values alignment.',
    },
    {
      applicationId: appIdByCandidate.get('Eleanor Pena'),
      candidateName: 'Eleanor Pena',
      roleApplied: 'Product Designer',
      interviewDate: dateStr(9),
      interviewTime: '11:00',
      interviewType: 'System Design',
      interviewers: ['Emily Sanders', 'Sarah Jenkins'],
      meetingLink: 'https://meet.google.com/zxc-vbnm-asd',
      status: 'Scheduled',
      notes: 'Collaborative Figma workspace live design audit.',
    },
    {
      applicationId: appIdByCandidate.get('Devon Lane'),
      candidateName: 'Devon Lane',
      roleApplied: 'DevOps Architect',
      interviewDate: dateStr(9),
      interviewTime: '11:30',
      interviewType: 'Executive Loop',
      interviewers: ['David Vance', 'Alex Rivera'],
      meetingLink: 'https://meet.google.com/ghj-klmn-opq',
      status: 'Scheduled',
      notes: 'High-availability infrastructure scaling conversation.',
    },
  ]);
  logger.info('✅ Seeded 4 upcoming interviews');

  // ---------- Notifications ----------
  await Notification.insertMany([
    {
      title: 'New Task Assigned',
      message: 'David Vance assigned you: "Migrate DB indexes for query speedup"',
      type: 'task',
      read: false,
      recipientId: idByKey.get('emp-101'),
    },
    {
      title: 'Shift Released',
      message: 'Your morning shift roster for today is active.',
      type: 'shift',
      read: true,
      recipientId: null,
    },
    {
      title: 'Pending Onboarding Check',
      message: 'Clarissa Zhao completed document uploads. Awaiting HR Verification.',
      type: 'hr',
      read: false,
      recipientId: null,
    },
  ]);
  logger.info('✅ Seeded 3 notifications');

  // ---------- Notes ----------
  await Note.insertMany([
    {
      title: 'Morning Shift Handover Rules',
      content: 'Ensure all workstation terminal states are logged. Backups must be validated before signing off. High priority items must be updated on the Kanban board.',
      category: 'Shift Handover',
      color: 'bg-teal-50 hover:bg-teal-100/70 border-teal-200 text-teal-900',
      isPinned: true,
      author: 'Super Admin',
    },
    {
      title: 'Emergency Contacts & Escalation Matrix',
      content: 'IT Infrastructure Issues: Dial ext. 9002.\nFacility/Access Card Errors: Dial ext. 1012.\nHR urgent issues: contact hr-escalations@techmandu.com',
      category: 'Company Policies',
      color: 'bg-indigo-50 hover:bg-indigo-100/70 border-indigo-200 text-indigo-900',
      isPinned: true,
      author: 'HR Admin',
    },
    {
      title: 'Figma Design System Links',
      content: 'The source file for Techmandu v2.0 Design is located in the shared team drive. Follow layout instructions in fig-guide.md. Icons must use Lucide package.',
      category: 'Technical Docs',
      color: 'bg-violet-50 hover:bg-violet-100/70 border-violet-200 text-violet-900',
      isPinned: false,
      author: 'Wolf Pixel',
    },
    {
      title: 'Weekly Task Allocation Guide',
      content: 'Review and assign tickets before Monday 10:00 AM. Any blocker must be flagged with red tags. Track estimated hours vs actual hours.',
      category: 'Technical Docs',
      color: 'bg-amber-50 hover:bg-amber-100/70 border-amber-200 text-amber-900',
      isPinned: false,
      author: 'Manager',
    },
  ]);
  logger.info('✅ Seeded 4 notes');

  // ---------- Chat ----------
  const groups = await ChatGroup.insertMany([
    {
      name: 'Notices & Announcements',
      description: 'Official corporate declarations, updates, and general notes.',
      category: 'Notice',
      memberIds: ['all'],
      createdBy: 'Super Admin',
      isLocked: true,
    },
    {
      name: 'Daily EOD Reporting Group',
      description: 'Post your daily tasks updates and blockers before checking out.',
      category: 'EOD',
      memberIds: ['all'],
      createdBy: 'Manager',
      isLocked: false,
    },
    {
      name: 'General Watercooler',
      description: 'Casual chat, coffee discussions, and announcements.',
      category: 'General',
      memberIds: ['all'],
      createdBy: 'HR Admin',
      isLocked: false,
    },
  ]);
  logger.info(`✅ Seeded ${groups.length} chat groups`);

  await ChatMessage.insertMany([
    {
      groupId: groups[0]._id,
      senderId: 'admin',
      senderName: 'Super Admin',
      senderRole: 'Super Admin',
      text: 'Welcome everyone to our updated Techmandu Workspace! Use this portal to track rosters, log check-ins, manage project tasks, and coordinate with your teammates in these group chats.',
      isNotice: true,
    },
    {
      groupId: groups[0]._id,
      senderId: idByKey.get('emp-104'),
      senderName: 'Jessica Carter',
      senderRole: 'HR',
      text: 'Friendly reminder to complete your daily check-out logs so that hours are calculated precisely for payroll.',
      isNotice: true,
    },
    {
      groupId: groups[1]._id,
      senderId: idByKey.get('emp-103'),
      senderName: 'David Vance',
      senderRole: 'Manager',
      text: 'Hey team, please write your EOD reports here. Formats should highlight: 1. Achieved today, 2. Targets for tomorrow, and 3. Blocker status.',
      isNotice: false,
    },
    {
      groupId: groups[1]._id,
      senderId: idByKey.get('emp-105'),
      senderName: 'Michael Chang',
      senderRole: 'Team Lead',
      text: 'EOD Update:\n1. Done: Reviewed and verified Clarissa onboarding docs.\n2. Next: Sync with system architecture team.\n3. Blockers: None.',
      isNotice: false,
    },
    {
      groupId: groups[2]._id,
      senderId: idByKey.get('emp-104'),
      senderName: 'Jessica Carter',
      senderRole: 'HR',
      text: 'Who is up for a quick team coffee sync at 3 PM today?',
      isNotice: false,
    },
    {
      groupId: groups[2]._id,
      senderId: idByKey.get('emp-101'),
      senderName: 'Alex Rivera',
      senderRole: 'Super Admin',
      text: 'Count me in! I need a short break from compiling the database indexes.',
      isNotice: false,
    },
  ]);
  logger.info('✅ Seeded 6 chat messages');

  // ---------- Projects ----------
  await Project.insertMany([
    {
      name: 'Figma Design System',
      description: 'Establish the core component UI kit, color guidelines, responsive layouts, and modern typography tokens.',
      status: 'Active',
      manager: 'David Vance',
      startDate: dateStr(-64),
      endDate: dateStr(27),
      color: 'bg-indigo-500',
      documents: [
        {
          name: 'Design_Guidelines_v2.pdf',
          size: '4.8 MB',
          uploadedBy: 'Elena Rodriguez',
          uploadedAt: isoStr(-50, '11:00'),
          description: 'Typography scales, palette tokens, and border radius rules.',
        },
        {
          name: 'Figma_Sync_Tokens.json',
          size: '124 KB',
          uploadedBy: 'Alex Rivera',
          uploadedAt: isoStr(-37, '14:30'),
          description: 'Exported JSON variables for Vite build configurations.',
        },
      ],
      sharedVariables: [
        {
          key: 'FIGMA_DEV_TOKEN',
          value: 'fig_d843n7f198h3f9h8a1h37f918g3',
          isSecret: true,
          type: 'Environment',
          description: 'Figma REST API connection credential.',
          updatedBy: 'David Vance',
          updatedAt: isoStr(-63, '09:00'),
        },
        {
          key: 'THEME_COLOR_PRIMARY',
          value: '#0EA5E9',
          isSecret: false,
          type: 'Other',
          description: 'Primary Sky Tailwind theme color.',
          updatedBy: 'Elena Rodriguez',
          updatedAt: isoStr(-53, '10:00'),
        },
      ],
      tasks: [
        {
          title: 'Review Brand Guide compliance',
          description: 'Ensure color token mappings fully align with new corporate palette guidelines.',
          assignedToId: idByKey.get('emp-101'),
          assignedByName: 'Alex Rivera',
          priority: 'High',
          dueDate: dateStr(-15),
          estimatedHours: 5,
          status: 'In Progress',
          attachments: [],
          tags: ['Design', 'Review'],
          comments: [],
        },
        {
          title: 'Export Vector SVG assets',
          description: 'Compile and optimize icons as standalone inline components.',
          assignedToId: idByKey.get('emp-106'),
          assignedByName: "Liam O'Connor",
          priority: 'Low',
          dueDate: dateStr(-10),
          estimatedHours: 8,
          status: 'Assigned',
          attachments: [],
          tags: ['Assets'],
          comments: [],
        },
      ],
    },
    {
      name: 'Keep React Framework',
      description: 'Port older component assets into modern functional typescript modules with built-in Tailwind parameters.',
      status: 'Active',
      manager: 'Michael Chang',
      startDate: dateStr(-86),
      endDate: dateStr(42),
      color: 'bg-emerald-500',
      documents: [
        {
          name: 'Technical_Spec_v1.md',
          size: '18 KB',
          uploadedBy: 'Michael Chang',
          uploadedAt: isoStr(-84, '08:30'),
          description: 'Architectural specifications and framework dependencies.',
        },
      ],
      sharedVariables: [
        {
          key: 'NPM_PUBLISH_SECRET',
          value: 'npm_sh71f28b713bf7821cde098711efab72',
          isSecret: true,
          type: 'Server Creds',
          description: 'Token to publish component library to company repository.',
          updatedBy: 'Michael Chang',
          updatedAt: isoStr(-85, '16:00'),
        },
        {
          key: 'REPO_STAGING_URL',
          value: 'https://staging.registry.company.com',
          isSecret: false,
          type: 'Database',
          description: 'Internal docker registry mirror.',
          updatedBy: 'Daniel Craig',
          updatedAt: isoStr(-81, '09:44'),
        },
      ],
      tasks: [
        {
          title: 'Implement dynamic portal tooltips',
          description: 'Ensure tooltips render relative to overlay elements using popper calculations.',
          assignedToId: idByKey.get('emp-101'),
          assignedByName: 'Alex Rivera',
          priority: 'Medium',
          dueDate: dateStr(-20),
          estimatedHours: 4,
          status: 'In Progress',
          attachments: [],
          tags: ['React', 'Feature'],
          comments: [
            {
              authorId: idByKey.get('emp-105'),
              authorName: 'Michael Chang',
              authorRole: 'Team Lead',
              text: 'Ensure keyboard accessibility (ESC key to close) is supported.',
            },
          ],
        },
        {
          title: 'Write Jest accessibility test specs',
          description: 'Verify screen readers can register dropdown states dynamically.',
          assignedToId: idByKey.get('emp-107'),
          assignedByName: 'Sophia Martinez',
          priority: 'High',
          dueDate: dateStr(-17),
          estimatedHours: 6,
          status: 'Blocked',
          attachments: [],
          tags: ['QA', 'A11y'],
          comments: [],
        },
      ],
    },
    {
      name: 'Static Mania Assets',
      description: 'Develop optimized static landing pages, high contrast layouts, and conversion templates.',
      status: 'Completed',
      manager: 'Sarah Jenkins',
      startDate: dateStr(-184),
      endDate: dateStr(-35),
      color: 'bg-amber-500',
      documents: [
        {
          name: 'SEO_Performance_Report.pdf',
          size: '1.2 MB',
          uploadedBy: "Liam O'Connor",
          uploadedAt: isoStr(-36, '10:00'),
          description: 'Lighthouse scoring audit showing 100/100 performance results.',
        },
      ],
      sharedVariables: [
        {
          key: 'ANALYTICS_MEASUREMENT_ID',
          value: 'G-7F918F9182',
          isSecret: false,
          type: 'Environment',
          description: 'Google Analytics public verification tag.',
          updatedBy: 'Sarah Jenkins',
          updatedAt: isoStr(-175, '11:00'),
        },
      ],
      tasks: [
        {
          title: 'Optimize hero images compression',
          description: 'Convert raw splash screen photos into high fidelity WebP extensions.',
          assignedToId: idByKey.get('emp-106'),
          assignedByName: "Liam O'Connor",
          priority: 'Low',
          dueDate: dateStr(-40),
          estimatedHours: 3,
          status: 'Completed',
          attachments: [],
          tags: ['SEO', 'Media'],
          comments: [],
        },
      ],
    },
  ]);
  logger.info('✅ Seeded 3 projects');

  logger.info('🎉 Seeding complete!');
}

async function main() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    await seed();
  } catch (error) {
    logger.error({ err: error }, 'Seeding failed');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void main();
