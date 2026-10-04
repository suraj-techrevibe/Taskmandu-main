import React, { useState } from 'react';
import { Job, JobApplication, UpcomingInterview, Role } from '../../types';
import { 
  Briefcase, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  Clock, 
  Trash2, 
  Edit2, 
  Video, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Mail, 
  Phone, 
  ExternalLink,
  PlusCircle,
  FileText,
  ChevronRight,
  TrendingUp,
  Award,
  X,
  UserPlus,
  Loader2,
  Building2,
  MapPin
} from 'lucide-react';
import { useServerList } from '../../hooks/useServerList';
import Pager from '../../components/list/Pager';
import { listApplicationPage, listInterviewPage, listJobPage } from '../../services/recruitment';

interface RecruitmentModuleProps {
  jobApplications: JobApplication[];
  upcomingInterviews: UpcomingInterview[];
  jobs: Job[];
  currentRole: Role;
  onAddApplication: (app: Omit<JobApplication, 'id'>) => void;
  onUpdateApplication: (app: JobApplication) => void;
  onDeleteApplication: (id: string) => void;
  onAddInterview: (int: Omit<UpcomingInterview, 'id'>) => void;
  onUpdateInterview: (int: UpcomingInterview) => void;
  onDeleteInterview: (id: string) => void;
  onAddJob: (job: Omit<Job, 'id'>) => void;
  onUpdateJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
}

