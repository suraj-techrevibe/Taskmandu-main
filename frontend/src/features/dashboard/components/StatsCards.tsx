import React from 'react';
import { Users, UserCheck, Calendar, ArrowRight } from 'lucide-react';

interface StatsCardsProps {
  displayAttendance: number;
  displayAbsent: number;
  displayLeaveApply: number;
  onNavigateTab?: (tabId: string) => void;
}

export default function StatsCards({ 
  displayAttendance, 
  displayAbsent, 
  displayLeaveApply, 
  onNavigateTab 
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Metric 1: Attendance */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs transition hover:shadow-md hover:border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900">{displayAttendance}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attendance (Today)</p>
          </div>
        </div>
        <div className="border-t border-dashed border-slate-100 mt-4 pt-3 flex items-center justify-between">
          <p className="text-[10px] text-slate-450 text-slate-400 font-bold">Active staff logged check-in</p>
          <button 
            onClick={() => { if (onNavigateTab) onNavigateTab('attendance'); }}
            className="text-[11px] font-extrabold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition cursor-pointer"
          >
            <span>View details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Metric 2: Absent */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs transition hover:shadow-md hover:border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900">{displayAbsent}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Absent Today</p>
          </div>
        </div>
        <div className="border-t border-dashed border-slate-100 mt-4 pt-3 flex items-center justify-between">
          <p className="text-[10px] text-slate-450 text-slate-400 font-bold">Pending today's shift roster</p>
          <button 
            onClick={() => { if (onNavigateTab) onNavigateTab('roster'); }}
            className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition cursor-pointer"
          >
            <span>View details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Metric 3: Leave Apply */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs transition hover:shadow-md hover:border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900">{displayLeaveApply}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Leaves</p>
          </div>
        </div>
        <div className="border-t border-dashed border-slate-100 mt-4 pt-3 flex items-center justify-between">
          <p className="text-[10px] text-slate-450 text-slate-400 font-bold">Applications requiring action</p>
          <button 
            onClick={() => { if (onNavigateTab) onNavigateTab('leave'); }}
            className="text-[11px] font-extrabold text-orange-600 hover:text-orange-750 flex items-center gap-1 transition cursor-pointer"
          >
            <span>View details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
