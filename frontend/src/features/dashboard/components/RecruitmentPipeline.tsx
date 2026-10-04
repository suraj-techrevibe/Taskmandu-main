import React from 'react';
import { TrendingUp } from 'lucide-react';
import { JobApplication } from '../../../types';

interface RecruitmentPipelineProps {
  selectedTimeFilter: '1d' | '7d' | '1m' | '1y' | 'All';
  setSelectedTimeFilter: (filter: '1d' | '7d' | '1m' | '1y' | 'All') => void;
  jobApplications: JobApplication[];
}

const PIPELINE_STAGES = ['Applied', 'Screening', 'Technical Round', 'Manager Round', 'HR Round', 'Offer Extended', 'Hired', 'Rejected'];

export default function RecruitmentPipeline({
  selectedTimeFilter,
  setSelectedTimeFilter,
  jobApplications
}: RecruitmentPipelineProps) {
  const PERIOD_LABELS: Record<string, string> = {
    '1d': 'Today',
    '7d': 'Last 7 days',
    '1m': 'Last 30 days',
    '1y': 'Last 12 months',
    'All': 'All time'
  };
  
  const PERIOD_DAYS: Record<string, number> = { '1d': 1, '7d': 7, '1m': 30, '1y': 365, 'All': Infinity };
  const periodDays = PERIOD_DAYS[selectedTimeFilter];
  const periodMs = periodDays * 86400000;
  const periodApps = jobApplications.filter(a => periodDays === Infinity || (Date.now() - new Date(a.appliedDate).getTime()) < periodMs);
  
  const stageCounts = PIPELINE_STAGES.map(stage => ({
    stage,
    count: periodApps.filter(a => a.stage === stage).length
  }));
  
  const maxStageCount = Math.max(1, ...stageCounts.map(s => s.count));
  const periodLabel = PERIOD_LABELS[selectedTimeFilter];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Recruitment Pipeline</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            {periodLabel} &bull; {periodApps.length} applications
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-extrabold text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
          <TrendingUp className="w-3 h-3" />
          <span>{periodApps.filter(a => a.stage === 'Hired').length} Hired</span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {stageCounts.map(({ stage, count }) => {
          const pct = Math.round((count / maxStageCount) * 100);
          return (
            <div key={stage} className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider w-28 shrink-0">{stage}</span>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stage === 'Hired' ? 'bg-teal-700' : stage === 'Rejected' ? 'bg-rose-400' : 'bg-teal-500/80'
                  }`}
                  style={{ width: `${count > 0 ? Math.max(pct, 6) : 0}%` }}
                />
              </div>
              <span className="text-[11px] font-black text-slate-700 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