export default function RecruitmentModule({
  jobApplications,
  upcomingInterviews,
  jobs,
  currentRole,
  onAddApplication,
  onUpdateApplication,
  onDeleteApplication,
  onAddInterview,
  onUpdateInterview,
  onDeleteInterview,
  onAddJob,
  onUpdateJob,
  onDeleteJob
}: RecruitmentModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'interviews' | 'jobs'>('applications');
  
  // Server-driven tables: Job Postings
  const jobList = useServerList({
    fetcher: ({ page, limit, sortBy, sortOrder, filters }) =>
      listJobPage({
        page,
        limit,
        sortBy,
        sortOrder,
        search: filters.search || undefined,
        status: filters.status || undefined,
      }),
    defaultLimit: 10,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });
  
  // Server-driven tables: Candidate Applications
  const applications = useServerList({
    fetcher: ({ page, limit, sortBy, sortOrder, filters }) =>
      listApplicationPage({
        page,
        limit,
        sortBy,
        sortOrder,
        search: filters.search || undefined,
        stage: filters.stage || undefined,
        source: filters.source || undefined,
      }),
    defaultLimit: 10,
    defaultSortBy: 'appliedDate',
    defaultSortOrder: 'desc',
  });

  // Server-driven tables: Upcoming Interviews
  const interviews = useServerList({
    fetcher: ({ page, limit, sortBy, sortOrder, filters }) =>
      listInterviewPage({
        page,
        limit,
        sortBy,
        sortOrder,
        search: filters.search || undefined,
        status: filters.status || undefined,
      }),
    defaultLimit: 10,
    defaultSortBy: 'interviewDate',
    defaultSortOrder: 'asc',
  });

  // Modal States: Job Application CRUD
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isEditAppOpen, setIsEditAppOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // Form Fields: Job Application
  const [appCandidateName, setAppCandidateName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appJobId, setAppJobId] = useState('');
  const [appRoleApplied, setAppRoleApplied] = useState('');
  const [appStage, setAppStage] = useState<JobApplication['stage']>('Applied');
  const [appExperience, setAppExperience] = useState(3);
  const [appRating, setAppRating] = useState(3);
  const [appSource, setAppSource] = useState('LinkedIn');
  const [appNotes, setAppNotes] = useState('');

  // Modal States: Job Posting CRUD
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form Fields: Job Posting
  const [jobTitle, setJobTitle] = useState('');
  const [jobDepartment, setJobDepartment] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobEmploymentType, setJobEmploymentType] = useState<Job['employmentType']>('Full-Time');
  const [jobOpenings, setJobOpenings] = useState(1);
  const [jobSalaryMin, setJobSalaryMin] = useState('');
  const [jobSalaryMax, setJobSalaryMax] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [jobStatus, setJobStatus] = useState<Job['status']>('Open');

  // Modal States: Upcoming Interview CRUD
  const [isAddIntOpen, setIsAddIntOpen] = useState(false);
  const [isEditIntOpen, setIsEditIntOpen] = useState(false);
  const [editingInt, setEditingInt] = useState<UpcomingInterview | null>(null);

  // Form Fields: Upcoming Interview
  const [intAppId, setIntAppId] = useState('');
  const [intDate, setIntDate] = useState(new Date().toISOString().slice(0, 10));
  const [intTime, setIntTime] = useState('09:00');
  const [intType, setIntType] = useState<UpcomingInterview['interviewType']>('Technical Coding');
  const [intInterviewers, setIntInterviewers] = useState('');
  const [intMeetingLink, setIntMeetingLink] = useState('https://meet.google.com/xyz-pdqr-abc');
  const [intStatus, setIntStatus] = useState<UpcomingInterview['status']>('Scheduled');
  const [intNotes, setIntNotes] = useState('');

  // Count Variables for Stats Highlights
  const totalAppsCount = jobApplications.length;
  const hiredCount = jobApplications.filter(a => a.stage === 'Hired').length;
  const activeInterviewsCount = upcomingInterviews.filter(i => i.status === 'Scheduled').length;
  const pendingReviewCount = jobApplications.filter(a => ['Applied', 'Screening'].includes(a.stage)).length;

  // -------------------------------------------------------------
  // HANDLERS: JOB APPLICATIONS
  // -------------------------------------------------------------
  const handleOpenAddApp = () => {
    setAppCandidateName('');
    setAppEmail('');
    setAppPhone('');
    setAppJobId('');
    setAppRoleApplied('');
    setAppStage('Applied');
    setAppExperience(3);
    setAppRating(4);
    setAppSource('LinkedIn');
    setAppNotes('');
    setIsAddAppOpen(true);
  };

  const handleAddAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appCandidateName.trim() || !appEmail.trim() || !appRoleApplied.trim()) return;

    onAddApplication({
      jobId: appJobId || undefined,
      candidateName: appCandidateName,
      email: appEmail,
      phone: appPhone,
      roleApplied: appRoleApplied,
      stage: appStage,
      experienceYears: Number(appExperience),
      appliedDate: new Date().toISOString().split('T')[0],
      rating: appRating,
      source: appSource,
      notes: appNotes
    });
    setIsAddAppOpen(false);
    applications.refresh();
  };

  const handleOpenEditApp = (app: JobApplication) => {
    setEditingApp(app);
    setAppCandidateName(app.candidateName);
    setAppEmail(app.email);
    setAppPhone(app.phone);
    setAppJobId(app.jobId || '');
    setAppRoleApplied(app.roleApplied);
    setAppStage(app.stage);
    setAppExperience(app.experienceYears);
    setAppRating(app.rating);
    setAppSource(app.source);
    setAppNotes(app.notes || '');
    setIsEditAppOpen(true);
  };

  const handleEditAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !appCandidateName.trim() || !appEmail.trim()) return;

    onUpdateApplication({
      ...editingApp,
      jobId: appJobId || undefined,
      candidateName: appCandidateName,
      email: appEmail,
      phone: appPhone,
      roleApplied: appRoleApplied,
      stage: appStage,
      experienceYears: Number(appExperience),
      rating: appRating,
      source: appSource,
      notes: appNotes
    });
    setIsEditAppOpen(false);
    setEditingApp(null);
    applications.refresh();
  };

  const handleDeleteApp = (appId: string) => {
    if (confirm('Are you sure you want to remove this candidate application? All scheduled interviews for this candidate will remain or can be rescheduled.')) {
      onDeleteApplication(appId);
      applications.refresh();
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: JOB POSTINGS
  // -------------------------------------------------------------
  const handleOpenAddJob = () => {
    setJobTitle('');
    setJobDepartment('');
    setJobLocation('');
    setJobEmploymentType('Full-Time');
    setJobOpenings(1);
    setJobSalaryMin('');
    setJobSalaryMax('');
    setJobDescription('');
    setJobRequirements('');
    setJobStatus('Open');
    setIsAddJobOpen(true);
  };

  const handleAddJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    onAddJob({
      title: jobTitle,
      department: jobDepartment,
      location: jobLocation,
      employmentType: jobEmploymentType,
      openings: Number(jobOpenings) || 1,
      salaryMin: jobSalaryMin ? Number(jobSalaryMin) : undefined,
      salaryMax: jobSalaryMax ? Number(jobSalaryMax) : undefined,
      description: jobDescription,
      requirements: jobRequirements,
      status: jobStatus
    });
    setIsAddJobOpen(false);
    jobList.refresh();
  };

  const handleOpenEditJob = (job: Job) => {
    setEditingJob(job);
    setJobTitle(job.title);
    setJobDepartment(job.department);
    setJobLocation(job.location);
    setJobEmploymentType(job.employmentType);
    setJobOpenings(job.openings);
    setJobSalaryMin(job.salaryMin ? String(job.salaryMin) : '');
    setJobSalaryMax(job.salaryMax ? String(job.salaryMax) : '');
    setJobDescription(job.description || '');
    setJobRequirements(job.requirements || '');
    setJobStatus(job.status);
    setIsEditJobOpen(true);
  };

  const handleEditJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob || !jobTitle.trim()) return;

    onUpdateJob({
      ...editingJob,
      title: jobTitle,
      department: jobDepartment,
      location: jobLocation,
      employmentType: jobEmploymentType,
      openings: Number(jobOpenings) || 1,
      salaryMin: jobSalaryMin ? Number(jobSalaryMin) : undefined,
      salaryMax: jobSalaryMax ? Number(jobSalaryMax) : undefined,
      description: jobDescription,
      requirements: jobRequirements,
      status: jobStatus
    });
    setIsEditJobOpen(false);
    setEditingJob(null);
    jobList.refresh();
  };

  const handleDeleteJob = (jobId: string) => {
    if (confirm('Are you sure you want to delete this job posting? Linked candidates and interviews will be unlinked but not deleted.')) {
      onDeleteJob(jobId);
      jobList.refresh();
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: UPCOMING INTERVIEWS
  // -------------------------------------------------------------
  const handleOpenAddInt = () => {
    setIntAppId(jobApplications[0]?.id || '');
    setIntDate(new Date().toISOString().slice(0, 10));
    setIntTime('10:00');
    setIntType('Technical Coding');
    setIntInterviewers('');
    setIntMeetingLink('');
    setIntStatus('Scheduled');
    setIntNotes('');
    setIsAddIntOpen(true);
  };

  const handleAddIntSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find candidate details
    const selectedApp = jobApplications.find(a => a.id === intAppId);
    if (!selectedApp) {
      alert('Please register at least one Candidate Application before scheduling interviews.');
      return;
    }

    onAddInterview({
      applicationId: intAppId,
      candidateName: selectedApp.candidateName,
      roleApplied: selectedApp.roleApplied,
      interviewDate: intDate,
      interviewTime: intTime,
      interviewType: intType,
      interviewers: intInterviewers.split(',').map(s => s.trim()).filter(Boolean),
      meetingLink: intMeetingLink,
      status: intStatus,
      notes: intNotes
    });
    setIsAddIntOpen(false);
    interviews.refresh();
  };

  const handleOpenEditInt = (int: UpcomingInterview) => {
    setEditingInt(int);
    setIntAppId(int.applicationId);
    setIntDate(int.interviewDate);
    setIntTime(int.interviewTime);
    setIntType(int.interviewType);
    setIntInterviewers(int.interviewers.join(', '));
    setIntMeetingLink(int.meetingLink || '');
    setIntStatus(int.status);
    setIntNotes(int.notes || '');
    setIsEditIntOpen(true);
  };

  const handleEditIntSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInt) return;

    const selectedApp = jobApplications.find(a => a.id === intAppId);

    onUpdateInterview({
      ...editingInt,
      applicationId: intAppId,
      candidateName: selectedApp ? selectedApp.candidateName : editingInt.candidateName,
      roleApplied: selectedApp ? selectedApp.roleApplied : editingInt.roleApplied,
      interviewDate: intDate,
      interviewTime: intTime,
      interviewType: intType,
      interviewers: intInterviewers.split(',').map(s => s.trim()).filter(Boolean),
      meetingLink: intMeetingLink,
      status: intStatus,
      notes: intNotes
    });
    setIsEditIntOpen(false);
    setEditingInt(null);
    interviews.refresh();
  };

  const handleDeleteInt = (intId: string) => {
    if (confirm('Are you sure you want to cancel and delete this interview slot?')) {
      onDeleteInterview(intId);
      interviews.refresh();
    }
  };

  // -------------------------------------------------------------
  // FILTERS IMPLEMENTATION
  // -------------------------------------------------------------
  const filteredApps = applications.items;
  const filteredInterviews = interviews.items;

  // Stage Styles Mapper
  const getStageStyle = (stage: JobApplication['stage']) => {
    switch (stage) {
      case 'Hired':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Offer Extended':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Technical Round':
      case 'Manager Round':
      case 'HR Round':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Screening':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Interview Type Styles Mapper
  const getIntTypeStyle = (type: UpcomingInterview['interviewType']) => {
    switch (type) {
      case 'Technical Coding':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'System Design':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Executive Loop':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  // Job Status Styles Mapper
  const getJobStatusStyle = (status: Job['status']) => {
    switch (status) {
      case 'Open':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Filled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'On Hold':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fadeIn">
      
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
          <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Total Applications</p>
            <p className="text-xl font-black text-slate-900">{totalAppsCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
          <div className="h-10 w-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Offers Hired</p>
            <p className="text-xl font-black text-slate-900">{hiredCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Active Interviews</p>
            <p className="text-xl font-black text-slate-900">{activeInterviewsCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
          <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Under Review</p>
            <p className="text-xl font-black text-slate-900">{pendingReviewCount}</p>
          </div>
        </div>

      </div>

      {/* Primary Sub-Tabs Controller */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex bg-slate-50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveSubTab('applications')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'applications'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-rose-500" />
              <span>Candidate Applications ({applications.pagination.totalItems})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('interviews')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'interviews'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Upcoming Interviews ({interviews.pagination.totalItems})</span>
            </button>
          <button
              onClick={() => setActiveSubTab('jobs')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'jobs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-teal-600" />
              <span>Job Postings ({jobList.pagination.totalItems})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeSubTab === 'applications' ? (
              <button
                onClick={handleOpenAddApp}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5px]" />
                <span>Add Candidate</span>
              </button>
            ) : activeSubTab === 'jobs' ? (
              <button
                onClick={handleOpenAddJob}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5px]" />
                <span>Create Job</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAddInt}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Interview</span>
              </button>
            )}
          </div>
        </div>

        {/* -------------------------------------------------------------
            TAB CONTENT: CANDIDATE APPLICATIONS CRUD
            ------------------------------------------------------------- */}
        {activeSubTab === 'applications' && (
          <div className="pt-4 space-y-4 animate-fadeIn">
            
            {/* Filter Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by candidate, role..."
                  value={applications.filters.search ?? ''}
                  onChange={(e) => applications.setFilter('search', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-rose-300"
                />
              </div>

              <div>
                <select
                  value={applications.filters.stage ?? ''}
                  onChange={(e) => applications.setFilter('stage', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 focus:outline-none"
                >
                  <option value="">All Stages</option>
                  <option value="Applied">Applied</option>
                  <option value="Screening">Screening</option>
                  <option value="Technical Round">Technical Round</option>
                  <option value="Manager Round">Manager Round</option>
                  <option value="HR Round">HR Round</option>
                  <option value="Offer Extended">Offer Extended</option>
                  <option value="Hired">Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <select
                  value={applications.filters.source ?? ''}
                  onChange={(e) => applications.setFilter('source', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 focus:outline-none"
                >
                  <option value="">All Sources</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Referral">Referral</option>
                  <option value="Indeed">Indeed</option>
                  <option value="Company Website">Company Website</option>
                </select>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4">Candidate / Contact</th>
                    <th className="p-4">Role Applied</th>
                    <th className="p-4">Experience</th>
                    <th className="p-4">Applied Date</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {applications.loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-semibold">
                        <Loader2 className="w-5 h-5 animate-spin opacity-60 mx-auto" />
                        <span className="block mt-2">Loading candidate applications…</span>
                      </td>
                    </tr>
                  ) : filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-semibold">
                        No candidate applications found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4">
                          <div className="font-extrabold text-slate-800">{app.candidateName}</div>
                          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {app.email}</span>
                            {app.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {app.phone}</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            <span>{app.roleApplied}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">Via {app.source}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-600">
                          {app.experienceYears} Years
                        </td>
                        <td className="p-4 text-slate-500 font-medium">
                          {app.appliedDate}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3.5 h-3.5 ${
                                  idx < app.rating 
                                    ? 'fill-amber-400 text-amber-400' 
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStageStyle(app.stage)}`}>
                            {app.stage}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => handleOpenEditApp(app)}
                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-100 transition shrink-0 cursor-pointer"
                              title="Edit candidate profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteApp(app.id)}
                              className="p-1.5 bg-white hover:bg-rose-50 hover:border-rose-150 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-100 transition shrink-0 cursor-pointer"
                              title="Delete candidate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pager pagination={applications.pagination} page={applications.page} onPageChange={applications.setPage} />

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB CONTENT: UPCOMING INTERVIEWS CRUD
            ------------------------------------------------------------- */}
        {activeSubTab === 'interviews' && (
          <div className="pt-4 space-y-4 animate-fadeIn">
            
            {/* Filter Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by candidate, interviewer, role..."
                  value={interviews.filters.search ?? ''}
                  onChange={(e) => interviews.setFilter('search', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-300"
                />
              </div>

              <div>
                <select
                  value={interviews.filters.status ?? ''}
                  onChange={(e) => interviews.setFilter('status', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 focus:outline-none"
                >
                  <option value="">All Interview Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>
            </div>

            {/* Interviews Queue Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviews.loading ? (
                <div className="col-span-2 text-center py-10 text-slate-400 font-semibold bg-slate-50/50 border border-dashed border-slate-150 rounded-xl">
                  <Loader2 className="w-5 h-5 animate-spin opacity-60 mx-auto" />
                  <span className="block mt-2">Loading interviews…</span>
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-slate-400 font-semibold bg-slate-50/50 border border-dashed border-slate-150 rounded-xl">
                  No upcoming interviews scheduled.
                </div>
              ) : (
                filteredInterviews.map((int) => (
                  <div key={int.id} className="bg-slate-50/30 border border-slate-100 rounded-xl p-4 space-y-4 flex flex-col justify-between hover:border-slate-200 transition">
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${getIntTypeStyle(int.interviewType)}`}>
                            {int.interviewType}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 mt-1.5">{int.candidateName}</h4>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">{int.roleApplied}</p>
                        </div>
                        
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          int.status === 'Scheduled' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : int.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {int.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{int.interviewDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{int.interviewTime}</span>
                        </div>
                      </div>

                      {int.interviewers.length > 0 && (
                        <div className="pt-2 border-t border-slate-100/60">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Interview panel</span>
                          <div className="flex flex-wrap gap-1">
                            {int.interviewers.map((panelist, index) => (
                              <span key={index} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                                {panelist}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {int.notes && (
                        <p className="text-[11px] text-slate-500 italic bg-white/70 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          "{int.notes}"
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100/60 flex items-center justify-between gap-2">
                      <div>
                        {int.meetingLink && (
                          <a 
                            href={int.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-lg transition"
                          >
                            <Video className="w-3 h-3" />
                            <span>Launch Google Meet</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditInt(int)}
                          className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-100 transition shrink-0 cursor-pointer"
                          title="Reschedule / Edit Interview"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInt(int.id)}
                          className="p-1.5 bg-white hover:bg-rose-50 hover:border-rose-100 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-100 transition shrink-0 cursor-pointer"
                          title="Cancel Interview"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

            <Pager pagination={interviews.pagination} page={interviews.page} onPageChange={interviews.setPage} />

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB CONTENT: JOB POSTINGS CRUD
            ------------------------------------------------------------- */}
        {activeSubTab === 'jobs' && (
          <div className="pt-4 space-y-4 animate-fadeIn">

            {/* Filter Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, department, location..."
                  value={jobList.filters.search ?? ''}
                  onChange={(e) => jobList.setFilter('search', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-teal-300"
                />
              </div>

              <div>
                <select
                  value={jobList.filters.status ?? ''}
                  onChange={(e) => jobList.setFilter('status', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 focus:outline-none"
                >
                  <option value="">All Job Statuses</option>
                  <option value="Open">Open</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Closed">Closed</option>
                  <option value="Filled">Filled</option>
                </select>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4">Job Title</th>
                    <th className="p-4">Employment Type</th>
                    <th className="p-4">Openings</th>
                    <th className="p-4">Salary Range</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {jobList.loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-semibold">
                        <Loader2 className="w-5 h-5 animate-spin opacity-60 mx-auto" />
                        <span className="block mt-2">Loading job postings…</span>
                      </td>
                    </tr>
                  ) : jobList.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-semibold">
                        No job postings found. Create your first job posting.
                      </td>
                    </tr>
                  ) : (
                    jobList.items.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4">
                          <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-teal-500" />
                            <span>{job.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5 flex flex-wrap items-center gap-x-2">
                            {job.department && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {job.department}</span>}
                            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-600">{job.employmentType}</td>
                        <td className="p-4 font-bold text-slate-600">{job.openings}</td>
                        <td className="p-4 text-slate-500 font-medium">
                          {job.salaryMin && job.salaryMax
                            ? `$${job.salaryMin.toLocaleString()} – $${job.salaryMax.toLocaleString()}`
                            : job.salaryMin
                            ? `From $${job.salaryMin.toLocaleString()}`
                            : 'Not specified'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getJobStatusStyle(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => handleOpenEditJob(job)}
                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-teal-600 rounded-lg border border-slate-100 transition shrink-0 cursor-pointer"
                              title="Edit job posting"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-1.5 bg-white hover:bg-rose-50 hover:border-rose-150 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-100 transition shrink-0 cursor-pointer"
                              title="Delete job posting"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pager pagination={jobList.pagination} page={jobList.page} onPageChange={jobList.setPage} />

          </div>
        )}

      </div>

      {/* -------------------------------------------------------------
          MODAL: ADD CANDIDATE APPLICATION
          ------------------------------------------------------------- */}
      {isAddAppOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-lg w-full overflow-hidden animate-fadeIn text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-rose-500" />
                <span>Add Candidate Application</span>
              </h3>
              <button 
                onClick={() => setIsAddAppOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAppSubmit} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Linked Job Posting</label>
                <select
                  value={appJobId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setAppJobId(id);
                    const job = jobs.find((j) => j.id === id);
                    if (job) setAppRoleApplied(job.title);
                  }}
                  className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="">No linked job (manual role)</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} — {job.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dianne Russell"
                  value={appCandidateName}
                  onChange={(e) => setAppCandidateName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="dianne@example.com"
                    value={appEmail}
                    onChange={(e) => setAppEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={appPhone}
                    onChange={(e) => setAppPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Role Applied For</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={appRoleApplied}
                    onChange={(e) => setAppRoleApplied(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Hiring Source</label>
                  <input
                    type="text"
                    placeholder="e.g. LinkedIn, Referral, Indeed"
                    value={appSource}
                    onChange={(e) => setAppSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Yrs of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={appExperience}
                    onChange={(e) => setAppExperience(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Hiring Stage</label>
                  <select
                    value={appStage}
                    onChange={(e) => setAppStage(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="Technical Round">Technical Round</option>
                    <option value="Manager Round">Manager Round</option>
                    <option value="HR Round">HR Round</option>
                    <option value="Offer Extended">Offer Extended</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Candidate Rating</label>
                  <select
                    value={appRating}
                    onChange={(e) => setAppRating(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Internal Candidate Notes</label>
                <textarea
                  placeholder="Feedback, salary expectations, noticeable strengths..."
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-150 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-rose-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAppOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Register Application
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: EDIT CANDIDATE APPLICATION
          ------------------------------------------------------------- */}
      {isEditAppOpen && editingApp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-lg w-full overflow-hidden animate-fadeIn text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-rose-500" />
                <span>Modify Candidate Profile</span>
              </h3>
              <button 
                onClick={() => {
                  setIsEditAppOpen(false);
                  setEditingApp(null);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditAppSubmit} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Linked Job Posting</label>
                <select
                  value={appJobId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setAppJobId(id);
                    const job = jobs.find((j) => j.id === id);
                    if (job) setAppRoleApplied(job.title);
                  }}
                  className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="">No linked job (manual role)</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} — {job.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dianne Russell"
                  value={appCandidateName}
                  onChange={(e) => setAppCandidateName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="dianne@example.com"
                    value={appEmail}
                    onChange={(e) => setAppEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={appPhone}
                    onChange={(e) => setAppPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Role Applied For</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={appRoleApplied}
                    onChange={(e) => setAppRoleApplied(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Hiring Source</label>
                  <input
                    type="text"
                    placeholder="LinkedIn"
                    value={appSource}
                    onChange={(e) => setAppSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Yrs of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={appExperience}
                    onChange={(e) => setAppExperience(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Hiring Stage</label>
                  <select
                    value={appStage}
                    onChange={(e) => setAppStage(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="Technical Round">Technical Round</option>
                    <option value="Manager Round">Manager Round</option>
                    <option value="HR Round">HR Round</option>
                    <option value="Offer Extended">Offer Extended</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Candidate Rating</label>
                  <select
                    value={appRating}
                    onChange={(e) => setAppRating(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Internal Recruiter Notes</label>
                <textarea
                  placeholder="Feedback, salary expectations, strengths..."
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-150 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-rose-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditAppOpen(false);
                    setEditingApp(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: SCHEDULE INTERVIEW (ADD)
          ------------------------------------------------------------- */}
      {isAddIntOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-lg w-full overflow-hidden animate-fadeIn text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Schedule New Interview</span>
              </h3>
              <button 
                onClick={() => setIsAddIntOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddIntSubmit} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Link Candidate Application</label>
                {jobApplications.length === 0 ? (
                  <p className="text-xs text-rose-600 font-bold">Please add a Candidate Profile first before scheduling.</p>
                ) : (
                  <select
                    value={intAppId}
                    onChange={(e) => setIntAppId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    {jobApplications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.candidateName} — {app.roleApplied}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Date</label>
                  <input
                    type="date"
                    required
                    value={intDate}
                    onChange={(e) => setIntDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Time</label>
                  <input
                    type="time"
                    required
                    value={intTime}
                    onChange={(e) => setIntTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Interview Type</label>
                  <select
                    value={intType}
                    onChange={(e) => setIntType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Screening">Screening</option>
                    <option value="Technical Coding">Technical Coding</option>
                    <option value="System Design">System Design</option>
                    <option value="Cultural Fit">Cultural Fit</option>
                    <option value="HR Round">HR Round</option>
                    <option value="Executive Loop">Executive Loop</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Interview Status</label>
                  <select
                    value={intStatus}
                    onChange={(e) => setIntStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No Show">No Show</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Interviewers (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera, Michael Chang"
                  value={intInterviewers}
                  onChange={(e) => setIntInterviewers(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Meeting URL (Google Meet, Zoom, etc.)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abc-qwe"
                  value={intMeetingLink}
                  onChange={(e) => setIntMeetingLink(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Notes / Topics</label>
                <input
                  type="text"
                  placeholder="Focus areas (e.g., frontend frameworks deep dive, system design scaling issues)"
                  value={intNotes}
                  onChange={(e) => setIntNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddIntOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={jobApplications.length === 0}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule Slot
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: EDIT/RESCHEDULE INTERVIEW
          ------------------------------------------------------------- */}
      {isEditIntOpen && editingInt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-lg w-full overflow-hidden animate-fadeIn text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-500" />
                <span>Reschedule / Edit Interview Details</span>
              </h3>
              <button 
                onClick={() => {
                  setIsEditIntOpen(false);
                  setEditingInt(null);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditIntSubmit} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Candidate Application</label>
                <select
                  value={intAppId}
                  onChange={(e) => setIntAppId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  {jobApplications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.candidateName} — {app.roleApplied}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Date</label>
                  <input
                    type="date"
                    required
                    value={intDate}
                    onChange={(e) => setIntDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Time</label>
                  <input
                    type="time"
                    required
                    value={intTime}
                    onChange={(e) => setIntTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Interview Type</label>
                  <select
                    value={intType}
                    onChange={(e) => setIntType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Screening">Screening</option>
                    <option value="Technical Coding">Technical Coding</option>
                    <option value="System Design">System Design</option>
                    <option value="Cultural Fit">Cultural Fit</option>
                    <option value="HR Round">HR Round</option>
                    <option value="Executive Loop">Executive Loop</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Interview Status</label>
                  <select
                    value={intStatus}
                    onChange={(e) => setIntStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No Show">No Show</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Interviewers (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera, Michael Chang"
                  value={intInterviewers}
                  onChange={(e) => setIntInterviewers(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Meeting URL (Google Meet, Zoom, etc.)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abc-qwe"
                  value={intMeetingLink}
                  onChange={(e) => setIntMeetingLink(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Notes / Topics</label>
                <input
                  type="text"
                  placeholder="Focus areas"
                  value={intNotes}
                  onChange={(e) => setIntNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditIntOpen(false);
                    setEditingInt(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save Reschedule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: CREATE JOB POSTING
          ------------------------------------------------------------- */}
      {isAddJobOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-lg w-full overflow-hidden animate-fadeIn text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-500" />
                <span>Create Job Posting</span>
              </h3>
              <button 
                onClick={() => setIsAddJobOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddJobSubmit} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={jobDepartment}
                    onChange={(e) => setJobDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote / Sydney"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Employment Type</label>
                  <select
                    value={jobEmploymentType}
                    onChange={(e) => setJobEmploymentType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Openings</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={jobOpenings}
                    onChange={(e) => setJobOpenings(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</label>
                  <select
                    value={jobStatus}
                    onChange={(e) => setJobStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Closed">Closed</option>
                    <option value="Filled">Filled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Salary Min (USD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 80000"
                    value={jobSalaryMin}
                    onChange={(e) => setJobSalaryMin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Salary Max (USD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 120000"
                    value={jobSalaryMax}
                    onChange={(e) => setJobSalaryMax(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Job Description</label>
                <textarea
                  placeholder="Responsibilities, team, mission..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-150 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-teal-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Requirements</label>
                <textarea
                  placeholder="Skills, qualifications, years of experience..."
                  value={jobRequirements}
                  onChange={(e) => setJobRequirements(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-150 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-teal-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddJobOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Create Job
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: EDIT JOB POSTING
          ------------------------------------------------------------- */}
      {isEditJobOpen && editingJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-lg w-full overflow-hidden animate-fadeIn text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-500" />
                <span>Edit Job Posting</span>
              </h3>
              <button 
                onClick={() => {
                  setIsEditJobOpen(false);
                  setEditingJob(null);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditJobSubmit} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={jobDepartment}
                    onChange={(e) => setJobDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote / Sydney"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Employment Type</label>
                  <select
                    value={jobEmploymentType}
                    onChange={(e) => setJobEmploymentType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Openings</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={jobOpenings}
                    onChange={(e) => setJobOpenings(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</label>
                  <select
                    value={jobStatus}
                    onChange={(e) => setJobStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Closed">Closed</option>
                    <option value="Filled">Filled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Salary Min (USD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 80000"
                    value={jobSalaryMin}
                    onChange={(e) => setJobSalaryMin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Salary Max (USD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 120000"
                    value={jobSalaryMax}
                    onChange={(e) => setJobSalaryMax(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Job Description</label>
                <textarea
                  placeholder="Responsibilities, team, mission..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-150 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-teal-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Requirements</label>
                <textarea
                  placeholder="Skills, qualifications, years of experience..."
                  value={jobRequirements}
                  onChange={(e) => setJobRequirements(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-150 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-teal-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditJobOpen(false);
                    setEditingJob(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
