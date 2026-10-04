import React, { useState } from 'react';
import { Employee, Roster, Attendance, Task, Role, JobApplication, UpcomingInterview, LeaveRequest } from '../../types';
import WelcomeBanner from './components/WelcomeBanner';
import StatsCards from './components/StatsCards';
import SchedulesToday from './components/SchedulesToday';
import RecruitmentPipeline from './components/RecruitmentPipeline';
import TopPerformers from './components/TopPerformers';
import QuickAttendance from './components/QuickAttendance';
import MiniCalendar from './components/MiniCalendar';
import JobApplicationsBanner from './components/JobApplicationsBanner';

interface DashboardModuleProps {
  employees: Employee[];
  rosters: Roster[];
  attendances: Attendance[];
  tasks: Task[];
  currentRole: Role;
  jobApplications: JobApplication[];
  upcomingInterviews: UpcomingInterview[];
  leaveRequests?: LeaveRequest[];
  currentUserName?: string;
  currentEmployeeId?: string | null;
  onNavigateTab?: (tabId: string) => void;
  onViewRecruitment: () => void;
  onCheckIn?: (locationType: 'Onsite' | 'WFH') => void;
  onCheckOut?: () => void;
}

export default function DashboardModule({
  employees,
  rosters,
  attendances,
  tasks,
  currentRole,
  jobApplications = [],
  upcomingInterviews = [],
  leaveRequests = [],
  currentUserName = 'Wolf Pixel',
  currentEmployeeId,
  onNavigateTab,
  onViewRecruitment,
  onCheckIn,
  onCheckOut
}: DashboardModuleProps) {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'1d' | '7d' | '1m' | '1y' | 'All'>('7d');
  const [activePerformerId, setActivePerformerId] = useState<string | null>(null);

  const realToday = new Date();
  const today = realToday.toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  const activeStaffCount = employees.filter(e => e.status === 'Active').length;
  
  const todayAttendances = attendances.filter(a => a.date === today);
  const presentCount = todayAttendances.filter(a => ['Present', 'Late', 'Half Day'].includes(a.status)).length;
  const onLeaveCount = todayAttendances.filter(a => a.status === 'Leave').length;
  
  const rosteredEmployeeIds = rosters
    .filter(r => r.date === today)
    .reduce((acc, r) => [...acc, ...r.employeeIds], [] as string[]);
  const uniqueRosteredCount = Array.from(new Set(rosteredEmployeeIds)).length;

  const displayAttendance = presentCount;
  const displayAbsent = Math.max(0, uniqueRosteredCount - presentCount);
  const displayLeaveApply = leaveRequests.filter(l => l.status === 'Pending').length;

  const dayOfWeek = (realToday.getDay() + 6) % 7;
  const monday = new Date(realToday);
  monday.setDate(realToday.getDate() - dayOfWeek);
  const WEEK_DAYS = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3),
      num: String(d.getDate()).padStart(2, '0'),
      dateStr: iso
    };
  });
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekPeriodLabel = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const monthLabel = monday.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const dayRosters = rosters.filter(r => r.date === selectedDate);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      <WelcomeBanner 
        currentUserName={currentUserName} 
        weekPeriodLabel={weekPeriodLabel}
        onNavigateTab={onNavigateTab}
      />

      <StatsCards 
        displayAttendance={displayAttendance}
        displayAbsent={displayAbsent}
        displayLeaveApply={displayLeaveApply}
        onNavigateTab={onNavigateTab}
      />

      <SchedulesToday
        selectedDate={selectedDate}
        today={today}
        dayRosters={dayRosters}
        employees={employees}
        currentRole={currentRole}
        onNavigateTab={onNavigateTab}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecruitmentPipeline
            selectedTimeFilter={selectedTimeFilter}
            setSelectedTimeFilter={setSelectedTimeFilter}
            jobApplications={jobApplications}
          />

          <TopPerformers
            employees={employees}
            tasks={tasks}
            selectedTimeFilter={selectedTimeFilter}
            setSelectedTimeFilter={setSelectedTimeFilter}
            activePerformerId={activePerformerId}
            setActivePerformerId={setActivePerformerId}
            onNavigateTab={onNavigateTab}
          />
        </div>

        <div className="space-y-6">
          <QuickAttendance
            onCheckIn={onCheckIn}
            onCheckOut={onCheckOut}
          />

          <MiniCalendar
            monthLabel={monthLabel}
            WEEK_DAYS={WEEK_DAYS}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />

          <JobApplicationsBanner
            jobApplications={jobApplications}
            upcomingInterviews={upcomingInterviews}
            onViewRecruitment={onViewRecruitment}
          />
        </div>
      </div>
    </div>
  );
}
