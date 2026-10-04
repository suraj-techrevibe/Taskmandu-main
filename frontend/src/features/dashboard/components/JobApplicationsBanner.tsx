import React from 'react';
import { Briefcase } from 'lucide-react';
import { JobApplication, UpcomingInterview } from '../../../types';

interface JobApplicationsBannerProps {
  jobApplications: JobApplication[];
  upcomingInterviews: UpcomingInterview[];
  onViewRecruitment: () => void;
}

export default function JobApplicationsBanner({
  jobApplications,
  upcomingInterviews,
  onViewRecruitment
}: JobApplicationsBannerProps) {
  return (
    <div 
      onClick={onViewRecruitment}
      className="rounded-2xl p-6 bg-gradient-to-br from-[#FEF2F2] via-[#FFF1F2] to-[#FFE4E6] border border-[#FECDD3]/40 shadow-xs hover:shadow-md hover:border-[#FECDD3]/80 relative overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 group"
    >
      <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
        <Briefcase className="w-32 h-32 text-rose-500" />
      </div>
      
      <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-1">Job Applications</span>
      <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-rose-700 transition-colors">Job Applications</h3>
      <p className="text-[11px] text-rose-700/85 font-extrabold mt-1 uppercase tracking-wide">
        {jobApplications.length} Candidates Sourced &bull; {jobApplications.filter(a => a.stage === 'Hired').length} Onboarded Hires
      </p>

      <div className="mt-5 bg-white/70 backdrop-blur-xs rounded-xl p-3 border border-white/60 group-hover:bg-white/90 transition-all duration-300">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Upcoming Interviews</span>
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
          <span>Active Cycle: Standard Loop</span>
          <span className="text-rose-600 font-extrabold">
            {upcomingInterviews.filter(i => i.status === 'Scheduled').length} candidates scheduled
          </span>
        </div>
      </div>
    </div>
  );
}
