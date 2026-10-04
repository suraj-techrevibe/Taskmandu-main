import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  FolderKanban,
  Layers,
  ListTodo,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import type { Employee, Role } from '../../types';
import * as projectApi from '../../services/project';
import type { ProjectDoc, ProjectMemberDoc } from '../../services/project';
import { toast } from '../../services/toast';
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_META,
  ProjectStatusBadge,
  MemberStack,
  projectProgress,
  formatDue,
  isOverdue,
} from './projectShared';

interface ProjectListPageProps {
  employees: Employee[];
  currentRole: Role;
  currentUserId: string;
  currentUserName: string;
  onAddNotification: (title: string, message: string, type: 'attendance' | 'shift' | 'task' | 'hr' | 'leave') => void;
}

function statusDot(project: ProjectDoc) {
  return PROJECT_STATUS_META[project.status]?.dot ?? 'bg-slate-400';
}

export default function ProjectListPage({
  employees,
  currentRole,
  currentUserId,
  currentUserName,
  onAddNotification,
}: ProjectListPageProps) {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectDoc['status'] | 'All'>('All');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStatus, setNewStatus] = useState<ProjectDoc['status']>('Active');
  const [newManager, setNewManager] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [newStart, setNewStart] = useState(today);
  const [newEnd, setNewEnd] = useState(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));

  const load = useCallback(() => {
    setLoading(true);
    projectApi
      .listProjects(100)
      .then((list) => {
        setProjects(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.manager.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const doneTasks = projects.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.status === 'Completed').length,
    0,
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDesc.trim()) return;

    projectApi
      .createProject({
        name: newName.trim(),
        description: newDesc.trim(),
        status: newStatus,
        manager: newManager || currentUserName,
        startDate: newStart || null,
        endDate: newEnd || null,
        color: 'bg-teal-500',
        members: [{ userId: currentUserId, name: currentUserName, email: '', role: 'owner' }],
      })
      .then((created) => {
        setProjects((prev) => [created, ...prev]);
        setIsCreateOpen(false);
        setNewName('');
        setNewDesc('');
        setNewManager('');
        toast.success('Project created successfully.');
        onAddNotification(
          'New Project Initiated',
          `Project "${created.name}" has been established.`,
          'task',
        );
        navigate(`/projects/${created._id}`);
      })
      .catch(() => {});
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-800" />
            Projects
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your project portfolio, boards and tasks — Jira-style workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative bg-slate-50 rounded-xl border border-slate-200/60 overflow-hidden flex items-center pr-3">
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-3.5 pr-8 py-2 text-xs font-semibold bg-transparent border-none focus:outline-none placeholder-slate-400 w-44 md:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-teal-900/10 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            Create Project
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 border-t-4 border-t-teal-500 rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Projects</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{projects.length}</p>
        </div>
        <div className="bg-white border border-slate-100 border-t-4 border-t-blue-500 rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Tasks</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalTasks}</p>
        </div>
        <div className="bg-white border border-slate-100 border-t-4 border-t-emerald-500 rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{doneTasks}</p>
        </div>
        <div className="bg-white border border-slate-100 border-t-4 border-t-amber-500 rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Tasks</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{totalTasks - doneTasks}</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(['All', ...PROJECT_STATUSES] as (ProjectDoc['status'] | 'All')[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
              statusFilter === s
                ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s}
            <span className={`ml-1.5 ${statusFilter === s ? 'text-teal-200' : 'text-slate-400'}`}>
              {s === 'All' ? projects.length : projects.filter((p) => p.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-slate-100/70 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-14 text-center shadow-xs">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">No projects found</h3>
          <p className="text-xs text-slate-500 font-semibold mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'All'
              ? 'Try adjusting your search or status filter.'
              : 'Create your first project to start tracking work like Jira.'}
          </p>
          {!search && statusFilter === 'All' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project) => {
            const progress = projectProgress(project);
            const tasksDue = project.tasks.filter((t) => t.status !== 'Completed' && isOverdue(t.dueDate)).length;
            return (
              <div
                key={project._id}
                onClick={() => navigate(`/projects/${project._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(`/projects/${project._id}`);
                }}
                className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all text-left cursor-pointer"
              >
                {/* Color top strip */}
                <div className={`h-1.5 w-full ${statusDot(project)}`} />

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-teal-800 shrink-0">
                        <Layers className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-teal-800 transition">
                          {project.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                          PM: {project.manager || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed line-clamp-2 min-h-8">
                    {project.description}
                  </p>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase mb-1.5">
                      <span>{progress.done} of {progress.total} tasks done</span>
                      <span>{progress.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-700 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <ListTodo className="w-3.5 h-3.5" />
                        {project.tasks.length}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <Users className="w-3.5 h-3.5" />
                        {project.members?.length ?? 0}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {tasksDue > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-white bg-rose-500 border border-rose-500 rounded px-1.5 py-0.5 shadow-sm shadow-rose-500/30">
                            {tasksDue} overdue
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {project.startDate ? formatDue(project.startDate) : 'No dates'}
                          </span>
                        )}
                      </span>
                    </div>
                    <MemberStack members={project.members ?? []} />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${project._id}/board`);
                    }}
                    className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-teal-800 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <span>Open Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create project modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-md w-full overflow-hidden animate-fadeIn text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-teal-800" />
                Create Project
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aero Portal Gateway"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the goals and deliverables..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Project Manager
                  </label>
                  <input
                    type="text"
                    placeholder={currentUserName}
                    value={newManager}
                    onChange={(e) => setNewManager(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ProjectDoc['status'])}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
