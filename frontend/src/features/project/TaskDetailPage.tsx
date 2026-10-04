import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FolderKanban,
  ListTodo,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import type { Employee, Role, SubTask, Task } from '../../types';
import * as projectApi from '../../services/project';
import type { ProjectDoc } from '../../services/project';
import { toast } from '../../services/toast';
import {
  PRIORITIES,
  TASK_STATUSES,
  PRIORITY_META,
  TASK_STATUS_META,
  PriorityBadge,
  TaskStatusBadge,
  AssigneeAvatar,
  findEmployee,
  employeeName,
  formatDue,
  formatTimestamp,
  isOverdue,
} from './projectShared';

interface TaskDetailPageProps {
  employees: Employee[];
  currentRole: Role;
  currentUserId: string;
  currentUserName: string;
  onAddNotification: (title: string, message: string, type: 'attendance' | 'shift' | 'task' | 'hr' | 'leave') => void;
}

interface SubTaskSectionProps {
  task: Task;
  projectId: string;
  employees: Employee[];
  onProjectChange: (server: ProjectDoc) => void;
}

export default function TaskDetailPage({
  employees,
  currentRole,
  currentUserId,
  currentUserName,
  onAddNotification,
}: TaskDetailPageProps) {
  const navigate = useNavigate();
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();

  const [project, setProject] = useState<ProjectDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const [commentText, setCommentText] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');

  const [subtasksCollapsed, setSubtasksCollapsed] = useState(false);
  const [commentsCollapsed, setCommentsCollapsed] = useState(false);

  const [confirmDeleteTask, setConfirmDeleteTask] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);

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

  const task = useMemo(
    () => project?.tasks.find((t) => t.id === taskId) ?? null,
    [project, taskId],
  );

  const replaceProject = (server: ProjectDoc) => setProject(server);

  if (!projectId || !taskId) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-14 text-center shadow-xs">
        <p className="text-sm font-bold text-slate-500">Task not found.</p>
      </div>
    );
  }

  if (loading && !project) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-slate-100/70 animate-pulse rounded-2xl" />
        <div className="h-96 bg-slate-100/70 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!project || !task) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-14 text-center shadow-xs">
        <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-black text-slate-900 uppercase">Task not found</h3>
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="mt-4 px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
        >
          Back to Board
        </button>
      </div>
    );
  }

  const taskIndex = project.tasks.findIndex((t) => t.id === task.id);
  const taskKey = taskIndex >= 0 ? `${project.name.slice(0, 4).toUpperCase()}-${taskIndex + 1}` : task.id.slice(-6);
  const assigneeNames = (task.assignedToId || []).map(id => employeeName(findEmployee(employees, id))).filter(Boolean);
  const comments = task.comments ?? [];
  const subtasks = task.subTasks ?? [];

  const updateTask = (patch: Partial<Task>) => {
    projectApi
      .updateProjectTask(project._id, task.id, patch)
      .then(replaceProject)
      .catch(() => load());
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    projectApi
      .addTaskComment(project._id, task.id, commentText.trim())
      .then((server) => {
        replaceProject(server);
        setCommentText('');
        toast.success('Comment added.');
      })
      .catch(() => {});
  };

  const handleSaveDesc = (e: React.FormEvent) => {
    e.preventDefault();
    updateTask({ description: descDraft });
    setEditingDesc(false);
    toast.success('Description updated.');
  };

  const handleDeleteTask = () => {
    if (!project || !task) return;
    setDeletingTask(true);
    projectApi
      .deleteProjectTask(project._id, task.id)
      .then(() => {
        toast.success('Task deleted.');
        onAddNotification('Task Removed', `Task "${task.title}" was deleted.`, 'task');
        navigate(`/projects/${project._id}`);
      })
      .catch(() => setDeletingTask(false))
      .finally(() => setDeletingTask(false));
  };

  return (
    <div className="space-y-5 text-slate-800 animate-fadeIn">
      {/* Breadcrumb header */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
        <button
          onClick={() => navigate(`/projects/${project._id}`)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-teal-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {project.name} board
        </button>

        <div className="mt-3 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 shrink-0 mt-0.5">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                  {taskKey}
                </span>
                <PriorityBadge priority={task.priority} compact />
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1">{task.title}</h2>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">
                {project.name} · Created by {project.manager || '—'}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Created {formatTimestamp(task.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmDeleteTask(true)}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-600/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main column */}
        <div className="lg:col-span-8 space-y-5">
          {/* Description */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Description</h3>
              {!editingDesc && (
                <button
                  onClick={() => {
                    setDescDraft(task.description);
                    setEditingDesc(true);
                  }}
                  className="text-[10px] font-bold text-teal-800 hover:text-teal-600 cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>

            {editingDesc ? (
              <form onSubmit={handleSaveDesc} className="space-y-2.5">
                <textarea
                  autoFocus
                  rows={5}
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
                  placeholder="Add a detailed description..."
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDesc(false)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-150 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                {task.description || 'No description provided.'}
              </p>
            )}
          </div>

          {/* Sub-tasks */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-teal-700" />
                Sub-tasks ({subtasks.filter((s) => s.status === 'Completed').length}/{subtasks.length})
              </h3>
              <button
                onClick={() => setSubtasksCollapsed((c) => !c)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-50 transition cursor-pointer"
                title={subtasksCollapsed ? 'Expand sub-tasks' : 'Collapse sub-tasks'}
              >
                {subtasksCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
            {!subtasksCollapsed && (
              <SubTaskSection task={task} projectId={project._id} employees={employees} onProjectChange={replaceProject} />
            )}
          </div>

          {/* Comments */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-teal-700" />
                Comments ({comments.length})
              </h3>
              <button
                onClick={() => setCommentsCollapsed((c) => !c)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-50 transition cursor-pointer"
                title={commentsCollapsed ? 'Expand comments' : 'Collapse comments'}
              >
                {commentsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!commentsCollapsed && (
              <>
            <div className="space-y-4 mb-5">
              {comments.length === 0 && (
                <p className="text-[11px] text-slate-400 font-semibold">No comments yet. Start the conversation.</p>
              )}
              {comments.map((com) => (
                <div key={com.id} className="flex gap-3">
                  <AssigneeAvatar name={com.authorName} size="h-7 w-7 text-[10px]" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-800">{com.authorName}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                        {com.authorRole || 'Member'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {formatTimestamp(com.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1 whitespace-pre-wrap leading-relaxed">
                      {com.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2.5">
              <AssigneeAvatar name={currentUserName} size="h-8 w-8 text-[10px]" />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </form>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Details</h3>

            <Field label="Status">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${TASK_STATUS_META[task.status]?.chip ?? 'bg-slate-400'}`}
                  />
                  <select
                    value={task.status}
                    onChange={(e) => {
                      updateTask({ status: e.target.value as Task['status'] });
                      toast.success(`Status changed to ${e.target.value}`);
                    }}
                    className="flex-1 bg-transparent border-none text-xs font-extrabold text-slate-700 focus:outline-none"
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <TaskStatusBadge status={task.status} compact />
                </div>
                {task.status === 'Blocked' && (
                  <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                    ⚠ This task is blocked — resolve blockers to move forward.
                  </p>
                )}
              </div>
            </Field>

            <Field label="Priority">
              <div className="flex gap-1.5 flex-wrap">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      updateTask({ priority: p });
                      toast.success(`Priority set to ${p}`);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                      task.priority === p
                        ? `${PRIORITY_META[p].badge} ${PRIORITY_META[p].glow} scale-105`
                        : 'bg-slate-50 text-slate-500 border border-slate-150 hover:bg-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Assignees">
              <div className="max-h-32 overflow-y-auto border border-slate-150 rounded-xl bg-slate-50 p-2 space-y-1">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={(task.assignedToId || []).includes(emp.id)}
                      onChange={(e) => {
                        const current = task.assignedToId || [];
                        let updated: string[];
                        if (e.target.checked) {
                          updated = [...current, emp.id];
                        } else {
                          updated = current.filter(id => id !== emp.id);
                        }
                        updateTask({
                          assignedToId: updated,
                          ...(updated.length > 0 ? { assignedByName: updated.map(id => {
                            const e = findEmployee(employees, id);
                            return e ? `${e.firstName} ${e.lastName}` : '';
                          }).filter(Boolean).join(', ') } : {}),
                        } as Partial<Task>);
                        toast.success('Assignees updated.');
                      }}
                      className="w-3 h-3 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-[10px] font-bold text-slate-700">{emp.firstName} {emp.lastName}</span>
                  </label>
                ))}
              </div>
              {(task.assignedToId || []).length > 0 && (
                <p className="text-[9px] text-slate-400 font-semibold mt-1">{(task.assignedToId || []).length} selected</p>
              )}
            </Field>

            <Field label="Due Date">
              <input
                type="date"
                value={task.dueDate ?? ''}
                onChange={(e) => {
                  updateTask({ dueDate: e.target.value });
                  toast.success('Due date updated.');
                }}
                className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              />
            </Field>

            <Field label="Estimated Hours">
              <input
                type="number"
                min={0}
                value={task.estimatedHours ?? 0}
                onChange={(e) => updateTask({ estimatedHours: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              />
            </Field>

            <Field label="Tags">
              <input
                type="text"
                defaultValue={(task.tags ?? []).join(', ')}
                onBlur={(e) => {
                  const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                  if (tags.join(', ') !== (task.tags ?? []).join(', ')) {
                    updateTask({ tags });
                    toast.success('Tags updated.');
                  }
                }}
                placeholder="Feature, Bug..."
                className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              />
            </Field>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[10px] font-semibold text-slate-500">
              <p className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className={isOverdue(task.dueDate) && task.status !== 'Completed' ? 'text-rose-600 font-bold' : ''}>
                  {formatDue(task.dueDate)}
                </span>
              </p>
              <p className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                {task.estimatedHours ?? 0} hours estimated
              </p>
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-slate-400" />
                {subtasks.filter((s) => s.status === 'Completed').length} of {subtasks.length} sub-tasks done
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 flex items-center gap-3">
            <AssigneeAvatar name={assigneeNames[0] || ''} size="h-9 w-9 text-xs" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Assignees</p>
              <p className="text-xs font-extrabold text-slate-800 truncate">{assigneeNames.length > 0 ? assigneeNames.join(', ') : 'Unassigned'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete task confirmation */}
      {confirmDeleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Delete task?</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">
                  <span className="text-slate-700">{task.title}</span> and all its comments and sub-tasks will be
                  permanently removed from {project.name}.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmDeleteTask(false)}
                disabled={deletingTask}
                className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDeleteTask()}
                disabled={deletingTask}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingTask && <Loader2 className="w-3 h-3 animate-spin" />}
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );
}

function SubTaskSection({ task, projectId, employees, onProjectChange }: SubTaskSectionProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newAssigneeIds, setNewAssigneeIds] = useState<string[]>([]);
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubTask | null>(null);
  const [deleting, setDeleting] = useState(false);

  const subtasks = task.subTasks ?? [];

  const toggleComments = (subId: string) => {
    setCollapsedComments((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) {
        next.delete(subId);
      } else {
        next.add(subId);
      }
      return next;
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const assigneeNames = newAssigneeIds.map(id => {
      const emp = findEmployee(employees, id);
      return emp ? `${emp.firstName} ${emp.lastName}` : '';
    }).filter(Boolean);
    projectApi
      .addSubTask(projectId, task.id, {
        title: newTitle.trim(),
        assignedToId: newAssigneeIds,
        assignedByName: assigneeNames.join(', '),
      })
      .then((server) => {
        onProjectChange(server);
        setNewTitle('');
        setNewAssigneeIds([]);
        setAdding(false);
      })
      .catch(() => {});
  };

  const toggleStatus = (sub: SubTask) => {
    const next = sub.status === 'Completed' ? 'In Progress' : 'Completed';
    projectApi
      .updateSubTask(projectId, task.id, sub.id, {
        status: next,
        completedAt: next === 'Completed' ? new Date().toISOString() : null,
      })
      .then(onProjectChange)
      .catch(() => {});
  };

  const handleDelete = (sub: SubTask) => {
    setDeleting(true);
    projectApi
      .deleteSubTask(projectId, task.id, sub.id)
      .then(onProjectChange)
      .catch(() => setDeleting(false))
      .finally(() => {
        setDeleting(false);
        setDeleteTarget(null);
      });
  };

  const handleComment = (e: React.FormEvent, subId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    projectApi
      .addSubTaskComment(projectId, task.id, subId, commentText.trim())
      .then((server) => {
        onProjectChange(server);
        setCommentText('');
        setCollapsedComments((prev) => {
          const next = new Set(prev);
          next.delete(subId);
          return next;
        });
      })
      .catch(() => {});
  };

  if (subtasks.length === 0 && !adding) {
    return (
      <div className="border border-dashed border-slate-200 rounded-xl py-6 text-center">
        <p className="text-[11px] text-slate-400 font-semibold">No sub-tasks yet.</p>
        <button
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Sub-task
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {subtasks.map((sub) => {
        const isDone = sub.status === 'Completed';
        const isCollapsed = collapsedComments.has(sub.id);
        return (
          <div key={sub.id} className="border border-slate-150 rounded-xl p-3 bg-slate-50/40 space-y-2">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => toggleStatus(sub)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 cursor-pointer ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-white border-slate-300 hover:border-teal-500'
                }`}
                title={isDone ? 'Mark as in progress' : 'Mark as done'}
              >
                {isDone && <CheckCircle2 className="w-3 h-3" />}
              </button>

              <span
                className={`flex-1 text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}
              >
                {sub.title}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleComments(sub.id)}
                  className="inline-flex items-center gap-1 p-1 text-slate-400 hover:text-teal-700 rounded transition cursor-pointer"
                  title={isCollapsed ? 'Show comments' : 'Hide comments'}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold">{sub.comments?.length ?? 0}</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(sub)}
                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                  title="Delete sub-task"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-6.5">
              <AssigneeAvatar name={sub.assignedByName || (sub.assignedToId || []).map(id => employeeName(findEmployee(employees, id))).filter(Boolean)[0] || ''} size="h-5 w-5 text-[7px]" />
              <span className="text-[9px] font-bold text-slate-400">
                {sub.assignedByName || (sub.assignedToId || []).map(id => employeeName(findEmployee(employees, id))).filter(Boolean).join(', ') || 'Unassigned'}
              </span>
              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5 ml-auto">
                <Clock className="w-2.5 h-2.5" />
                Created {formatTimestamp(sub.createdAt)}
              </span>
              {isDone && (
                <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {formatTimestamp(sub.completedAt)}
                </span>
              )}
            </div>

            {!isCollapsed && (
              <div className="pl-6.5 space-y-2">
                {(sub.comments ?? []).map((c) => (
                  <div key={c.id} className="text-[10px] bg-white border border-slate-100 rounded-lg p-2">
                    <div className="flex items-center justify-between text-[8px] font-black uppercase text-slate-400 mb-0.5">
                      <span>{c.authorName}</span>
                      <span>{formatTimestamp(c.createdAt)}</span>
                    </div>
                    <p className="font-semibold text-slate-700">{c.text}</p>
                  </div>
                ))}
                <form onSubmit={(e) => handleComment(e, sub.id)} className="flex gap-1.5">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Comment..."
                    className="flex-1 bg-white border border-slate-150 px-2 py-1.5 rounded-lg text-[10px] font-semibold focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      })}

      {adding && (
        <form onSubmit={handleAdd} className="border border-slate-150 rounded-xl p-3 bg-white space-y-2">
          <input
            type="text"
            autoFocus
            required
            placeholder="Sub-task title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
          />
          <div className="max-h-24 overflow-y-auto border border-slate-150 rounded-lg bg-slate-50 p-1.5 space-y-0.5">
            {employees.map((emp) => (
              <label key={emp.id} className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5">
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
                  className="w-2.5 h-2.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-[9px] font-bold text-slate-700">{emp.firstName} {emp.lastName}</span>
              </label>
            ))}
          </div>
          {newAssigneeIds.length > 0 && (
            <p className="text-[8px] text-slate-400 font-semibold">{newAssigneeIds.length} selected</p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-150 rounded-lg text-[10px] font-bold text-slate-500 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!adding && subtasks.length > 0 && (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 hover:text-teal-600 transition cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Add Sub-task
        </button>
      )}

      {/* Delete sub-task confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Delete sub-task?</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">
                  <span className="text-slate-700">{deleteTarget.title}</span> and all its comments will be
                  permanently removed.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete(deleteTarget)}
                disabled={deleting}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                Delete Sub-task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
