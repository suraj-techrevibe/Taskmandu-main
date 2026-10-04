import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  monthLabel: string;
  WEEK_DAYS: Array<{ day: string; num: string; dateStr: string }>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export default function MiniCalendar({
  monthLabel,
  WEEK_DAYS,
  selectedDate,
  setSelectedDate
}: MiniCalendarProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{monthLabel}</span>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center border-t border-slate-100 pt-3">
        {WEEK_DAYS.map((item) => {
          const isActive = item.dateStr === selectedDate;
          return (
            <button 
              key={item.num} 
              onClick={() => setSelectedDate(item.dateStr)}
              className="space-y-1.5 focus:outline-none cursor-pointer group"
            >
              <span className={`text-[9px] font-black uppercase tracking-wider block transition-colors ${isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'}`}>{item.day}</span>
              <div className={`mx-auto h-8 w-8 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                isActive 
                  ? 'bg-teal-800 text-white shadow-md shadow-teal-900/15 scale-105' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}>
                {item.num}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
