import React, { useState } from 'react';
import { Roster, Employee, ShiftType, Role, Department } from '../../types';
import { Calendar as CalendarIcon, Clock, MapPin, Copy, Plus, Filter, Check, ShieldAlert, Loader2 } from 'lucide-react';
import { useServerList } from '../../hooks/useServerList';
import { listRosterPage } from '../../services/roster';

interface RosterModuleProps {
  rosters: Roster[];
  employees: Employee[];
  currentRole: Role;
  currentEmployeeId?: string | null;
  departments?: Department[];
  onAddRoster: (roster: Omit<Roster, 'id'>) => void;
  onCopyRoster: () => void;
}

export default function RosterModule({
  employees,
  currentRole,
  currentEmployeeId,
  departments = [],
  onAddRoster,
  onCopyRoster
}: RosterModuleProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Real "today" (UTC, matches the backend date format)
  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);
  const myEmployeeId = currentEmployeeId ?? '';

  const [selectedDate, setSelectedDate] = useState<string>(today); // Selected active date
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [formEmployeeIds, setFormEmployeeIds] = useState<string[]>([]);
  const [formDept, setFormDept] = useState('Engineering');
  const [formShift, setFormShift] = useState<ShiftType>('Morning');
  const [formStart, setFormStart] = useState('08:00');
  const [formEnd, setFormEnd] = useState('17:00');
  const [formLocation, setFormLocation] = useState('San Francisco Office');
  const [formDate, setFormDate] = useState<string>(today);
  const [formRecurring, setFormRecurring] = useState(false);

  // Permission Check
  const canManageRoster = currentRole === 'Super Admin' || currentRole === 'HR' || currentRole === 'Manager';

  // Departments list (from CMS; falls back to active-only names)
  const activeDepartmentNames = departments
    .filter((d) => d.isActive)
    .map((d) => d.name);
  const fallbackDepartments = ['Engineering', 'HR', 'Operations', 'Marketing'];
  const departmentNames =
    activeDepartmentNames.length > 0 ? activeDepartmentNames : fallbackDepartments;
  const departmentOptions = ['All', ...departmentNames];

  // Days of the current week (Monday-based) for the weekly view
  const weekDays = (() => {
    const monday = new Date(today + 'T00:00:00Z');
    const dayIndex = (monday.getUTCDay() + 6) % 7;
    monday.setUTCDate(monday.getUTCDate() - dayIndex);
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      const date = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      return {
        dayName: names[i],
        date,
        label: date === today ? `${label} (Today)` : label,
        isToday: date === today,
      };
    });
  })();

  // Days of the current month for the monthly view
  const daysInMonth = new Date(`${monthPrefix}-01T00:00:00Z`).getUTCDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) =>
    `${monthPrefix}-${String(i + 1).padStart(2, '0')}`,
  );
  const monthStartOffset = (new Date(`${monthPrefix}-01T00:00:00Z`).getUTCDay() + 6) % 7;
  const monthLabel = new Date(`${monthPrefix}-01T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  // Fetch the union of the current week + month window from the server; the
  // daily/weekly/monthly views filter this window client-side.
  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[6].date;
  const monthStart = `${monthPrefix}-01`;
  const monthEnd = `${monthPrefix}-${String(daysInMonth).padStart(2, '0')}`;
  const windowFrom = weekStart < monthStart ? weekStart : monthStart;
  const windowTo = weekEnd > monthEnd ? weekEnd : monthEnd;

  const rosterData = useServerList({
    fetcher: ({ page, limit, sortBy, sortOrder, filters }) =>
      listRosterPage({
        page,
        limit,
        sortBy,
        sortOrder,
        from: windowFrom,
        to: windowTo,
        department: filters.department || undefined,
      }),
    defaultLimit: 100,
    defaultSortBy: 'date',
    defaultSortOrder: 'asc',
  });

  // Shift Types Colors mapping
  const shiftColors: Record<ShiftType, string> = {
    Morning: 'bg-blue-50 text-blue-800 border-blue-200',
    Evening: 'bg-amber-50 text-amber-800 border-amber-200',
    Night: 'bg-purple-50 text-purple-800 border-purple-200',
    Flexible: 'bg-teal-50 text-teal-800 border-teal-200',
    Custom: 'bg-gray-50 text-gray-800 border-gray-200'
  };

  // Filter schedules based on selection
  const filteredRosters = rosterData.items.filter((roster) => {
    const deptMatch = !rosterData.filters.department || roster.department === rosterData.filters.department;
    
    if (viewMode === 'daily') {
      return roster.date === selectedDate && deptMatch;
    } else if (viewMode === 'weekly') {
      const datesInWeek = weekDays.map((d) => d.date);
      return datesInWeek.includes(roster.date) && deptMatch;
    } else {
      return roster.date.startsWith(monthPrefix) && deptMatch;
    }
  });

  // Employee's own schedule
  const myRosters = rosterData.items.filter((roster) => roster.employeeIds.includes(myEmployeeId));

  const handleAddShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formEmployeeIds.length === 0) {
      alert('Please select at least one employee');
      return;
    }
    onAddRoster({
      employeeIds: formEmployeeIds,
      department: formDept,
      shiftType: formShift,
      startTime: formStart,
      endTime: formEnd,
      location: formLocation,
      date: formDate,
      recurring: formRecurring
    });
    setFormEmployeeIds([]);
    setShowAddForm(false);
    rosterData.refresh();
  };

  const selectEmployeeInForm = (id: string) => {
    if (formEmployeeIds.includes(id)) {
      setFormEmployeeIds(formEmployeeIds.filter((empId) => empId !== id));
    } else {
      setFormEmployeeIds([...formEmployeeIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Employee Roster Scheduler</h2>
          <p className="text-sm text-gray-500">Plan shifts, set recurring working locations, and verify attendance coverage.</p>
        </div>

        {canManageRoster && (
          <div className="flex items-center gap-2">
            <button
              id="copy-roster-btn"
              onClick={onCopyRoster}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clone Past Week</span>
            </button>
            <button
              id="add-shift-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Shift</span>
            </button>
          </div>
        )}
      </div>

      {/* Roster Allocation Form Drawer (Overlay Mode) */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-600" />
            <span>Create New Shift Assignment</span>
          </h3>

          <form onSubmit={handleAddShiftSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Multiple Employee select */}
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold text-gray-700">Select Employees</label>
              <div className="bg-white border border-gray-200 rounded-lg p-2 h-44 overflow-y-auto space-y-1">
                {employees.map((emp) => {
                  const isChecked = formEmployeeIds.includes(emp.id);
                  return (
                    <button
                      type="button"
                      key={emp.id}
                      onClick={() => selectEmployeeInForm(emp.id)}
                      className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-md text-xs transition cursor-pointer ${
                        isChecked ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{emp.firstName} {emp.lastName} ({emp.department})</span>
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400">Select multiple employees to mass-assign shifts.</p>
            </div>

            {/* Config Fields */}
            <div className="space-y-4 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Department</label>
                <select
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="HR">HR</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Shift Type</label>
                <select
                  value={formShift}
                  onChange={(e) => setFormShift(e.target.value as ShiftType)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                  <option value="Flexible">Flexible</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Work Hours (Start - End)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    placeholder="08:00"
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white text-center"
                  />
                  <input
                    type="text"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    placeholder="17:00"
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Work Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="San Francisco Office"
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Target Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="formRecurring"
                  checked={formRecurring}
                  onChange={(e) => setFormRecurring(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="formRecurring" className="text-xs font-medium text-gray-700">Configure as recurring</label>
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 border-t border-gray-200 pt-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                Save Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and View Toggles */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-150 p-4 rounded-xl gap-4">
        {/* Department Filter */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-600">Department:</span>
          <div className="flex bg-gray-50 rounded-lg p-0.5 border border-gray-200">
            {departmentOptions.map((dept) => (
              <button
                key={dept}
                onClick={() => rosterData.setFilter('department', dept === 'All' ? '' : dept)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  (dept === 'All' && !rosterData.filters.department) || rosterData.filters.department === dept
                    ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar View Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-medium capitalize rounded-md transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Calendar Content */}
      <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden">
        {rosterData.loading && rosterData.items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin opacity-60" />
            <p className="text-xs font-semibold">Loading roster schedule…</p>
          </div>
        ) : (
          <>
        {/* 1. Daily View */}
        {viewMode === 'daily' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-bold text-gray-900">
                Daily Roster Checklist ({selectedDate})
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-200 rounded-lg p-1.5 text-xs font-semibold text-gray-700 bg-white"
              />
            </div>

            {filteredRosters.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No rosters scheduled for {selectedDate}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRosters.map((roster) => (
                  <div key={roster.id} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${shiftColors[roster.shiftType]}`}>
                        {roster.shiftType} Shift
                      </span>
                      {roster.recurring && (
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md font-medium">
                          Recurring
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{roster.department} Department</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{roster.startTime} - {roster.endTime}</span>
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{roster.location}</span>
                      </p>
                    </div>

                    <div className="border-t border-gray-100 pt-2.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Staff Assigned ({roster.employeeIds.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {roster.employeeIds.map((id) => {
                          const emp = employees.find((e) => e.id === id);
                          return (
                            <span key={id} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-md transition font-medium">
                              {emp ? `${emp.firstName} ${emp.lastName}` : id}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Weekly View */}
        {viewMode === 'weekly' && (
          <div className="divide-y divide-gray-100">
            {/* Week days columns */}
            <div className="grid grid-cols-7 bg-gray-50 text-center py-3 border-b border-gray-100">
              {weekDays.map((wd) => {
                const isSelected = selectedDate === wd.date;
                return (
                  <button
                    key={wd.date}
                    onClick={() => {
                      setSelectedDate(wd.date);
                      setViewMode('daily');
                    }}
                    className={`py-1.5 rounded-lg mx-1 transition cursor-pointer ${
                      isSelected ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-gray-200'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{wd.dayName}</p>
                    <p className="text-xs mt-0.5">{wd.label}</p>
                  </button>
                );
              })}
            </div>

            {/* Grid of Shifts */}
            <div className="p-6">
              {filteredRosters.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-xs">No active rosters assigned to the active filters for this week.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {weekDays.map((wd) => {
                    const dayRosters = filteredRosters.filter((r) => r.date === wd.date);
                    return (
                      <div key={wd.date} className="flex flex-col md:flex-row md:items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                        <div className="w-28 shrink-0">
                          <span className="text-xs font-bold text-gray-900 block">{wd.dayName} - {wd.label}</span>
                          <span className="text-[10px] text-gray-500 block">{dayRosters.length} Shifts Scheduled</span>
                        </div>

                        <div className="flex-1 flex flex-wrap gap-3">
                          {dayRosters.length === 0 ? (
                            <span className="text-xs text-gray-400 italic py-1">Weekend / Off-Day</span>
                          ) : (
                            dayRosters.map((roster) => (
                              <div key={roster.id} className="bg-white border border-gray-200 rounded-xl p-3 min-w-[240px] flex-1 hover:border-indigo-300 transition-all space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${shiftColors[roster.shiftType]}`}>
                                    {roster.shiftType}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {roster.startTime} - {roster.endTime}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  <p className="font-bold text-gray-900">{roster.department}</p>
                                  <p className="text-gray-500 text-[10px] flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {roster.location}</p>
                                </div>
                                <div className="flex -space-x-1 overflow-hidden pt-1 border-t border-gray-50">
                                  {roster.employeeIds.map((id, index) => {
                                    const emp = employees.find((e) => e.id === id);
                                    return (
                                      <div
                                        key={id}
                                        title={emp ? `${emp.firstName} ${emp.lastName}` : id}
                                        className="inline-block h-6 w-6 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[9px] font-bold text-indigo-600 cursor-default"
                                      >
                                        {emp ? `${emp.firstName[0]}${emp.lastName[0]}` : id[0]}
                                      </div>
                                    );
                                  })}
                                  <span className="text-[10px] text-gray-400 self-center pl-2">
                                    {roster.employeeIds.length} members
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Monthly View */}
        {viewMode === 'monthly' && (
          <div className="p-6">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">{monthLabel} Shift Distribution</h3>
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 py-1">{d}</div>
              ))}

              {/* Offset empty cells for the first day of the month */}
              {Array.from({ length: monthStartOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="border border-transparent bg-gray-50/50 rounded-xl"></div>
              ))}

              {monthDays.map((dateStr, i) => {
                const dayNum = i + 1;
                const dayRosters = filteredRosters.filter((r) => r.date === dateStr);
                const isToday = dateStr === today;

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setViewMode('daily');
                    }}
                    className={`border border-gray-100 rounded-xl p-2 min-h-[64px] text-left hover:bg-indigo-50/30 transition cursor-pointer relative ${
                      isToday ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : 'bg-white'
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {dayNum}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayRosters.slice(0, 2).map((r) => (
                        <div key={r.id} className="text-[8px] font-semibold px-1 rounded-sm bg-gray-100 truncate text-gray-700">
                          {r.shiftType[0]} - {r.department}
                        </div>
                      ))}
                      {dayRosters.length > 2 && (
                        <div className="text-[8px] text-indigo-600 font-bold">
                          +{dayRosters.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Employee Personal Shift Card View */}
      {currentRole === 'Employee' && (
        <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-44 h-44 bg-indigo-800 rounded-full opacity-30 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-300" />
            <h3 className="text-md font-bold">Your Scheduled Shifts ({monthLabel})</h3>
          </div>

          {myRosters.length === 0 ? (
            <p className="text-xs text-indigo-200">You do not have any upcoming shifts assigned. Please contact your reporting manager.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myRosters.map((roster) => {
                const isToday = roster.date === today;
                return (
                  <div key={roster.id} className={`p-4 rounded-xl border ${isToday ? 'bg-white text-gray-900 border-white' : 'bg-indigo-950/40 text-indigo-100 border-indigo-700'} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isToday ? 'bg-indigo-100 text-indigo-800' : 'bg-indigo-900 text-indigo-200'}`}>
                        {roster.date === today ? 'Today' : roster.date}
                      </span>
                      <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                        {roster.shiftType}
                      </span>
                    </div>

                    <p className="text-sm font-bold truncate">{roster.department} Shift</p>
                    <p className="text-xs flex items-center gap-1.5 opacity-80">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{roster.startTime} - {roster.endTime}</span>
                    </p>
                    <p className="text-xs flex items-center gap-1.5 opacity-80">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{roster.location}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
