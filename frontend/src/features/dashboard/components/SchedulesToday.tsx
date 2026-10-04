import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Roster, Employee, Role } from '../../../types';

interface SchedulesTodayProps {
  selectedDate: string;
  today: string;
  dayRosters: Roster[];
  employees: Employee[];
  currentRole: Role;
  onNavigateTab?: (tabId: string) => void;
}

export default function SchedulesToday({
  selectedDate,
  today,
  dayRosters,
  employees,
  currentRole,
  onNavigateTab
}: SchedulesTodayProps) {
  const borderColors = [
    'border-teal-500 bg-teal-50/20 hover:bg-teal-50/40',
    'border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/40',
    'border-orange-500 bg-orange-50/20 hover:bg-orange-50/40',
    'border-violet-500 bg-violet-50/20 hover:bg-violet-50/40'
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          {selectedDate === today ? 'Schedules (Today)' : `Schedules (${selectedDate})`}
        </span>
        <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
          {dayRosters.length} Shifts
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {dayRosters.length > 0 ? (
          dayRosters.map((roster, idx) => {
            const borderClass = borderColors[idx % borderColors.length];
            const shiftStaff = employees.filter(e => roster.employeeIds.includes(e.id));
            
            return (
              <div 
                key={roster.id} 
                onClick={() => { if (onNavigateTab) onNavigateTab('roster'); }}
                className={`pl-3.5 pr-3 py-2.5 border-l-4 rounded-r-xl flex items-center justify-between transition duration-200 cursor-pointer ${borderClass}`}
              >
                <div className="text-left space-y-0.5">
                  <h4 className="text-xs font-black text-slate-900">{roster.department} Shift</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    {roster.shiftType} &bull; {roster.location}
                  </p>
                  <p className="text-[10px] text-slate-650 text-slate-600 font-extrabold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{roster.startTime} - {roster.endTime}</span>
                  </p>
                </div>

                <div className="flex items-center">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {shiftStaff.slice(0, 3).map((staff) => (
                      <div 
                        key={staff.id} 
                        title={`${staff.firstName} ${staff.lastName}`}
                        className="h-5.5 w-5.5 rounded-full border border-white bg-slate-200 text-[8px] font-black text-slate-700 flex items-center justify-center ring-1 ring-slate-100"
                      >
                        {staff.firstName[0]}{staff.lastName[0]}
                      </div>
                    ))}
                  </div>
                  {shiftStaff.length > 3 && (
                    <span className="text-[9px] font-extrabold text-slate-400 pl-1.5">+{shiftStaff.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-6 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-slate-450 text-slate-400 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-700">No shifts scheduled</p>
              <p className="text-[10px] text-slate-400 font-semibold leading-tight">No employee shifts are rostered for this date.</p>
            </div>
            {['Super Admin', 'HR', 'Manager', 'Team Lead'].includes(currentRole) && (
              <button 
                onClick={() => { if (onNavigateTab) onNavigateTab('roster'); }}
                className="mt-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-black text-slate-700 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Schedule Shift
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
