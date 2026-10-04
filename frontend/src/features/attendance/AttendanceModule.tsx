import React, { useState, useEffect } from 'react';
import { Attendance, Employee, Role } from '../../types';
import { Clock, AlertCircle, CheckCircle2, UserCheck, Play, Power, Calendar, Loader2, Building, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { useServerList } from '../../hooks/useServerList';
import Pager from '../../components/list/Pager';
import { listAttendancePage, getMyStats, getMyHistory, MyStats } from '../../services/attendance';

interface AttendanceModuleProps {
  attendances: Attendance[];
  employees: Employee[];
  currentRole: Role;
  currentEmployeeId?: string | null;
  todayDate?: string;
  effectivePermissions: string[];
  onCheckIn: (locationType: 'Onsite' | 'WFH') => void;
  onCheckOut: () => void;
}

export default function AttendanceModule({
  attendances,
  employees,
  currentRole,
  currentEmployeeId,
  todayDate,
  effectivePermissions,
  onCheckIn,
  onCheckOut
}: AttendanceModuleProps) {
  const [locationType, setLocationType] = useState<'Onsite' | 'WFH'>('Onsite');
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [myHistory, setMyHistory] = useState<Attendance[]>([]);
  const [myHistoryLoading, setMyHistoryLoading] = useState(false);
  const [historyFrom, setHistoryFrom] = useState<string>('');
  const [historyTo, setHistoryTo] = useState<string>('');
  const [historyStatus, setHistoryStatus] = useState<string>('');
  const [historyLocationType, setHistoryLocationType] = useState<string>('');

  const hasManagePermission = effectivePermissions.includes('attendance:manage');

  // Current logged-in employee identity (employee id from the API)
  const myEmployeeId = currentEmployeeId ?? '';
  const today = todayDate ?? new Date().toISOString().slice(0, 10);

  // Fetch stats and history on mount
  useEffect(() => {
    if (!myEmployeeId) return;
    getMyStats().then(setMyStats).catch(() => {});
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEmployeeId]);

  const fetchHistory = async (filters?: { from?: string; to?: string; status?: string; locationType?: string }) => {
    if (!myEmployeeId) return;
    setMyHistoryLoading(true);
    try {
      const data = await getMyHistory(filters || {});
      setMyHistory(data);
    } catch {
      setMyHistory([]);
    } finally {
      setMyHistoryLoading(false);
    }
  };

  const handleHistoryFilterApply = () => {
    fetchHistory({
      from: historyFrom || undefined,
      to: historyTo || undefined,
      status: historyStatus || undefined,
      locationType: historyLocationType || undefined,
    });
  };

  // Manager logs table — server-driven (employee, status, date range, pagination)
  const logs = useServerList({
    fetcher: ({ page, limit, sortBy, sortOrder, filters }) =>
      listAttendancePage({
        page,
        limit,
        sortBy,
        sortOrder,
        employeeId: filters.employeeId || undefined,
        status: filters.status || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      }),
    defaultLimit: 10,
    defaultSortBy: 'date',
    defaultSortOrder: 'desc',
    initialFilters: { from: today, to: today },
  });

  const logRows = logs.items.map((att) => ({ ...att, emp: employees.find((e) => e.id === att.employeeId) }));

  // Find employee's today check-in log
  const myTodayLog = attendances.find(
    (att) => att.employeeId === myEmployeeId && att.date === today
  );

  // Compute stats for current day
  const todayLogs = attendances.filter((att) => att.date === today);
  const activeStaffCount = employees.filter((e) => e.status === 'Active').length;
  
  const presentToday = todayLogs.filter((l) => l.status === 'Present' || l.status === 'Late').length;
  const lateToday = todayLogs.filter((l) => l.status === 'Late').length;
  const missingCheckouts = todayLogs.filter((l) => l.checkInTime && !l.checkOutTime).length;
  const onLeaveToday = todayLogs.filter((l) => l.status === 'Leave').length;
  const absentToday = Math.max(0, activeStaffCount - presentToday - onLeaveToday);

  const [pendingAction, setPendingAction] = useState<'checkin' | 'checkout' | null>(null);

  const handleCheckInSubmit = () => {
    setPendingAction('checkin');
  };

  const handleCheckOutSubmit = () => {
    setPendingAction('checkout');
  };

  const confirmPendingAction = () => {
    if (pendingAction === 'checkin') {
      onCheckIn(locationType);
    } else if (pendingAction === 'checkout') {
      onCheckOut();
    }
    setPendingAction(null);
  };

  const allLogsWithDetails = logRows;

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Check-In / Check-Out Tracker</h2>
        <p className="text-sm text-gray-500">Log work hours, track attendance, and monitor team presence.</p>
      </div>

      {/* 1. Employee View */}
      {currentRole === 'Employee' && !myEmployeeId && (
        <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 text-amber-400" />
          <p className="text-sm font-bold text-gray-900">No employee profile linked</p>
          <p className="text-xs text-gray-500 mt-1">
            Check-in is available once an employee profile is linked to your account. Contact an administrator.
          </p>
        </div>
      )}
      {myEmployeeId && (
        <div className="space-y-6">
          {/* Check-In / Check-Out Actions */}
          <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-gray-500">Check-In / Check-Out Terminal</span>
              <div className="flex items-center gap-2">
                {myTodayLog ? (
                  myTodayLog.checkOutTime ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold border border-gray-200">
                      <CheckCircle2 className="w-4 h-4 text-gray-500" />
                      <span>Shift Complete</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200 animate-pulse">
                      <Clock className="w-4 h-4 text-emerald-600 animate-spin" />
                      <span>On-Shift</span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-800 rounded-full text-xs font-semibold border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>Awaiting Check-In</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {!myTodayLog ? (
                /* CHECK IN PROCESS */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Work Location</label>
                    <div className="grid grid-cols-2 gap-2 max-w-xs">
                      <button
                        type="button"
                        onClick={() => setLocationType('Onsite')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition cursor-pointer ${
                          locationType === 'Onsite'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Building className="w-5 h-5" />
                        <span className="text-xs font-bold">Onsite</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationType('WFH')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition cursor-pointer ${
                          locationType === 'WFH'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Home className="w-5 h-5" />
                        <span className="text-xs font-bold">WFH</span>
                      </button>
                    </div>
                  </div>

                  <button
                    id="check-in-action-btn"
                    onClick={handleCheckInSubmit}
                    className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>CHECK IN AT CURRENT SHIFT</span>
                  </button>
                </div>
              ) : !myTodayLog.checkOutTime ? (
                /* CHECK OUT PROCESS */
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-800 space-y-1">
                    <p className="font-bold">Active Attendance Details:</p>
                    <p>In-Time: {new Date(myTodayLog.checkInTime).toLocaleTimeString('en-US', { hour12: false })}</p>
                    <p>Location: {myTodayLog.locationType || 'Onsite'}</p>
                  </div>

                  <button
                    id="check-out-action-btn"
                    onClick={handleCheckOutSubmit}
                    className="py-2.5 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Power className="w-4 h-4" />
                    <span>CHECK OUT NOW</span>
                  </button>
                </div>
              ) : (
                /* BOTH DONE - Show summary and allow re-check-in */
                <div className="space-y-3">
                  <div className="flex items-center gap-4 py-2">
                    <div className="inline-flex p-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Today's Shift Complete</h4>
                      <p className="text-[10px] text-gray-500">Total recorded hours: {myTodayLog.workingHours?.toFixed(2) ?? '0.00'} hrs</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckInSubmit}
                    className="w-full py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>CHECK IN AGAIN</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Metric widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Attendance Rate</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{myStats?.attendancePercentage ?? 0}%</p>
              <span className="text-[10px] text-emerald-600 font-medium">Present days of all logged shifts</span>
            </div>
            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Work Hours</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{(myStats?.totalWorkHours ?? 0).toFixed(2)} h</p>
              <span className="text-[10px] text-gray-500">Recorded across {myStats?.totalShifts ?? 0} shift{(myStats?.totalShifts ?? 0) === 1 ? '' : 's'}</span>
            </div>
            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Late Arrivals</span>
              <p className={`text-2xl font-bold mt-1 ${(myStats?.lateCount ?? 0) > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{myStats?.lateCount ?? 0}</p>
              <span className="text-[10px] text-gray-500">Buffer grace is 15 minutes</span>
            </div>
          </div>

          {/* Personal Attendance Log History - Full Width */}
          <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden">
            <button
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="w-full p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
            >
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Your Attendance Log History ({new Date(`${today}T00:00:00Z`).toLocaleString('en-US', { month: 'long' })})</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-medium">
                  {isHistoryExpanded ? 'Collapse' : 'Expand to view logs'}
                </span>
                {isHistoryExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {isHistoryExpanded && (
              <div>
                {/* History Filters */}
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/30 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={historyFrom}
                      onChange={(e) => setHistoryFrom(e.target.value)}
                      className="text-[10px] border border-gray-200 px-2 py-1.5 bg-white rounded-lg"
                      title="From date"
                    />
                    <span className="text-[10px] text-gray-400">to</span>
                    <input
                      type="date"
                      value={historyTo}
                      onChange={(e) => setHistoryTo(e.target.value)}
                      className="text-[10px] border border-gray-200 px-2 py-1.5 bg-white rounded-lg"
                      title="To date"
                    />
                  </div>
                  <select
                    value={historyStatus}
                    onChange={(e) => setHistoryStatus(e.target.value)}
                    className="text-[10px] border border-gray-200 px-2 py-1.5 bg-white rounded-lg cursor-pointer"
                  >
                    <option value="">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Leave">Leave</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                  <select
                    value={historyLocationType}
                    onChange={(e) => setHistoryLocationType(e.target.value)}
                    className="text-[10px] border border-gray-200 px-2 py-1.5 bg-white rounded-lg cursor-pointer"
                  >
                    <option value="">All Locations</option>
                    <option value="Onsite">Onsite</option>
                    <option value="WFH">WFH</option>
                  </select>
                  <button
                    onClick={handleHistoryFilterApply}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      setHistoryFrom('');
                      setHistoryTo('');
                      setHistoryStatus('');
                      setHistoryLocationType('');
                      fetchHistory({});
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-200 transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                {/* History Content */}
                <div className="max-h-80 overflow-y-auto">
                  {myHistoryLoading ? (
                    <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin opacity-60" />
                      <p className="text-[10px]">Loading history...</p>
                    </div>
                  ) : myHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-[10px]">No attendance records found.</p>
                    </div>
                  ) : (
                    (() => {
                      const groupedByDate = myHistory.reduce<Record<string, typeof myHistory>>((acc, log) => {
                        if (!acc[log.date]) acc[log.date] = [];
                        acc[log.date].push(log);
                        return acc;
                      }, {});

                      return Object.entries(groupedByDate).map(([date, sessions]) => {
                        const dayTotalHours = sessions.reduce((sum, s) => sum + (s.workingHours || 0), 0);
                        const dateObj = new Date(`${date}T00:00:00Z`);
                        const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const isToday = date === today;

                        return (
                          <div key={date} className="border-b border-gray-100 last:border-b-0">
                            <div className={`px-5 py-2.5 flex items-center justify-between ${isToday ? 'bg-indigo-50/50' : 'bg-gray-50/50'}`}>
                              <div className="flex items-center gap-2">
                                <Calendar className={`w-3.5 h-3.5 ${isToday ? 'text-indigo-500' : 'text-gray-400'}`} />
                                <span className={`text-[11px] font-black ${isToday ? 'text-indigo-700' : 'text-gray-700'}`}>
                                  {dayLabel}, {monthDay}
                                </span>
                                {isToday && (
                                  <span className="text-[8px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">TODAY</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-400">
                                  {sessions.length} session{sessions.length > 1 ? 's' : ''}
                                </span>
                                <span className="text-[10px] font-black text-gray-600">
                                  {dayTotalHours.toFixed(1)}h total
                                </span>
                              </div>
                            </div>

                            <div className="divide-y divide-gray-50">
                              {sessions.map((log, idx) => {
                                const checkInFormatted = log.checkInTime
                                  ? new Date(log.checkInTime).toLocaleTimeString('en-US', { hour12: false })
                                  : '--';
                                const checkOutFormatted = log.checkOutTime
                                  ? new Date(log.checkOutTime).toLocaleTimeString('en-US', { hour12: false })
                                  : '--';

                                return (
                                  <div key={log.id} className="px-5 py-3 flex items-center gap-6 hover:bg-gray-50/50 transition">
                                    <span className="text-[10px] font-black text-gray-300 w-5">#{idx + 1}</span>
                                    <div className="flex items-center gap-6 flex-1">
                                      <div className="w-28">
                                        <p className="text-[10px] text-gray-400 font-bold">Check-In</p>
                                        <p className="text-xs font-bold text-gray-800">{checkInFormatted}</p>
                                      </div>
                                      <div className="w-28">
                                        <p className="text-[10px] text-gray-400 font-bold">Check-Out</p>
                                        <p className="text-xs font-bold text-gray-800">{checkOutFormatted}</p>
                                      </div>
                                      <div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                          log.locationType === 'WFH' 
                                            ? 'bg-purple-50 text-purple-800' 
                                            : 'bg-blue-50 text-blue-800'
                                        }`}>
                                          {log.locationType === 'WFH' ? <Home className="w-2.5 h-2.5" /> : <Building className="w-2.5 h-2.5" />}
                                          {log.locationType || 'Onsite'}
                                        </span>
                                      </div>
                                      <div className="w-20">
                                        <p className="text-[10px] text-gray-400 font-bold">Hours</p>
                                        <p className="text-xs font-mono font-bold text-gray-800">
                                          {log.workingHours ? `${log.workingHours.toFixed(1)}h` : '--'}
                                        </p>
                                      </div>
                                      <div>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                          log.status === 'Present' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : 'bg-amber-50 text-amber-800 border-amber-150'
                                        }`}>
                                          {log.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Manager/HR/Admin View */}
      {currentRole !== 'Employee' && hasManagePermission && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key Metric Widgets */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Present Today</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{presentToday}</p>
              <span className="text-[10px] text-gray-500">Active checked-in staff</span>
            </div>
            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Late Arrivals</span>
              <p className={`text-2xl font-bold mt-1 ${lateToday > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{lateToday}</p>
              <span className="text-[10px] text-gray-500">Requires review</span>
            </div>
            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Missing Check-Outs</span>
              <p className={`text-2xl font-bold mt-1 ${missingCheckouts > 0 ? 'text-red-600' : 'text-gray-900'}`}>{missingCheckouts}</p>
              <span className="text-[10px] text-gray-500">Still in workspace</span>
            </div>
            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Employees on Leave</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{onLeaveToday}</p>
              <span className="text-[10px] text-gray-500">Approved time-off</span>
            </div>
            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Absent / No Check-In</span>
              <p className="text-2xl font-bold text-gray-500 mt-1">{absentToday}</p>
              <span className="text-[10px] text-gray-400">Not signed in yet</span>
            </div>
          </div>

          {/* Detailed Logs Panel */}
          <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden">
            {/* Headers and Filters */}
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Roster Compliance & Check-In Logs</span>
              </h3>

              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                <select
                  value={logs.filters.employeeId ?? ''}
                  onChange={(e) => logs.setFilter('employeeId', e.target.value)}
                  className="text-xs border border-gray-200 px-2.5 py-2 bg-white rounded-lg cursor-pointer"
                  title="Filter by employee"
                >
                  <option value="">All employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={logs.filters.from ?? ''}
                    onChange={(e) => logs.setFilter('from', e.target.value)}
                    className="text-xs border border-gray-200 px-2 py-2 bg-white rounded-lg"
                    title="From date"
                  />
                  <span className="text-[10px] text-gray-400">to</span>
                  <input
                    type="date"
                    value={logs.filters.to ?? ''}
                    onChange={(e) => logs.setFilter('to', e.target.value)}
                    className="text-xs border border-gray-200 px-2 py-2 bg-white rounded-lg"
                    title="To date"
                  />
                </div>

                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 w-full sm:w-auto">
                  {(['All', 'Present', 'Late', 'Absent', 'Leave'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => logs.setFilter('status', status === 'All' ? '' : status)}
                      className={`flex-1 sm:flex-initial px-3 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                        (status === 'All' && !logs.filters.status) || logs.filters.status === status
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List */}
            {logs.loading ? (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin opacity-60" />
                <p className="text-xs">Loading attendance logs…</p>
              </div>
            ) : allLogsWithDetails.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No matching check-in logs found for this day.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-gray-500">
                  <thead className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">Employee</th>
                      <th className="px-6 py-3">Log Times</th>
                      <th className="px-6 py-3">Location</th>
                      <th className="px-6 py-3">Working Hours</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allLogsWithDetails.map((log) => {
                      const checkInFormatted = log.checkInTime
                        ? new Date(log.checkInTime).toLocaleTimeString('en-US', { hour12: false })
                        : '--';
                      const checkOutFormatted = log.checkOutTime
                        ? new Date(log.checkOutTime).toLocaleTimeString('en-US', { hour12: false })
                        : 'On-going Shift';

                      return (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4">
                            {log.emp ? (
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                  {log.emp.firstName[0]}{log.emp.lastName[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">{log.emp.firstName} {log.emp.lastName}</p>
                                  <p className="text-[10px] text-gray-400 font-medium">{log.emp.designation} ({log.emp.department})</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-gray-100 text-gray-400 font-bold flex items-center justify-center text-xs">
                                  ?
                                </div>
                                <div>
                                  <p className="font-bold text-gray-500">Unknown employee</p>
                                  <p className="text-[10px] text-gray-400 font-medium">ID: {log.employeeId}</p>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 space-y-0.5">
                            <p className="font-semibold text-gray-800"><span className="text-[10px] text-gray-400">IN:</span> {checkInFormatted}</p>
                            <p className="font-semibold text-gray-800"><span className="text-[10px] text-gray-400">OUT:</span> {checkOutFormatted}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              (log.locationType || 'Onsite') === 'WFH' 
                                ? 'bg-purple-50 text-purple-800' 
                                : 'bg-blue-50 text-blue-800'
                            }`}>
                              {(log.locationType || 'Onsite') === 'WFH' ? <Home className="w-2.5 h-2.5" /> : <Building className="w-2.5 h-2.5" />}
                              {log.locationType || 'Onsite'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-900 font-semibold">
                            {log.workingHours ? `${log.workingHours.toFixed(2)} hrs` : '--'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                              log.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                                : 'bg-amber-50 text-amber-800 border-amber-150'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <Pager pagination={logs.pagination} page={logs.page} onPageChange={logs.setPage} />
          </div>
        </div>
      )}

      {/* Check-In / Check-Out Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-sm w-full overflow-hidden text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>{pendingAction === 'checkin' ? 'Confirm Check-In' : 'Confirm Check-Out'}</span>
              </h3>
              <button
                onClick={() => setPendingAction(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {pendingAction === 'checkin'
                  ? `You are about to check in at ${new Date().toLocaleTimeString('en-US', { hour12: false })}.`
                  : `You are about to check out. Your shift today started at ${
                      myTodayLog
                        ? new Date(myTodayLog.checkInTime).toLocaleTimeString('en-US', { hour12: false })
                        : '--'
                    }.`}
              </p>
              {pendingAction === 'checkin' && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-semibold">Location:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold ${
                      locationType === 'WFH' ? 'bg-purple-50 text-purple-800' : 'bg-blue-50 text-blue-800'
                    }`}
                  >
                    {locationType === 'WFH' ? <Home className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                    {locationType}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-slate-400 font-semibold">
                {pendingAction === 'checkin'
                  ? 'This will mark your shift as started. Confirm to proceed.'
                  : 'This will end your current shift and calculate your working hours.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 p-5">
              <button
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmPendingAction}
                className={`px-4 py-2 rounded-xl text-xs font-black text-white transition cursor-pointer shadow-sm ${
                  pendingAction === 'checkin' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {pendingAction === 'checkin' ? 'Confirm Check-In' : 'Confirm Check-Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
