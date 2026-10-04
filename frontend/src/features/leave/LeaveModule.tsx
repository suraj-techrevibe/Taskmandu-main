import React, { useState } from 'react';
import { Employee, LeaveRequest, Role, Roster, Attendance } from '../../types';
import {
  Calendar,
  Check,
  X,
  Plus,
  Clock,
  FileText,
  AlertTriangle,
  Umbrella,
  CalendarDays,
  UserCheck,
  Plane,
  HeartPulse,
  Briefcase,
  HelpCircle,
  FileCheck,
  Loader2
} from 'lucide-react';
import { useServerList } from '../../hooks/useServerList';
import Pager from '../../components/list/Pager';
import { listLeavePage } from '../../services/leave';

interface LeaveModuleProps {
  leaveRequests: LeaveRequest[];
  employees: Employee[];
  currentRole: Role;
  currentEmployeeId?: string | null;
  onAddLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status' | 'employeeName'>) => void;
  onActionLeaveRequest: (id: string, status: 'Approved' | 'Rejected', notes: string) => void;
  rosters: Roster[];
  attendances: Attendance[];
}

export default function LeaveModule({
  leaveRequests,
  employees,
  currentRole,
  currentEmployeeId,
  onAddLeaveRequest,
  onActionLeaveRequest,
  rosters,
  attendances
}: LeaveModuleProps) {
  // Real current date (local timezone) used for date inputs and the calendar
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  // Tabs for managing views
  const [activeSubTab, setActiveSubTab] = useState<'my-leaves' | 'manager-review'>('my-leaves');

  // Manager approvals table — server-driven (status, employee, leave type, pagination)
  const review = useServerList({
    fetcher: ({ page, limit, sortBy, sortOrder, filters }) =>
      listLeavePage({
        page,
        limit,
        sortBy,
        sortOrder,
        status: filters.status || undefined,
        employeeId: filters.employeeId || undefined,
        leaveType: filters.leaveType || undefined,
      }),
    defaultLimit: 10,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });
  
  // Submit leave request form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState<'Sick Leave' | 'Casual Leave' | 'Annual Leave' | 'Maternity/Paternity Leave' | 'Unpaid Leave'>('Annual Leave');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Manager action state
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [managerActionType, setManagerActionType] = useState<'Approved' | 'Rejected' | null>(null);
  const [managerNotesInput, setManagerNotesInput] = useState('');

  // Logged-in employee (linked employeeId from the API)
  const currentUserEmployeeId = currentEmployeeId ?? '';

  // Derive leave requests based on roles and filters
  const myRequests = leaveRequests.filter(r => r.employeeId === currentUserEmployeeId);

  // Leave policy totals (annual policy entitlements)
  const totalAnnual = 15;
  const totalSick = 8;
  const totalCasual = 7;

  const usedAnnual = leaveRequests
    .filter(r => r.employeeId === currentUserEmployeeId && r.leaveType === 'Annual Leave' && r.status === 'Approved')
    .reduce((acc, r) => acc + getDaysBetween(r.startDate, r.endDate), 0);

  const usedSick = leaveRequests
    .filter(r => r.employeeId === currentUserEmployeeId && r.leaveType === 'Sick Leave' && r.status === 'Approved')
    .reduce((acc, r) => acc + getDaysBetween(r.startDate, r.endDate), 0);

  const usedCasual = leaveRequests
    .filter(r => r.employeeId === currentUserEmployeeId && r.leaveType === 'Casual Leave' && r.status === 'Approved')
    .reduce((acc, r) => acc + getDaysBetween(r.startDate, r.endDate), 0);

  function getDaysBetween(start: string, end: string): number {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    return isNaN(diffDays) ? 0 : diffDays;
  }

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!startDate || !endDate) {
      setFormError('Please select both start and end dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start date cannot be after the end date.');
      return;
    }

    if (!reason.trim()) {
      setFormError('Please state a reason for your leave request.');
      return;
    }

    // Call submit leave handler
    onAddLeaveRequest({
      employeeId: currentUserEmployeeId,
      startDate,
      endDate,
      leaveType,
      reason
    });

    setFormSuccess('Leave request submitted successfully for approval!');
    setStartDate('');
    setEndDate('');
    setReason('');
    
    // Automatically fade success alert after 4 seconds
    setTimeout(() => {
      setFormSuccess('');
    }, 4000);
  };

  const handleOpenActionModal = (id: string, action: 'Approved' | 'Rejected') => {
    setSelectedRequestId(id);
    setManagerActionType(action);
    setManagerNotesInput('');
  };

  const handleConfirmAction = () => {
    if (!selectedRequestId || !managerActionType) return;
    onActionLeaveRequest(selectedRequestId, managerActionType, managerNotesInput);
    review.refresh();
    setSelectedRequestId(null);
    setManagerActionType(null);
    setManagerNotesInput('');
  };

  const getLeaveIcon = (type: string) => {
    switch (type) {
      case 'Sick Leave':
        return <HeartPulse className="w-4 h-4 text-rose-500" />;
      case 'Annual Leave':
        return <Plane className="w-4 h-4 text-emerald-500" />;
      case 'Casual Leave':
        return <Umbrella className="w-4 h-4 text-blue-500" />;
      default:
        return <Briefcase className="w-4 h-4 text-slate-500" />;
    }
  };

  // Check if role is manager/admin
  const isManagerOrAdmin = currentRole === 'Super Admin' || currentRole === 'HR' || currentRole === 'Manager';

  return (
    <div className="space-y-6">
      {/* Overview Intro Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Leave & Absences</h2>
            <p className="text-xs text-slate-500">
              Submit planned absences, track your remaining balances, and review team schedules.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab('my-leaves')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                activeSubTab === 'my-leaves'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              My Leaves
            </button>
            {isManagerOrAdmin && (
              <button
                onClick={() => setActiveSubTab('manager-review')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer relative ${
                  activeSubTab === 'manager-review'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Leave Requests
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                  {leaveRequests.filter(r => r.status === 'Pending').length}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {activeSubTab === 'my-leaves' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Leave balances & request form (Col Span 1) */}
          <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leave Balances</h3>
              
              <div className="space-y-3">
                {/* Annual */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-50 rounded-md">
                      <Plane className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Annual Leave</p>
                      <p className="text-[10px] text-slate-400">Planned Holidays</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900">{totalAnnual - usedAnnual} / {totalAnnual}</p>
                    <p className="text-[10px] text-slate-400">Days Left</p>
                  </div>
                </div>

                {/* Sick */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-rose-50 rounded-md">
                      <HeartPulse className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Sick Leave</p>
                      <p className="text-[10px] text-slate-400">Medical emergencies</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900">{totalSick - usedSick} / {totalSick}</p>
                    <p className="text-[10px] text-slate-400">Days Left</p>
                  </div>
                </div>

                {/* Casual */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 rounded-md">
                      <Umbrella className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Casual Leave</p>
                      <p className="text-[10px] text-slate-400">Unforeseen personal</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900">{totalCasual - usedCasual} / {totalCasual}</p>
                    <p className="text-[10px] text-slate-400">Days Left</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Submission Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">File Leave Request</h3>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-150 rounded-lg flex items-start gap-2 text-rose-800 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-lg flex items-start gap-2 text-emerald-800 text-xs font-medium">
                  <FileCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSubmitLeave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Leave Category</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Annual Leave">Annual Leave (Vacation)</option>
                    <option value="Sick Leave">Sick Leave (Medical)</option>
                    <option value="Casual Leave">Casual Leave (Personal)</option>
                    <option value="Maternity/Paternity Leave">Maternity / Paternity Leave</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={todayStr}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || todayStr}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {startDate && endDate && (
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 italic">
                      Total Leave Duration: <strong className="text-indigo-600 font-bold">{getDaysBetween(startDate, endDate)}</strong> days
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Reason / Description</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide details about your absence request..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Submit Absence Request
                </button>
              </form>
            </div>
          </div>

          {/* Leave History List (Col Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Absence History</h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold px-2 py-1 rounded">
                  {myRequests.length} Requests
                </span>
              </div>

              {myRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Umbrella className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-semibold">No leave requests found.</p>
                  <p className="text-[10px]">Use the submission form to create your first absence request.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150">
                        <th className="py-3 px-2 font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Type</th>
                        <th className="py-3 px-2 font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Dates</th>
                        <th className="py-3 px-2 font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Reason</th>
                        <th className="py-3 px-2 font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Status</th>
                        <th className="py-3 px-2 font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.map((req) => {
                        const daysCount = getDaysBetween(req.startDate, req.endDate);
                        return (
                          <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td className="py-3.5 px-2">
                              <div className="flex items-center gap-2">
                                {getLeaveIcon(req.leaveType)}
                                <span className="font-bold text-slate-800">{req.leaveType}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-2">
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-800">
                                  {req.startDate === req.endDate ? req.startDate : `${req.startDate} to ${req.endDate}`}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">{daysCount} {daysCount === 1 ? 'day' : 'days'}</p>
                              </div>
                            </td>
                            <td className="py-3.5 px-2 max-w-[200px] truncate" title={req.reason}>
                              <span className="text-slate-600 font-medium">{req.reason}</span>
                            </td>
                            <td className="py-3.5 px-2">
                              <span
                                className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase ${
                                  req.status === 'Approved'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : req.status === 'Rejected'
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-2">
                              {req.managerNotes ? (
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded text-[10px] leading-relaxed text-slate-500 max-w-[150px]">
                                  <span className="font-bold text-slate-700 block">Manager Notes:</span>
                                  {req.managerNotes}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No notes</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Calendar Visualization of Leave & Shift Blocks */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dynamic Calendar Overview</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Reviewing active shift rosters and approved absences for {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Approved leave periods automatically override rosters and mark you as <strong>On Leave</strong>.
              </p>

              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="font-extrabold text-slate-400 uppercase py-1">{d}</div>
                ))}

                {/* Real month calendar: offset to the weekday of the 1st */}
                {Array.from({ length: new Date(now.getFullYear(), now.getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`pad-${i}`} className="bg-slate-50/50 rounded-lg p-2 min-h-[50px] opacity-40"></div>
                ))}

                {Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() }).map((_, index) => {
                  const dayNum = index + 1;
                  const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

                  // Check if on leave
                  const approvedLeave = leaveRequests.find(
                    r => r.employeeId === currentUserEmployeeId && r.status === 'Approved' && dateString >= r.startDate && dateString <= r.endDate
                  );
                  const pendingLeave = leaveRequests.find(
                    r => r.employeeId === currentUserEmployeeId && r.status === 'Pending' && dateString >= r.startDate && dateString <= r.endDate
                  );

                  // Check if scheduled
                  const activeSchedule = rosters.find(
                    r => r.employeeIds.includes(currentUserEmployeeId) && r.date === dateString
                  );

                  return (
                    <div
                      key={dayNum}
                      className={`p-2 rounded-lg min-h-[60px] border flex flex-col justify-between text-left transition ${
                        dateString === todayStr
                          ? 'border-indigo-600 bg-indigo-50/30'
                          : 'border-slate-100 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-[10px] font-extrabold ${dateString === todayStr ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {dayNum} {dateString === todayStr ? ' (Today)' : ''}
                      </span>

                      <div className="space-y-1 mt-1">
                        {approvedLeave ? (
                          <span className="block text-[8px] font-bold bg-emerald-100 text-emerald-800 rounded px-1 text-center truncate">
                            🏝️ On Leave
                          </span>
                        ) : pendingLeave ? (
                          <span className="block text-[8px] font-bold bg-amber-100 text-amber-800 rounded px-1 text-center truncate">
                            ⏳ Pending
                          </span>
                        ) : activeSchedule ? (
                          <span className="block text-[8px] font-bold bg-indigo-100 text-indigo-800 rounded px-1 text-center truncate">
                            💼 {activeSchedule.shiftType}
                          </span>
                        ) : (
                          <span className="block text-[8px] font-medium text-slate-300 px-1 text-center">
                            Rest Day
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Manager Approvals View */
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Decision</p>
                <p className="text-xl font-extrabold text-slate-800">
                  {leaveRequests.filter(r => r.status === 'Pending').length}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Absences</p>
                <p className="text-xl font-extrabold text-slate-800">
                  {leaveRequests.filter(r => r.status === 'Approved').length}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currently On Leave Today</p>
                <p className="text-xl font-extrabold text-indigo-600">
                  {leaveRequests.filter(r => r.status === 'Approved' && todayStr >= r.startDate && todayStr <= r.endDate).length}
                </p>
              </div>
            </div>
          </div>

          {/* Leave List Review Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Team Leave Requests</h3>

              {/* Filter controls */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                <select
                  value={review.filters.employeeId ?? ''}
                  onChange={(e) => review.setFilter('employeeId', e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer"
                  title="Filter by employee"
                >
                  <option value="">All employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>

                <select
                  value={review.filters.leaveType ?? ''}
                  onChange={(e) => review.setFilter('leaveType', e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer"
                  title="Filter by leave type"
                >
                  <option value="">All leave types</option>
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Annual Leave</option>
                  <option>Maternity/Paternity Leave</option>
                  <option>Unpaid Leave</option>
                </select>

                <div className="flex gap-1">
                  {['all', 'pending', 'approved', 'rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => review.setFilter('status', status === 'all' ? '' : status.charAt(0).toUpperCase() + status.slice(1))}
                      className={`px-3 py-1 rounded text-xs font-semibold capitalize border cursor-pointer transition ${
                        (status === 'all' && !review.filters.status) || review.filters.status?.toLowerCase() === status
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {review.loading ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin opacity-60" />
                <p className="text-xs font-semibold">Loading leave requests…</p>
              </div>
            ) : review.items.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <CalendarDays className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-semibold">No leave requests found matching this filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150">
                      <th className="py-3 px-2 font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Employee</th>
                      <th className="py-3 px-2 font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Leave Type</th>
                      <th className="py-3 px-2 font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Duration</th>
                      <th className="py-3 px-2 font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Reason</th>
                      <th className="py-3 px-2 font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Status</th>
                      <th className="py-3 px-2 font-extrabold text-slate-400 uppercase text-[9px] tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {review.items.map((req) => {
                      const emp = employees.find(e => e.id === req.employeeId);
                      const daysCount = getDaysBetween(req.startDate, req.endDate);

                      return (
                        <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="py-3.5 px-2">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-slate-200 font-extrabold text-slate-800 flex items-center justify-center text-[10px]">
                                {emp ? `${emp.firstName[0]}${emp.lastName[0]}` : '??'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{req.employeeName}</p>
                                <p className="text-[10px] text-slate-400">{emp?.designation || 'Staff'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <div className="flex items-center gap-1.5">
                              {getLeaveIcon(req.leaveType)}
                              <span className="font-semibold text-slate-700">{req.leaveType}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-800">
                                {req.startDate === req.endDate ? req.startDate : `${req.startDate} to ${req.endDate}`}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">{daysCount} {daysCount === 1 ? 'day' : 'days'}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-2 max-w-[200px]">
                            <div className="space-y-1">
                              <p className="text-slate-600 font-medium italic">"{req.reason}"</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Submitted: {new Date(req.createdAt).toLocaleDateString()}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase ${
                                req.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : req.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {req.status}
                            </span>
                            {req.managerNotes && (
                              <p className="text-[10px] text-slate-400 italic mt-1 block max-w-[150px] truncate">
                                Notes: {req.managerNotes}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            {req.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenActionModal(req.id, 'Approved')}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 cursor-pointer transition"
                                  title="Approve Leave"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenActionModal(req.id, 'Rejected')}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 cursor-pointer transition"
                                  title="Reject Leave"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Actioned</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <Pager pagination={review.pagination} page={review.page} onPageChange={review.setPage} />
          </div>
        </div>
      )}

      {/* Decision comment modal */}
      {selectedRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {managerActionType === 'Approved' ? 'Confirm Leave Approval' : 'Decline Leave Request'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  You are about to transition this leave request to <strong className={managerActionType === 'Approved' ? 'text-emerald-600' : 'text-rose-600'}>{managerActionType}</strong>.
                </p>
              </div>
              <button
                onClick={() => setSelectedRequestId(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Decision Notes / Feedback</label>
              <textarea
                value={managerNotesInput}
                onChange={(e) => setManagerNotesInput(e.target.value)}
                placeholder="Enter notes or explanation for this decision..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400">
                {managerActionType === 'Approved'
                  ? 'Note: Approving leave will automatically insert leave slots into the employee attendance log and free them from any assigned rosters for those dates.'
                  : 'Note: Declining leave will retain their scheduled shifts.'}
              </p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedRequestId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-transparent transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition shadow-xs cursor-pointer ${
                  managerActionType === 'Approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {managerActionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
