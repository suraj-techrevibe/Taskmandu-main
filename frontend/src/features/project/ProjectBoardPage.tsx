import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  Loader2,
  MessageSquare,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import type { Employee, Role, Task } from '../../types';
import * as projectApi from '../../services/project';
import type { ProjectDoc } from '../../services/project';
import { toast } from '../../services/toast';
import {
  PRIORITIES,
  TASK_STATUSES,
  PriorityBadge,
  TaskStatusBadge,
  AssigneeAvatar,
  findEmployee,
  employeeName,
  formatDue,
  formatTimestamp,
  isOverdue,
  taskProgress,
} from './projectShared';

interface ProjectBoardPageProps {
  employees: Employee[];
  currentRole: Role;
  currentUserId: string;
  currentUserName: string;
  onAddNotification: (title: string, message: string, type: 'attendance' | 'shift' | 'task' | 'hr' | 'leave') => void;
}

const BOARD_COLUMNS: {
  title: string;
  statuses: Task['status'][];
  accent: string;
  count: string;
  header: string;
  border: string;
}[] = [
  {
    title: 'Backlog',
    statuses: ['Assigned', 'Pending'],
    accent: 'bg-slate-500',
    count: 'bg-slate-600 text-white',
    header: 'bg-slate-100 text-slate-800 border-slate-200',
    border: 'border-t-slate-500',
  },
  {
    title: 'In Progress',
    statuses: ['In Progress'],
    accent: 'bg-blue-500',
    count: 'bg-blue-500 text-white',
    header: 'bg-blue-50 text-blue-800 border-blue-200',
    border: 'border-t-blue-500',
  },
  {
    title: 'Blocked',
    statuses: ['Blocked'],
    accent: 'bg-rose-500',
    count: 'bg-rose-500 text-white',
    header: 'bg-rose-50 text-rose-800 border-rose-200',
    border: 'border-t-rose-500',
  },
  {
    title: 'Done',
    statuses: ['Completed', 'Cancelled'],
    accent: 'bg-emerald-500',
    count: 'bg-emerald-500 text-white',
    header: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    border: 'border-t-emerald-500',
  },
];

