import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronDown, 
  UserPlus, 
  Briefcase, 
  CalendarDays,
  FileText,
  Plus,
  CalendarDays as CalendarIcon
} from 'lucide-react';

interface WelcomeBannerProps {
  currentUserName: string;
  weekPeriodLabel: string;
  onNavigateTab?: (tabId: string) => void;
}

export default function WelcomeBanner({ 
  currentUserName, 
  weekPeriodLabel, 
  onNavigateTab 
}: WelcomeBannerProps) {
  const [isAddNewOpen, setIsAddNewOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Welcome Back, {currentUserName}!
        </h1>
        <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">
          Your Team's Success Starts Here. Let's Make Progress Together!
        </p>
      </div>

      <div className="flex items-center gap-2.5 relative">
        <div className="bg-white border border-slate-150 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xs">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-650 text-slate-600">{weekPeriodLabel}</span>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsAddNewOpen(!isAddNewOpen)}
            className="bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-teal-900/10 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isAddNewOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAddNewOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsAddNewOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-150 rounded-xl shadow-lg py-2 z-40 animate-fadeIn text-left">
                <div className="px-3.5 py-1.5 border-b border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Quick Actions</p>
                </div>
                <button 
                  onClick={() => { setIsAddNewOpen(false); if (onNavigateTab) onNavigateTab('roster'); }}
                  className="w-full px-3.5 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>Create Roster Shift</span>
                </button>
                <button 
                  onClick={() => { setIsAddNewOpen(false); if (onNavigateTab) onNavigateTab('attendance'); }}
                  className="w-full px-3.5 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Log Attendance Record</span>
                </button>
                <button 
                  onClick={() => { setIsAddNewOpen(false); if (onNavigateTab) onNavigateTab('leave'); }}
                  className="w-full px-3.5 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <Briefcase className="w-3.5 h-3.5 text-orange-600" />
                  <span>Apply Leave Request</span>
                </button>
                <button 
                  onClick={() => { setIsAddNewOpen(false); if (onNavigateTab) onNavigateTab('projects'); }}
                  className="w-full px-3.5 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-violet-600" />
                  <span>Assign Project Task</span>
                </button>
                <button 
                  onClick={() => { setIsAddNewOpen(false); if (onNavigateTab) onNavigateTab('recruitment'); }}
                  className="w-full px-3.5 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <UserPlus className="w-3.5 h-3.5 text-rose-600" />
                  <span>Add Candidate Profile</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
