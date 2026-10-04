import React, { useState } from 'react';
import { Employee, Roster, Attendance, Task, Role, OnboardingProfile, OffboardingProfile } from '../../types';
import { FileText, Download, Printer, Search, Calendar, Filter, Users, CheckCircle2 } from 'lucide-react';

interface ReportsModuleProps {
  employees: Employee[];
  rosters: Roster[];
  attendances: Attendance[];
  tasks: Task[];
  onboardings: OnboardingProfile[];
  offboardings: OffboardingProfile[];
  currentRole: Role;
}

type ReportRow = (string | number)[];

export default function ReportsModule({
  employees,
  rosters,
  attendances,
  tasks,
  onboardings,
  offboardings,
  currentRole
}: ReportsModuleProps) {
  const [activeTab, setActiveTab] = useState<'attendance' | 'tasks' | 'hr'>('attendance');
  const [selectedReportType, setSelectedReportType] = useState<string>('employee-attendance');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [downloading, setDownloading] = useState(false);

  const empName = (id?: string): string => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : (id ?? '');
  };

  const inDept = (department?: string): boolean => deptFilter === 'All' || department === deptFilter;

  // Build rows for the active report type (same filters as the preview table)
  const buildReportRows = (): { header: string[]; rows: ReportRow[] } => {
    if (activeTab === 'attendance') {
      const filtered = attendances
        .map((att) => ({ ...att, emp: employees.find((e) => e.id === att.employeeId) }))
        .filter((att) => att.emp && inDept(att.emp.department));

      if (selectedReportType === 'employee-attendance') {
        return {
          header: ['Employee', 'Department', 'Date', 'Check-In', 'Check-Out', 'Working Hours', 'Location', 'Status'],
          rows: filtered.map((att) => [
            `${att.emp?.firstName} ${att.emp?.lastName}`,
            att.emp?.department ?? '',
            att.date,
            att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('en-US', { hour12: false }) : '--',
            att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', { hour12: false }) : '--',
            att.workingHours ? att.workingHours.toFixed(2) : '--',
            att.locationType ?? 'Onsite',
            att.status,
          ]),
        };
      }

      if (selectedReportType === 'late-compliance') {
        return {
          header: ['Employee', 'Department', 'Check-in Time', 'Shift Standard In', 'Location'],
          rows: filtered
            .filter((att) => att.status === 'Late')
            .map((att) => [
              `${att.emp?.firstName} ${att.emp?.lastName}`,
              att.emp?.department ?? '',
              att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('en-US', { hour12: false }) : '--',
              '08:00',
              att.locationType ?? 'Onsite',
            ]),
        };
      }

      // department-attendance summary
      const byDept = new Map<string, { total: number; late: number; hours: number }>();
      filtered.forEach((att) => {
        const dept = att.emp?.department ?? 'Unknown';
        const entry = byDept.get(dept) ?? { total: 0, late: 0, hours: 0 };
        entry.total += 1;
        if (att.status === 'Late') entry.late += 1;
        entry.hours += att.workingHours ?? 0;
        byDept.set(dept, entry);
      });
      return {
        header: ['Department', 'Records', 'Late Arrivals', 'Total Working Hours'],
        rows: [...byDept.entries()].map(([dept, s]) => [dept, s.total, s.late, s.hours.toFixed(2)]),
      };
    }

    if (activeTab === 'tasks') {
      if (selectedReportType === 'completed-tasks') {
        const rows = tasks
          .map((task) => ({ ...task, emp: employees.find((e) => (task.assignedToId || []).includes(e.id)) }))
          .filter((task) => task.status === 'Completed' && task.emp && inDept(task.emp.department))
          .map((task) => [
            task.title,
            `${task.emp?.firstName} ${task.emp?.lastName}`,
            task.priority,
            `${task.estimatedHours}h`,
            'Resolved',
          ]);
        return { header: ['Task Title', 'Assigned To', 'Priority', 'Work Hours', 'Status'], rows };
      }

      if (selectedReportType === 'pending-workloads') {
        const rows = employees
          .filter((emp) => inDept(emp.department))
          .map((emp) => {
            const empTasks = tasks.filter((t) => (t.assignedToId || []).includes(emp.id) && t.status !== 'Completed');
            const totalEst = empTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
            return [emp.firstName + ' ' + emp.lastName, emp.department, `${empTasks.length} items`, `${totalEst} hours`, totalEst > 12 ? 'Overloaded' : 'Normal Cap'];
          });
        return { header: ['Employee', 'Department', 'Active Tasks', 'Estimated Hours', 'Compliance Status'], rows };
      }

      // overdue-delays
      const today = new Date().toISOString().slice(0, 10);
      const rows = tasks
        .filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled' && t.dueDate && t.dueDate < today)
        .map((t) => [t.title, (t.assignedToId || []).map(id => empName(id)).filter(Boolean).join(', ') || 'Unassigned', t.priority, t.dueDate, t.status]);
      return { header: ['Task Title', 'Assigned To', 'Priority', 'Due Date', 'Status'], rows };
    }

    // hr tab
    if (selectedReportType === 'active-staff') {
      const rows = employees
        .filter((emp) => inDept(emp.department))
        .map((emp) => [emp.employeeId, emp.firstName + ' ' + emp.lastName, emp.department, emp.designation, emp.employmentType, `$${emp.salary.toLocaleString()}/yr`]);
      return { header: ['Employee ID', 'Full Name', 'Department', 'Designation', 'Employment Type', 'Salary Bracket'], rows };
    }

    if (selectedReportType === 'onboarding-compliance') {
      const rows = onboardings.map((o) => [
        `${o.personalDetails.firstName} ${o.personalDetails.lastName}`,
        o.employmentInfo.department,
        o.currentStep,
        o.isCompleted ? 'Completed' : 'In Progress',
        o.employmentInfo.joiningDate,
      ]);
      return { header: ['Candidate', 'Department', 'Current Step', 'Status', 'Joining Date'], rows };
    }

    // offboarding-clearance
    const rows = offboardings.map((o) => [
      empName(o.employeeId),
      o.lastWorkingDay,
      o.reason,
      o.clearanceStatus.hr,
      o.clearanceStatus.finance,
      o.clearanceStatus.it,
      o.clearanceStatus.operations,
    ]);
    return { header: ['Employee', 'Last Working Day', 'Reason', 'HR', 'Finance', 'IT', 'Operations'], rows };
  };

  // Real CSV export built from the report rows shown in the preview
  const handleDownload = () => {
    setDownloading(true);
    const { header, rows } = buildReportRows();
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedReportType}_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  // Print the current ledger preview
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Compliance & Operational Reports</h2>
          <p className="text-sm text-gray-500">Generate, review, and print detailed CSV ledgers for rosters, daily check-ins, and employee tasks.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 border border-gray-250 rounded-lg text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Compiling CSV...' : 'Export to CSV'}</span>
          </button>
        </div>
      </div>

      {/* Main Reports Hub Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation panel */}
        <div className="lg:col-span-1 bg-white border border-gray-150 rounded-2xl p-4 shadow-xs space-y-4">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Select Report Category</span>
          
          <div className="space-y-1.5">
            {[
              { id: 'attendance', label: 'Attendance Logs', desc: 'Sign-ins, working hours, late arrivals' },
              { id: 'tasks', label: 'Task Productivity', desc: 'Completion rates, workloads, delays' },
              { id: 'hr', label: 'HR & Lifecycle', desc: 'Active staff, onboarding & clearances' }
            ].map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveTab(cat.id as any);
                    if (cat.id === 'attendance') setSelectedReportType('employee-attendance');
                    if (cat.id === 'tasks') setSelectedReportType('completed-tasks');
                    if (cat.id === 'hr') setSelectedReportType('active-staff');
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition cursor-pointer block ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/20 shadow-xs'
                      : 'border-gray-150 hover:bg-gray-50/50'
                  }`}
                >
                  <p className="font-bold text-xs text-gray-900">{cat.label}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{cat.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Specific Report Type</span>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
            >
              {activeTab === 'attendance' && (
                <>
                  <option value="employee-attendance">Employee-wise Attendance</option>
                  <option value="department-attendance">Department-wise Summary</option>
                  <option value="late-compliance">Late Arrivals Registry</option>
                </>
              )}
              {activeTab === 'tasks' && (
                <>
                  <option value="completed-tasks">Completed Task Registers</option>
                  <option value="pending-workloads">Active Employee Workloads</option>
                  <option value="overdue-delays">Overdue Task Alerts</option>
                </>
              )}
              {activeTab === 'hr' && (
                <>
                  <option value="active-staff">Active Employee List</option>
                  <option value="onboarding-compliance">Onboarding Pipeline Progress</option>
                  <option value="offboarding-clearance">Offboarding Clearances</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Compiled Tabular Table View */}
        <div className="lg:col-span-3 bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Report Ledger preview: {selectedReportType.replace('-', ' ').toUpperCase()}</span>
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Dept:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg p-1.5 bg-white"
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {/* 1. ATTENDANCE REPORTS PREVIEW */}
            {activeTab === 'attendance' && selectedReportType === 'employee-attendance' && (
              <table className="w-full text-xs text-left text-gray-500">
                <thead className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Roster Dept</th>
                    <th className="px-6 py-3">Sign-in Times</th>
                    <th className="px-6 py-3">Working Hours</th>
                    <th className="px-6 py-3">Location IP</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendances
                    .map((att) => ({ ...att, emp: employees.find((e) => e.id === att.employeeId) }))
                    .filter((att) => att.emp && (deptFilter === 'All' || att.emp.department === deptFilter))
                    .map((att) => (
                      <tr key={att.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3.5 font-bold text-gray-900">
                          {att.emp ? `${att.emp.firstName} ${att.emp.lastName}` : att.employeeId}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-gray-600">{att.emp?.department}</td>
                        <td className="px-6 py-3.5 font-mono text-gray-700">
                          {new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-gray-900">
                          {att.workingHours ? `${att.workingHours.toFixed(2)} hrs` : '--'}
                        </td>
                        <td className="px-6 py-3.5 max-w-[120px] truncate">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            (att.locationType || 'Onsite') === 'WFH' 
                              ? 'bg-purple-50 text-purple-800' 
                              : 'bg-blue-50 text-blue-800'
                          }`}>
                            {att.locationType || 'Onsite'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            att.status === 'Present' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : 'bg-amber-50 text-amber-800 border-amber-150'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'attendance' && selectedReportType === 'late-compliance' && (
              <table className="w-full text-xs text-left text-gray-500">
                <thead className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Check-in Time</th>
                    <th className="px-6 py-3">Shift Standard In</th>
                    <th className="px-6 py-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendances
                    .map((att) => ({ ...att, emp: employees.find((e) => e.id === att.employeeId) }))
                    .filter((att) => att.status === 'Late' && att.emp && (deptFilter === 'All' || att.emp.department === deptFilter))
                    .map((att) => (
                      <tr key={att.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3.5 font-bold text-gray-900">{att.emp?.firstName} {att.emp?.lastName}</td>
                        <td className="px-6 py-3.5 font-medium text-gray-600">{att.emp?.department}</td>
                        <td className="px-6 py-3.5 font-mono text-red-600 font-bold">
                          {new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-gray-400">08:00 AM</td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            (att.locationType || 'Onsite') === 'WFH' 
                              ? 'bg-purple-50 text-purple-800' 
                              : 'bg-blue-50 text-blue-800'
                          }`}>
                            {att.locationType || 'Onsite'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 2. TASK REPORTS */}
            {activeTab === 'tasks' && selectedReportType === 'completed-tasks' && (
              <table className="w-full text-xs text-left text-gray-500">
                <thead className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Task Title</th>
                    <th className="px-6 py-3">Assigned To</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Work hours</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks
                    .map((task) => ({ ...task, emp: employees.find((e) => (task.assignedToId || []).includes(e.id)) }))
                    .filter((task) => task.status === 'Completed' && task.emp && (deptFilter === 'All' || task.emp.department === deptFilter))
                    .map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3.5 font-bold text-gray-900">{task.title}</td>
                        <td className="px-6 py-3.5 font-medium text-gray-700">{task.emp?.firstName} {task.emp?.lastName}</td>
                        <td className="px-6 py-3.5 font-semibold text-gray-500">{task.priority}</td>
                        <td className="px-6 py-3.5 font-mono">{task.estimatedHours}h estimated</td>
                        <td className="px-6 py-3.5 text-right font-bold text-emerald-600">Resolved</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'tasks' && selectedReportType === 'pending-workloads' && (
              <table className="w-full text-xs text-left text-gray-500">
                <thead className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Active Tasks Assigned</th>
                    <th className="px-6 py-3">Estimated Hours</th>
                    <th className="px-6 py-3">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees
                    .filter((emp) => deptFilter === 'All' || emp.department === deptFilter)
                    .map((emp) => {
            const empTasks = tasks.filter((t) => (t.assignedToId || []).includes(emp.id) && t.status !== 'Completed');
                      const totalEst = empTasks.reduce((sum, t) => sum + t.estimatedHours, 0);

                      return (
                        <tr key={emp.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-3.5 font-bold text-gray-900">{emp.firstName} {emp.lastName}</td>
                          <td className="px-6 py-3.5 font-medium text-gray-600">{emp.department}</td>
                          <td className="px-6 py-3.5 font-semibold text-indigo-600">{empTasks.length} items</td>
                          <td className="px-6 py-3.5 font-mono font-bold text-gray-700">{totalEst} hours active</td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              totalEst > 12 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {totalEst > 12 ? 'Overloaded' : 'Normal Cap'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}

            {/* 3. HR REPORTS */}
            {activeTab === 'hr' && selectedReportType === 'active-staff' && (
              <table className="w-full text-xs text-left text-gray-500">
                <thead className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Employee ID</th>
                    <th className="px-6 py-3">Full Name</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Designation</th>
                    <th className="px-6 py-3">Employment Type</th>
                    <th className="px-6 py-3">Salary Bracket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees
                    .filter((emp) => deptFilter === 'All' || emp.department === deptFilter)
                    .map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3.5 font-mono text-gray-400 font-bold">{emp.employeeId}</td>
                        <td className="px-6 py-3.5 font-bold text-gray-900">{emp.firstName} {emp.lastName}</td>
                        <td className="px-6 py-3.5 font-medium text-gray-600">{emp.department}</td>
                        <td className="px-6 py-3.5 font-medium text-gray-500">{emp.designation}</td>
                        <td className="px-6 py-3.5">{emp.employmentType}</td>
                        <td className="px-6 py-3.5 font-semibold text-gray-700">${emp.salary.toLocaleString()}/yr</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-right text-[10px] font-bold text-gray-400">
            SECURE EXPORTS LOGGED BY: {currentRole.toUpperCase()} • COMPANY CONFIDENTIAL
          </div>
        </div>

      </div>
    </div>
  );
}