export default function ProjectBoardPage({
  employees,
  currentRole,
  currentUserId,
  currentUserName,
  onAddNotification,
}: ProjectBoardPageProps) {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<ProjectDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [prefillStatus, setPrefillStatus] = useState<Task['status']>('Assigned');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssigneeIds, setNewAssigneeIds] = useState<string[]>([]);
  const [newPriority, setNewPriority] = useState<Task['priority']>('Medium');
  const [newDue, setNewDue] = useState(new Date().toISOString().slice(0, 10));
  const [newEst, setNewEst] = useState(4);
  const [newTags, setNewTags] = useState('');
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const load = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    projectApi
      .getProject(projectId)
      .then(setProject)
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!projectId) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-14 text-center shadow-xs">
        <p className="text-sm font-bold text-slate-500">Project not found.</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const replaceProject = (server: ProjectDoc) => setProject(server);

  const handleUpdateStatus = (taskId: string, status: Task['status']) => {
    if (!project) return;
    const optimistic = { ...project };
    optimistic.tasks = optimistic.tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    setProject(optimistic);
    projectApi
      .updateProjectTask(project._id, taskId, { status })
      .then(replaceProject)
      .catch(() => load());
  };

  const handleDrop = (colStatuses: Task['status'][], e: React.DragEvent) => {
    e.preventDefault();
    if (!dragTaskId || !project) return;
    const task = project.tasks.find((t) => t.id === dragTaskId);
    if (task && colStatuses.includes(task.status)) {
      setDragTaskId(null);
      setDragOverCol(null);
      return;
    }
    const target = colStatuses.includes('Completed') ? 'Completed' : colStatuses[0];
    handleUpdateStatus(dragTaskId, target);
    setDragTaskId(null);
    setDragOverCol(null);
  };

  const handleDeleteProject = () => {
    if (!project) return;
    setDeletingProject(true);
    projectApi
      .deleteProject(project._id)
      .then(() => {
        toast.success('Project deleted.');
        navigate('/projects');
      })
      .catch(() => setDeletingProject(false))
      .finally(() => setDeletingProject(false));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newTitle.trim() || !newDesc.trim()) return;

    const tags = newTags.split(',').map((t) => t.trim()).filter(Boolean);
    const assigneeNames = newAssigneeIds.map(id => {
      const emp = findEmployee(employees, id);
      return emp ? `${emp.firstName} ${emp.lastName}` : '';
    }).filter(Boolean);

    projectApi
      .addProjectTask(project._id, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        assignedToId: newAssigneeIds,
        assignedByName: assigneeNames.join(', '),
        priority: newPriority,
        dueDate: newDue,
        estimatedHours: newEst,
        tags,
      })
      .then((server) => {
        replaceProject(server);
        setIsCreateOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewTags('');
        setNewAssigneeIds([]);
        toast.success('Task created.');
        onAddNotification(
          'New Scoped Task',
          `Task "${newTitle.trim()}" was added to ${project.name} (${prefillStatus}).`,
          'task',
        );
      })
      .catch(() => {});
  };

  const openCreateFor = (status: Task['status']) => {
    setPrefillStatus(status);
    setNewAssigneeIds([]);
    setIsCreateOpen(true);
  };

  const progress = {
    total: project?.tasks.length ?? 0,
    done: project?.tasks.filter((t) => t.status === 'Completed').length ?? 0,
  };

  return (
    <div className="space-y-5 text-slate-800 animate-fadeIn">
      {/* Board header */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition shrink-0 cursor-pointer"
              title="Back to project"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 tracking-tight truncate">
                  {project?.name ?? 'Project Board'}
                </h2>
                <span className="text-[9px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md uppercase">
                  {project?.status ?? '—'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold truncate">
                PM: {project?.manager || 'Unassigned'} • {project?.startDate} → {project?.endDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-3 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
              <span className="flex items-center gap-1">
                <ListTodo className="w-3.5 h-3.5 text-slate-400" />
                {progress.total} tasks
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {progress.done} done
              </span>
            </div>

            <button
              onClick={() => openCreateFor('Assigned')}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-teal-900/10 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              Create Task
            </button>

            {project && (
              <button
                onClick={() => setConfirmDeleteProject(true)}
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition shrink-0 cursor-pointer"
                title="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {project && project.tasks.length > 0 && (
          <div className="mt-4">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-teal-700 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Kanban board */}
      {loading && !project ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 bg-slate-100/70 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : !project ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-14 text-center shadow-xs">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-900 uppercase">Project not found</h3>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
          >
            Back to Projects
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {BOARD_COLUMNS.map((col) => {
            const colTasks = project.tasks.filter((t) => col.statuses.includes(t.status));
            const isDragOver = dragOverCol === col.title && dragTaskId;

            return (
<div
                  key={col.title}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCol(col.title);
                  }}
                  onDragLeave={() => setDragOverCol((cur) => (cur === col.title ? null : cur))}
                  onDrop={(e) => handleDrop(col.statuses, e)}
                  className={`bg-slate-50/70 border rounded-2xl p-3 space-y-3 transition-all border-t-4 ${
                    col.border
                  } ${isDragOver ? 'border-t-teal-400 ring-2 ring-teal-500/20 bg-teal-50/40' : 'border-slate-100'}`}
                >
                  {/* Column header */}
                  <div
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl border ${col.header}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.accent} shadow-sm`} />
                      <h4 className="text-[11px] font-black uppercase tracking-wide">{col.title}</h4>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${col.count}`}>
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => openCreateFor(col.statuses[0])}
                      className="p-1 text-slate-400 hover:text-teal-800 hover:bg-white rounded-lg transition cursor-pointer"
                      title={`Add task to ${col.title}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                {/* Task cards */}
                <div className="space-y-2.5 min-h-[120px]">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assigneeName={(task.assignedToId || []).map(id => employeeName(findEmployee(employees, id))).filter(Boolean).join(', ') || 'Unassigned'}
                      onDragStart={() => setDragTaskId(task.id)}
                      onDragEnd={() => {
                        setDragTaskId(null);
                        setDragOverCol(null);
                      }}
                      onOpen={() => navigate(`/projects/${project._id}/tasks/${task.id}`)}
                    />
                  ))}

                  {colTasks.length === 0 && (
                    <div className="border border-dashed border-slate-200 rounded-xl py-8 text-center text-[10px] text-slate-400 font-semibold">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create task modal */}
      {isCreateOpen && project && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-lg w-full overflow-hidden animate-fadeIn text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-800" />
                Create Task · {project.name}
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Summary
                </label>
                <input
                  type="text"
                  required
                  placeholder="What needs to be done?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
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
                  placeholder="Describe the task in detail..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Assignees
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-slate-150 rounded-xl bg-slate-50 p-2 space-y-1">
                    {employees.map((emp) => (
                      <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={newAssigneeIds.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAssigneeIds(prev => [...prev, emp.id]);
                            } else {
                              setNewAssigneeIds(prev => prev.filter(id => id !== emp.id));
                            }
                          }}
                          className="w-3 h-3 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-[10px] font-bold text-slate-700">{emp.firstName} {emp.lastName}</span>
                      </label>
                    ))}
                  </div>
                  {newAssigneeIds.length > 0 && (
                    <p className="text-[9px] text-slate-400 font-semibold">{newAssigneeIds.length} selected</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Status
                  </label>
                  <select
                    value={prefillStatus}
                    onChange={(e) => setPrefillStatus(e.target.value as Task['status'])}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Task['priority'])}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newEst}
                    onChange={(e) => setNewEst(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Feature, Bug, UI"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete project confirmation */}
      {confirmDeleteProject && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Delete project?</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">
                  <span className="text-slate-700">{project.name}</span> and all its tasks, comments, documents and
                  shared variables will be permanently removed. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmDeleteProject(false)}
                disabled={deletingProject}
                className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDeleteProject()}
                disabled={deletingProject}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingProject && <Loader2 className="w-3 h-3 animate-spin" />}
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  assigneeName,
  onDragStart,
  onDragEnd,
  onOpen,
}: {
  task: Task;
  assigneeName: string;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpen: () => void;
}) {
  const progress = taskProgress(task);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className="group bg-white border border-slate-150 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <PriorityBadge priority={task.priority} compact />
        <TaskStatusBadge status={task.status} compact />
      </div>

      <p className="text-xs font-extrabold text-slate-900 leading-snug group-hover:text-teal-800 transition line-clamp-2">
        {task.title}
      </p>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 text-[8px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5"
            >
              <Tag className="w-2.5 h-2.5 text-teal-700" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {progress.total > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progress.done === progress.total ? 'bg-emerald-500' : 'bg-teal-600'}`}
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <span className="text-[9px] font-bold text-slate-400">
            {progress.done}/{progress.total}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <AssigneeAvatar name={assigneeName} size="h-6 w-6 text-[8px]" />
          {task.dueDate && isOverdue(task.dueDate) && task.status !== 'Completed' ? (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-white bg-rose-500 border border-rose-500 rounded-md px-1.5 py-0.5 shadow-sm shadow-rose-500/30">
              <Calendar className="w-2.5 h-2.5" />
              Overdue
            </span>
          ) : task.dueDate && task.status === 'Completed' ? (
            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
              <Calendar className="w-2.5 h-2.5" />
              {formatDue(task.dueDate)}
            </span>
          ) : (
            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
              <Calendar className="w-2.5 h-2.5" />
              {formatDue(task.dueDate)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span
            className="inline-flex items-center gap-0.5 text-[9px] font-bold"
            title={`Created ${formatTimestamp(task.createdAt)}`}
          >
            <Clock className="w-3 h-3" />
            {formatTimestamp(task.createdAt)}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold">
            <MessageSquare className="w-3 h-3" />
            {task.comments?.length ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
