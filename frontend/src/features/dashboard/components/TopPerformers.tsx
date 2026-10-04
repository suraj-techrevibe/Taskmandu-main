import React from 'react';
import { MoreVertical, FileText, Calendar, Clock } from 'lucide-react';
import { Employee, Task } from '../../../types';

interface TopPerformersProps {
  employees: Employee[];
  tasks: Task[];
  selectedTimeFilter: '1d' | '7d' | '1m' | '1y' | 'All';
  setSelectedTimeFilter: (filter: '1d' | '7d' | '1m' | '1y' | 'All') => void;
  activePerformerId: string | null;
  setActivePerformerId: (id: string | null) => void;
  onNavigateTab?: (tabId: string) => void;
}

export default function TopPerformers({
  employees,
  tasks,
  selectedTimeFilter,
  setSelectedTimeFilter,
  activePerformerId,
  setActivePerformerId,
  onNavigateTab
}: TopPerformersProps) {
  const performerEmployees = employees.slice(0, 6);
  
  const PERFORMERS = performerEmployees.map((emp, idx) => {
    const initials = `${emp.firstName[0]}${emp.lastName[0]}`;
    const assignedTasks = tasks.filter(t => (t.assignedToId || []).includes(emp.id));
    const completedTasks = assignedTasks.filter(t => t.status === 'Completed').length;
    const score = assignedTasks.length > 0 ? Math.round((completedTasks / assignedTasks.length) * 100) : 0;
    const colors = [
      'bg-teal-50 text-teal-750 text-teal-800',
      'bg-indigo-50 text-indigo-750 text-indigo-800',
      'bg-emerald-50 text-emerald-750 text-emerald-800',
      'bg-violet-50 text-violet-750 text-violet-800',
      'bg-amber-50 text-amber-750 text-amber-800',
      'bg-rose-50 text-rose-750 text-rose-800'
    ];
    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      designation: emp.designation,
      score: score,
      initials: initials,
      colorClass: colors[idx % colors.length]
    };
  });

  const handleActionClick = (performerName: string, actionType: string, tabId: string) => {
    setActivePerformerId(null);
    setTimeout(() => {
      if (onNavigateTab) {
        onNavigateTab(tabId);
      }
    }, 1500);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Top Performers</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Task delivery completion per employee</p>
        </div>
        
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px]">
          {(['1d', '7d', '1m', '1y', 'All'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedTimeFilter(filter)}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                selectedTimeFilter === filter
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PERFORMERS.map((perf) => (
          <div key={perf.id} className="relative flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-200 transition">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-xs border border-slate-100 shadow-2xs ${perf.colorClass}`}>
                {perf.initials}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-extrabold text-slate-900 leading-none">{perf.name}</p>
                  <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-1.5 py-0.2 rounded">{perf.score}% completion</span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">{perf.designation} &bull; {perf.email}</p>
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setActivePerformerId(activePerformerId === perf.id ? null : perf.id)}
                className="p-1 text-slate-450 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {activePerformerId === perf.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setActivePerformerId(null)} />
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-150 rounded-xl shadow-lg py-1.5 z-20 animate-fadeIn text-left">
                    <button 
                      onClick={() => handleActionClick(perf.name, 'Assign Task', 'projects')}
                      className="w-full px-3 py-1.5 hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-violet-500" />
                      <span>Assign Project Task</span>
                    </button>
                    <button 
                      onClick={() => handleActionClick(perf.name, 'Roster Shift', 'roster')}
                      className="w-full px-3 py-1.5 hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-teal-500" />
                      <span>Assign Roster Shift</span>
                    </button>
                    <button 
                      onClick={() => handleActionClick(perf.name, 'Log Attendance Check', 'attendance')}
                      className="w-full px-3 py-1.5 hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Review Check-Ins</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
