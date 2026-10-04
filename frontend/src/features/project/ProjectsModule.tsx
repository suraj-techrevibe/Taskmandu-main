import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Briefcase, 
  Layers, 
  FolderOpen, 
  FolderKanban,
  Plus, 
  FileText, 
  Eye, 
  EyeOff, 
  Key, 
  Trash2, 
  Download, 
  Check, 
  Calendar, 
  Users, 
  Tag, 
  Clock, 
  AlertCircle, 
  Settings, 
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  Edit2,
  ArrowRight,
  ChevronRight,
  ListTodo,
  FileCode,
  Paperclip,
  Upload,
  UserCheck,
  X
} from 'lucide-react';
import { Employee, Role, Task, SubTask, ProjectMember } from '../../types';
import RichTextEditor from '../../components/RichTextEditor';
import * as projectApi from '../../services/project';
import type { ProjectDoc, ProjectMemberDoc } from '../../services/project';
import { formatTimestamp } from './projectShared';
import { API_BASE_URL } from '../../services/http';

const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/uploads';

function toLocalProject(doc: ProjectDoc): Project {
  return {
    id: doc._id,
    name: doc.name,
    description: doc.description,
    status: doc.status,
    manager: doc.manager,
    startDate: doc.startDate ?? '',
    endDate: doc.endDate ?? '',
    color: doc.color,
    documents: doc.documents.map((d) => ({
      id: d._id,
      name: d.name,
      size: d.size,
      uploadedBy: d.uploadedBy,
      uploadedAt: d.uploadedAt ?? '',
      description: d.description,
      filePath: d.filePath,
      mimeType: d.mimeType,
    })),
    sharedVariables: doc.sharedVariables.map((v) => ({
      id: v._id,
      key: v.key,
      value: v.value,
      isSecret: v.isSecret,
      type: v.type,
      description: v.description,
      updatedBy: v.updatedBy,
      updatedAt: v.updatedAt ?? '',
    })),
    tasks: doc.tasks.map(t => ({
      ...t,
      subTasks: (t.subTasks ?? []).map((st: any) => ({
        id: st.id ?? st._id,
        title: st.title ?? '',
        assignedToId: Array.isArray(st.assignedToId) ? st.assignedToId : st.assignedToId ? [st.assignedToId] : [],
        assignedByName: st.assignedByName ?? '',
        status: st.status ?? 'Assigned',
        completedAt: st.completedAt ?? null,
        comments: st.comments ?? [],
      })),
    })),
    members: (doc.members ?? []).map((m: any) => ({
      id: m._id ?? m.id,
      userId: m.userId ?? '',
      name: m.name ?? '',
      email: m.email ?? '',
      role: m.role ?? 'member',
      joinedAt: m.joinedAt ?? '',
    })),
  };
}

export interface ProjectDocument {
  id: string;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  filePath?: string;
  mimeType?: string;
}

export interface SharedVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  type: 'Environment' | 'Server Creds' | 'Database' | 'Other';
  description: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Planning' | 'Active' | 'Blocked' | 'On Hold' | 'Completed';
  manager: string;
  startDate: string;
  endDate: string;
  color: string;
  documents: ProjectDocument[];
  sharedVariables: SharedVariable[];
  tasks: Task[];
  members: ProjectMember[];
}

interface ProjectsModuleProps {
  employees: Employee[];
  currentRole: Role;
  currentUserId: string;
  currentUserName: string;
  onAddNotification: (title: string, message: string, type: 'attendance' | 'shift' | 'task' | 'hr' | 'leave') => void;
}

export default function ProjectsModule({ 
  employees, 
  currentRole, 
  currentUserId, 
  currentUserName,
  onAddNotification
}: ProjectsModuleProps) {
  
  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);

  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [workspaceTab, setWorkspaceTab] = useState<'details' | 'documents' | 'secrets' | 'tasks' | 'members'>('details');

  // Search/Filters
  const [projectSearch, setProjectSearch] = useState('');

  // Modals Toggle
  const [isCreateProjOpen, setIsCreateProjOpen] = useState(false);
  const [isEditProjOpen, setIsEditProjOpen] = useState(false);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [isAddVarOpen, setIsAddVarOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Form Fields: Create Project
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjManager, setNewProjManager] = useState('');
  const todayStr = new Date().toISOString().slice(0, 10);
  const in3Months = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const [newProjStart, setNewProjStart] = useState(todayStr);
  const [newProjEnd, setNewProjEnd] = useState(in3Months);
  const [newProjStatus, setNewProjStatus] = useState<Project['status']>('Active');
  const [newProjColor, setNewProjColor] = useState('bg-teal-500');

  // Form Fields: Edit Project
  const [editProjName, setEditProjName] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');
  const [editProjManager, setEditProjManager] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [editProjStart, setEditProjStart] = useState('');
  const [editProjEnd, setEditProjEnd] = useState('');
  const [editProjStatus, setEditProjStatus] = useState<Project['status']>('Active');
  const [editProjColor, setEditProjColor] = useState('bg-teal-500');

  // Form Fields: Add Document
  const [newDocName, setNewDocName] = useState('');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocSize, setNewDocSize] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [newDocDesc, setNewDocDesc] = useState('');

  // Form Fields: Edit Document
  const [isEditDocOpen, setIsEditDocOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ProjectDocument | null>(null);
  const [editDocName, setEditDocName] = useState('');
  const [editDocDesc, setEditDocDesc] = useState('');

  // Form Fields: Add Shared Variable
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarVal, setNewVarVal] = useState('');

  // Form Fields: Edit Shared Variable (Wordpad Canvas)
  const [editingVariable, setEditingVariable] = useState<SharedVariable | null>(null);
  const [isEditVarOpen, setIsEditVarOpen] = useState(false);
  const [editVarKey, setEditVarKey] = useState('');
  const [editVarVal, setEditVarVal] = useState('');
  const [editVarSecret, setEditVarSecret] = useState(false);
  const [editVarType, setEditVarType] = useState<SharedVariable['type']>('Environment');
  const [editVarDesc, setEditVarDesc] = useState('');

  // Form Fields: Add Scoped Task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState<string[]>([]);
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('High');
  const [newTaskDue, setNewTaskDue] = useState(todayStr);
  const [newTaskEst, setNewTaskEst] = useState(4);
  const [newTaskTagString, setNewTaskTagString] = useState('Feature, Code');

  // Form Fields: Edit Scoped Task
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Variable Mask Visibility Map
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  // Active Selected Project object
  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // Comment Field per Task State
  const [newTaskComment, setNewTaskComment] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Sub-Task State
  const [activeSubTaskTaskId, setActiveSubTaskTaskId] = useState<string | null>(null);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [newSubTaskComment, setNewSubTaskComment] = useState('');
  const [activeSubTaskId, setActiveSubTaskId] = useState<string | null>(null);

  // Members State
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'admin' | 'member' | 'viewer'>('member');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [projectAssigneeId, setProjectAssigneeId] = useState('');

  // Sync to Storage
  // Load real projects from the backend when reachable
  useEffect(() => {
    projectApi.listProjects()
      .then((list) => {
        if (list.length === 0) return;
        const mapped = list.map(toLocalProject);
        setProjects(mapped);
        const target =
          projectId && mapped.some((p) => p.id === projectId) ? projectId : list[0]._id;
        setActiveProjectId(target);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the active project in sync with the URL param
  useEffect(() => {
    if (!projectId) return;
    setActiveProjectId(projectId);
    setWorkspaceTab('details');
  }, [projectId]);

  // Replace a project with the server's authoritative version
  const replaceProject = (server: ProjectDoc) => {
    setProjects(prev => prev.map(p => p.id === server._id ? toLocalProject(server) : p));
  };

  const isAdminRole = true; // Allowed for all roles to facilitate complete Project CRUD testing

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjDesc.trim()) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: newProjName,
      description: newProjDesc,
      status: newProjStatus,
      manager: newProjManager,
      startDate: newProjStart,
      endDate: newProjEnd,
      color: newProjColor,
      documents: [],
      sharedVariables: [],
      tasks: [],
      members: []
    };

    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setIsCreateProjOpen(false);

    // Reset Form
    setNewProjName('');
    setNewProjDesc('');
    setNewProjStart(todayStr);
    setNewProjEnd(in3Months);

    projectApi.createProject({
      name: newProject.name,
      description: newProject.description,
      status: newProject.status,
      manager: newProject.manager,
      startDate: newProject.startDate || null,
      endDate: newProject.endDate || null,
      color: newProject.color,
      members: [{
        userId: currentUserId,
        name: currentUserName,
        email: '',
        role: 'owner',
      }],
    })
      .then(created => {
        setProjects(prev => [toLocalProject(created), ...prev.filter(p => p.id !== newProject.id)]);
        setActiveProjectId(created._id);
        navigate(`/projects/${created._id}`);
      })
      .catch(() => {});

    onAddNotification(
      'New Project Initiated',
      `Project "${newProject.name}" has been established under ${newProject.manager}'s coordination.`,
      'hr'
    );
  };

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProjName.trim() || !editProjDesc.trim() || !activeProject) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          name: editProjName,
          description: editProjDesc,
          status: editProjStatus,
          manager: editProjManager,
          startDate: editProjStart,
          endDate: editProjEnd,
          color: editProjColor
        };
      }
      return p;
    }));

    setIsEditProjOpen(false);

    projectApi.updateProject(activeProject.id, {
      name: editProjName,
      description: editProjDesc,
      status: editProjStatus,
      manager: editProjManager,
      startDate: editProjStart || null,
      endDate: editProjEnd || null,
      color: editProjColor,
    }).then(replaceProject).catch(() => {});

    onAddNotification(
      'Project Workspace Updated',
      `Project "${editProjName}" has been successfully updated.`,
      'hr'
    );
  };

  const handleDeleteProject = (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to archive and remove this project from your workspace? All tasks, secrets, and files will be deleted.')) return;
    
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    if (activeProjectId === id && remaining.length > 0) {
      setActiveProjectId(remaining[0].id);
    }

    projectApi.deleteProject(id).catch(() => {});
  };

  const handleSelectDocFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewDocFile(file);
    setNewDocFileName(file.name);
    setNewDocName(file.name);
    const mb = file.size / (1024 * 1024);
    setNewDocSize(mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`);
    e.target.value = '';
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !activeProject || !newDocFile) return;

    const newDoc: ProjectDocument = {
      id: `doc-${Date.now()}`,
      name: newDocName,
      size: newDocSize,
      uploadedBy: currentUserName,
      uploadedAt: new Date().toISOString(),
      description: newDocDesc
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          documents: [newDoc, ...p.documents]
        };
      }
      return p;
    }));

    setNewDocName('');
    setNewDocFileName('');
    setNewDocDesc('');
    setNewDocFile(null);
    setIsAddDocOpen(false);

    projectApi.addDocument(activeProject.id, {
      file: newDocFile,
      name: newDoc.name,
      uploadedBy: newDoc.uploadedBy,
      description: newDoc.description,
    }).then(replaceProject).catch(() => {});

    onAddNotification(
      'Document Uploaded',
      `File "${newDoc.name}" has been pinned to the ${activeProject.name} document workspace.`,
      'task'
    );
  };

  const handleDeleteDocument = (docId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          documents: p.documents.filter(d => d.id !== docId)
        };
      }
      return p;
    }));

    projectApi.deleteDocument(activeProject.id, docId).then(replaceProject).catch(() => {});
  };

  const handleOpenEditDoc = (doc: ProjectDocument) => {
    setEditingDoc(doc);
    setEditDocName(doc.name);
    setEditDocDesc(doc.description || '');
    setIsEditDocOpen(true);
  };

  const handleUpdateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDocName.trim() || !activeProject || !editingDoc) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          documents: p.documents.map(d => d.id === editingDoc.id ? { ...d, name: editDocName, description: editDocDesc } : d)
        };
      }
      return p;
    }));

    projectApi.updateDocument(activeProject.id, editingDoc.id, {
      name: editDocName,
      description: editDocDesc,
    }).then(replaceProject).catch(() => {});
    setIsEditDocOpen(false);
    setEditingDoc(null);
  };

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarKey.trim() || !newVarVal.trim() || !activeProject) return;

    const plainContent = newVarVal
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const newVar: SharedVariable = {
      id: `var-${Date.now()}`,
      key: newVarKey.toUpperCase().replace(/\s+/g, '_'),
      value: newVarVal,
      isSecret: false,
      type: 'Other',
      description: plainContent.slice(0, 120),
      updatedBy: currentUserName,
      updatedAt: new Date().toISOString()
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          sharedVariables: [newVar, ...p.sharedVariables]
        };
      }
      return p;
    }));

    setNewVarKey('');
    setNewVarVal('');
    setIsAddVarOpen(false);

    projectApi.addVariable(activeProject.id, {
      key: newVar.key,
      value: newVar.value,
      isSecret: newVar.isSecret,
      type: newVar.type,
      description: newVar.description,
      updatedBy: newVar.updatedBy,
    }).then(replaceProject).catch(() => {});
  };

  const handleUpdateVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVarKey.trim() || !editVarVal.trim() || !activeProject || !editingVariable) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          sharedVariables: p.sharedVariables.map(v => {
            if (v.id === editingVariable.id) {
              return {
                ...v,
                key: editVarKey.toUpperCase().replace(/\s+/g, '_'),
                value: editVarVal,
                isSecret: editVarSecret,
                type: editVarType,
                description: editVarDesc,
                updatedBy: currentUserName,
                updatedAt: new Date().toISOString()
              };
            }
            return v;
          })
        };
      }
      return p;
    }));

    setIsEditVarOpen(false);
    setEditingVariable(null);

    projectApi.updateVariable(activeProject.id, editingVariable.id, {
      key: editVarKey.toUpperCase().replace(/\s+/g, '_'),
      value: editVarVal,
      isSecret: editVarSecret,
      type: editVarType,
      description: editVarDesc,
      updatedBy: currentUserName,
    }).then(replaceProject).catch(() => {});
  };

  const handleDeleteVariable = (varId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          sharedVariables: p.sharedVariables.filter(v => v.id !== varId)
        };
      }
      return p;
    }));

    projectApi.deleteVariable(activeProject.id, varId).then(replaceProject).catch(() => {});
  };

  const handleToggleSecretMask = (varId: string) => {
    setVisibleSecrets(prev => ({
      ...prev,
      [varId]: !prev[varId]
    }));
  };

  // Task Handlers
  const handleAddScopedTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDesc.trim() || !activeProject) return;

    const tags = newTaskTagString.split(',').map(t => t.trim()).filter(Boolean);

    const newTask: Task = {
      id: `task-sc-${Date.now()}`,
      title: newTaskTitle,
      description: newTaskDesc,
      assignedToId: newTaskAssigneeIds,
      priority: newTaskPriority,
      dueDate: newTaskDue,
      estimatedHours: newTaskEst,
      status: 'Assigned',
      attachments: [],
      tags,
      comments: [],
      subTasks: []
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          tasks: [...p.tasks, newTask]
        };
      }
      return p;
    }));

    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskTagString('Feature, Code');
    setIsAddTaskOpen(false);

    projectApi.addProjectTask(activeProject.id, {
      title: newTask.title,
      description: newTask.description,
      assignedToId: newTask.assignedToId,
      assignedByName: newTaskAssigneeIds.length > 0
        ? newTaskAssigneeIds.map(id => {
            const emp = employees.find(e => e.id === id);
            return emp ? `${emp.firstName} ${emp.lastName}` : '';
          }).filter(Boolean).join(', ')
        : '',
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      estimatedHours: newTask.estimatedHours,
      tags: newTask.tags,
    }).then(replaceProject).catch(() => {});

    // Notification trigger
    const assigneeNames = newTaskAssigneeIds.map(id => {
      const emp = employees.find(e => e.id === id);
      return emp ? `${emp.firstName} ${emp.lastName}` : '';
    }).filter(Boolean);
    onAddNotification(
      'New Scoped Task',
      `Task "${newTask.title}" has been assigned to ${assigneeNames.length > 0 ? assigneeNames.join(', ') : 'Unassigned'} under ${activeProject.name}.`,
      'task'
    );
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        const updatedTasks = p.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, status: newStatus };
          }
          return t;
        });
        return { ...p, tasks: updatedTasks };
      }
      return p;
    }));

    projectApi.updateProjectTask(activeProject.id, taskId, { status: newStatus }).then(replaceProject).catch(() => {});
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description);
    setNewTaskAssigneeIds(task.assignedToId || []);
    setNewTaskPriority(task.priority);
    setNewTaskDue(task.dueDate);
    setNewTaskEst(task.estimatedHours);
    setNewTaskTagString((task.tags || []).join(', '));
    setIsEditTaskOpen(true);
  };

  const handleEditTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDesc.trim() || !activeProject || !editingTask) return;

    const tags = newTaskTagString.split(',').map(t => t.trim()).filter(Boolean);

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          tasks: p.tasks.map(t => t.id === editingTask.id
            ? {
                ...t,
                title: newTaskTitle,
                description: newTaskDesc,
                assignedToId: newTaskAssigneeIds,
                priority: newTaskPriority,
                dueDate: newTaskDue,
                estimatedHours: newTaskEst,
                tags
              }
            : t)
        };
      }
      return p;
    }));

    projectApi.updateProjectTask(activeProject.id, editingTask.id, {
      title: newTaskTitle,
      description: newTaskDesc,
      assignedToId: newTaskAssigneeIds,
      priority: newTaskPriority,
      dueDate: newTaskDue,
      estimatedHours: newTaskEst,
      tags,
    }).then(replaceProject).catch(() => {});
    setIsEditTaskOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task and all its comments?')) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          tasks: p.tasks.filter(t => t.id !== taskId)
        };
      }
      return p;
    }));

    projectApi.deleteProjectTask(activeProject.id, taskId).then(replaceProject).catch(() => {});
  };

  const handleAddCommentToTask = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    if (!newTaskComment.trim() || !activeProject) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        const updatedTasks = p.tasks.map(t => {
          if (t.id === taskId) {
            const comments = t.comments || [];
            return {
              ...t,
              comments: [
                ...comments,
                {
                  id: `com-${Date.now()}`,
                  authorName: currentUserName,
                  authorRole: currentRole,
                  text: newTaskComment,
                  createdAt: new Date().toISOString()
                }
              ]
            };
          }
          return t;
        });
        return { ...p, tasks: updatedTasks };
      }
      return p;
    }));

    setNewTaskComment('');

    projectApi.addTaskComment(activeProject.id, taskId, newTaskComment)
      .then(replaceProject)
      .catch(() => {});
  };

  // Sub-Task Handlers
  const handleAddSubTask = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    if (!newSubTaskTitle.trim() || !activeProject) return;

    projectApi.addSubTask(activeProject.id, taskId, {
      title: newSubTaskTitle,
      assignedToId: newTaskAssigneeIds,
      assignedByName: newTaskAssigneeIds.length > 0
        ? newTaskAssigneeIds.map(id => {
            const emp = employees.find(e => e.id === id);
            return emp ? `${emp.firstName} ${emp.lastName}` : '';
          }).filter(Boolean).join(', ')
        : '',
    }).then(replaceProject).catch(() => {});

    setNewSubTaskTitle('');
    setActiveSubTaskTaskId(null);
  };

  const handleUpdateSubTaskStatus = (taskId: string, subTaskId: string, newStatus: SubTask['status']) => {
    if (!activeProject) return;

    projectApi.updateSubTask(activeProject.id, taskId, subTaskId, {
      status: newStatus,
      completedAt: newStatus === 'Completed' ? new Date().toISOString() : null,
    }).then(replaceProject).catch(() => {});
  };

  const handleDeleteSubTask = (taskId: string, subTaskId: string) => {
    if (!activeProject || !confirm('Delete this sub-task?')) return;

    projectApi.deleteSubTask(activeProject.id, taskId, subTaskId)
      .then(replaceProject)
      .catch(() => {});
  };

  const handleAddSubTaskComment = (e: React.FormEvent, taskId: string, subTaskId: string) => {
    e.preventDefault();
    if (!newSubTaskComment.trim() || !activeProject) return;

    projectApi.addSubTaskComment(activeProject.id, taskId, subTaskId, newSubTaskComment)
      .then(replaceProject)
      .catch(() => {});

    setNewSubTaskComment('');
  };

  // Member Handlers
  const handleInviteMember = (employee: Employee) => {
    if (!activeProject) return;

    projectApi.addMember(activeProject.id, {
      userId: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      role: inviteRole,
    }).then(replaceProject).catch(() => {});

    setInviteSearch('');
    setInviteRole('member');
    setIsInviteOpen(false);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!activeProject || !confirm('Remove this member from the project?')) return;

    projectApi.removeMember(activeProject.id, memberId)
      .then(replaceProject)
      .catch(() => {});
  };

  const getStatusBadgeColor = (status: Project['status']) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Completed': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'On Hold': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Blocked': return 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadgeColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-50 text-rose-800 border-rose-100 font-black animate-pulse';
      case 'High': return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'Medium': return 'bg-blue-50 text-blue-800 border-blue-100';
      default: return 'bg-slate-50 text-slate-650 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fadeIn">
      
      {/* Top action row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Active Project Hub</h2>
          <p className="text-sm text-gray-500">
            Securely store project documents, manage server keys/credentials, and track scoped tasks on Kanban boards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Create Project trigger */}
          {isAdminRole && (
            <button
              onClick={() => setIsCreateProjOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-500/15 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Create Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Workspace Panel */}
      <div className="w-full">

        {/* WORKSPACE AREA */}
        {activeProject ? (
          <div className="bg-white border border-slate-100/95 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[580px]">
            
            {/* Project Header Bar */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full shrink-0 ${activeProject.color}`}></span>
                  <h3 className="text-base font-black text-slate-900">{activeProject.name}</h3>
                  {isAdminRole && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditProjName(activeProject.name);
                          setEditProjDesc(activeProject.description);
                          setEditProjManager(activeProject.manager);
                          setEditProjStart(activeProject.startDate);
                          setEditProjEnd(activeProject.endDate);
                          setEditProjStatus(activeProject.status);
                          setEditProjColor(activeProject.color);
                          setManagerSearch('');
                          setIsEditProjOpen(true);
                        }}
                        className="text-slate-400 hover:text-teal-800 transition p-1 rounded hover:bg-slate-100 cursor-pointer"
                        title="Edit Project Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(activeProject.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1 rounded hover:bg-slate-100 cursor-pointer"
                        title="Archive Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Project Lead: <span className="text-slate-800 font-black">{activeProject.manager}</span> • Duration: <span className="text-slate-700 font-bold">{activeProject.startDate} to {activeProject.endDate}</span>
                </p>
              </div>

              {/* Status Indicator */}
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => navigate(`/projects/${activeProject.id}/board`)}
                  className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-[10px] font-extrabold transition flex items-center gap-1.5 shadow-sm shadow-teal-900/10 cursor-pointer"
                  title="Open Kanban Board"
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Open Board</span>
                </button>
                <span className={`text-xs px-3 py-1 font-bold uppercase rounded-full border ${getStatusBadgeColor(activeProject.status)}`}>
                  {activeProject.status}
                </span>
              </div>
            </div>

            {/* Navigation Tabs for Workspace */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
              <button
                onClick={() => setWorkspaceTab('details')}
                className={`flex-1 sm:flex-initial py-2.5 px-5 text-xs font-bold transition rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
                  workspaceTab === 'details' 
                    ? 'bg-white text-teal-900 shadow-xs ring-1 ring-slate-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Basic Details</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('documents')}
                className={`flex-1 sm:flex-initial py-2.5 px-5 text-xs font-bold transition rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
                  workspaceTab === 'documents' 
                    ? 'bg-white text-teal-900 shadow-xs ring-1 ring-slate-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Documents ({activeProject.documents.length})</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('secrets')}
                className={`flex-1 sm:flex-initial py-2.5 px-5 text-xs font-bold transition rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
                  workspaceTab === 'secrets' 
                    ? 'bg-white text-teal-900 shadow-xs ring-1 ring-slate-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Shared variables ({activeProject.sharedVariables.length})</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('tasks')}
                className={`flex-1 sm:flex-initial py-2.5 px-5 text-xs font-bold transition rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
                  workspaceTab === 'tasks' 
                    ? 'bg-white text-teal-900 shadow-xs ring-1 ring-slate-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span>Task Management ({activeProject.tasks.length})</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('members')}
                className={`flex-1 sm:flex-initial py-2.5 px-5 text-xs font-bold transition rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
                  workspaceTab === 'members' 
                    ? 'bg-white text-teal-900 shadow-xs ring-1 ring-slate-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Members ({activeProject.members?.length || 0})</span>
              </button>
            </div>

            {/* TAB PANES */}
            <div className="p-6 flex-1 text-left flex flex-col">
              
              {/* TAB 1: BASIC DETAILS */}
              {workspaceTab === 'details' && (
                <div className="flex-1 flex flex-col animate-fadeIn">
                  
                  <div className="space-y-6">
                  {/* Summary card */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider block">Description</h4>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      {activeProject.description}
                    </p>
                  </div>

                  {/* Metadata and progress details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <div className="bg-slate-50/30 border border-slate-100 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase block">Project Timeline</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-teal-800" />
                        <span className="text-xs font-extrabold text-slate-950">
                          {activeProject.startDate} to {activeProject.endDate}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/30 border border-slate-100 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase block">PM / Coordinator</span>
                      <div className="flex items-center gap-2 mt-1">
                        <UserCheck className="w-4 h-4 text-teal-800" />
                        <span className="text-xs font-extrabold text-slate-950">
                          {activeProject.manager}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/30 border border-slate-100 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase block">Deliverables Status</span>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-extrabold text-slate-950">
                          {activeProject.tasks.filter(t => t.status === 'Completed').length} Completed Tasks
                        </span>
                      </div>
                    </div>

                  </div>

                  </div>

                  {/* Project Controls Panel */}
                  {isAdminRole && (
                    <div className="mt-auto pt-6">
                    <div className="border border-slate-150 rounded-2xl p-5 space-y-4 bg-slate-50/10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                            <Settings className="w-4 h-4 text-teal-800" />
                            <span>Administrative Workspace Controls (CRUD)</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 font-semibold mt-1">
                            Directly modify basic parameters, update coordinator assignment, adjust timeline boundaries, or permanently delete the workspace.
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <button
                            onClick={() => {
                              setEditProjName(activeProject.name);
                              setEditProjDesc(activeProject.description);
                              setEditProjManager(activeProject.manager);
                              setEditProjStart(activeProject.startDate);
                              setEditProjEnd(activeProject.endDate);
                              setEditProjStatus(activeProject.status);
                              setEditProjColor(activeProject.color);
                              setManagerSearch('');
                              setIsEditProjOpen(true);
                            }}
                            className="px-3.5 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-teal-900/15 cursor-pointer transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Project</span>
                          </button>

                          <button
                            onClick={() => handleDeleteProject(activeProject.id)}
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-rose-900/15 cursor-pointer transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Project</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: DOCUMENTS */}
              {workspaceTab === 'documents' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Documents action header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase">Project Reference Files</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Secure attachment storage for engineering and spec files.</p>
                    </div>

                    <button
                      onClick={() => setIsAddDocOpen(true)}
                      className="px-3 py-1.5 bg-teal-850 hover:bg-teal-750 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Upload File</span>
                    </button>
                  </div>

                  {/* Document Rows */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {activeProject.documents.map(doc => (
                      <div 
                        key={doc.id}
                        className="p-3.5 bg-slate-50/30 hover:bg-slate-50 border border-slate-100/80 rounded-xl flex items-center justify-between gap-4 transition"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-8 w-8 bg-teal-50 text-teal-800 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-xs text-slate-900 truncate">{doc.name}</h5>
                            <p className="text-[10px] text-slate-500 font-semibold line-clamp-1 mt-0.5">
                              {doc.description || 'No description supplied.'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                              Size: {doc.size} • Uploaded by {doc.uploadedBy} on {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {doc.filePath ? (
                            <a
                              href={`${UPLOADS_BASE_URL}/${doc.filePath}`}
                              download={doc.name}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 hover:bg-white text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-150 rounded-lg transition shrink-0 cursor-pointer"
                              title="Download reference"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <button
                              onClick={() => alert(`Legacy reference: ${doc.name}. Re-upload the file to enable downloads.`)}
                              className="p-1.5 hover:bg-white text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-150 rounded-lg transition shrink-0 cursor-pointer"
                              title="Download reference"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditDoc(doc)}
                            className="p-1.5 hover:bg-white text-slate-500 hover:text-teal-800 border border-transparent hover:border-slate-150 rounded-lg transition shrink-0 cursor-pointer"
                            title="Edit document"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-150 rounded-lg transition shrink-0 cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {activeProject.documents.length === 0 && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400 text-xs font-semibold">No documents have been uploaded to this project yet.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 3: SHARED VARIABLES */}
              {workspaceTab === 'secrets' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Variables action header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase">Configuration Keys & Server Credentials</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Store sensitive env keys, server access parameters, or database ports safely.</p>
                    </div>

                    <button
                      onClick={() => setIsAddVarOpen(true)}
                      className="px-3 py-1.5 bg-teal-850 hover:bg-teal-750 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Variable</span>
                    </button>
                  </div>

                  {/* Variables rows */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {activeProject.sharedVariables.map(v => {
                      const isRevealed = !!visibleSecrets[v.id];
                      return (
                        <div 
                          key={v.id}
                          className="p-4 bg-slate-50/40 hover:bg-slate-50 border border-slate-150/70 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition"
                        >
                          <div className="space-y-1 text-left min-w-0 md:flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900 font-mono tracking-tight bg-slate-100 px-2 py-0.5 rounded">
                                {v.key}
                              </span>
                              <span className={`text-[8px] px-2 py-0.2 rounded font-black uppercase ${
                                v.isSecret ? 'bg-rose-50 text-rose-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {v.isSecret ? 'Secret / Key' : v.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-semibold line-clamp-1">
                              {v.description || 'No description provided.'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold">
                              Modified by {v.updatedBy} • {new Date(v.updatedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                            {/* Masked / Revealed Value with Rich Preview */}
                            <div className="bg-white/95 px-3 py-1.5 rounded-xl border border-slate-150 min-w-[200px] max-w-xs text-left shrink-0 overflow-hidden shadow-2xs">
                              {v.isSecret && !isRevealed ? (
                                <span className="font-mono text-xs font-black text-slate-400 block tracking-widest text-center py-1">
                                  •••••••••••••••••
                                </span>
                              ) : (
                                <div 
                                  className="text-[10px] text-slate-600 line-clamp-2 leading-normal overflow-hidden max-h-12 border-l-2 border-teal-850 pl-2 bg-slate-50/50 py-1 rounded"
                                  dangerouslySetInnerHTML={{ __html: v.value || '<i>(Empty document)</i>' }}
                                />
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0 justify-end">
                              {v.isSecret && (
                                <button
                                  onClick={() => handleToggleSecretMask(v.id)}
                                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 transition shrink-0 cursor-pointer"
                                  title={isRevealed ? 'Hide variable value' : 'Show variable value'}
                                >
                                  {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setEditingVariable(v);
                                  setEditVarKey(v.key);
                                  setEditVarVal(v.value);
                                  setEditVarType(v.type);
                                  setEditVarSecret(v.isSecret);
                                  setEditVarDesc(v.description);
                                  setIsEditVarOpen(true);
                                }}
                                className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-teal-850 rounded-lg border border-slate-200 transition shrink-0 cursor-pointer"
                                title="Edit Variable Document"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteVariable(v.id)}
                                className="p-1.5 bg-white hover:bg-rose-50 hover:border-rose-150 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 transition shrink-0 cursor-pointer"
                                title="Remove variable"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}

                    {activeProject.sharedVariables.length === 0 && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400 text-xs font-semibold">No environment credentials or keys are registered under this project.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 4: TASK MANAGEMENT */}
              {workspaceTab === 'tasks' && (
                <div className="space-y-4 animate-fadeIn text-left">
                  
                  {/* Task Actions header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase">Project-Scoped Task Board</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Manage, review comments, and assign tasks specifically for this project.</p>
                    </div>

                    <button
                      onClick={() => setIsAddTaskOpen(true)}
                      className="px-3 py-1.5 bg-teal-850 hover:bg-teal-750 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create Task</span>
                    </button>
                  </div>

                  {/* Scoped Task Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                    {activeProject.tasks.map(task => {
                      const assigneeNames = (task.assignedToId || []).map(id => {
                        const emp = employees.find(e => e.id === id);
                        return emp ? `${emp.firstName} ${emp.lastName}` : '';
                      }).filter(Boolean);
                      const isTaskSelected = activeTaskId === task.id;

                      return (
                        <div 
                          key={task.id}
                          className={`p-4 rounded-xl border text-left transition flex flex-col gap-3 ${
                            isTaskSelected 
                              ? 'bg-teal-50/20 border-teal-200 ring-1 ring-teal-100' 
                              : 'bg-slate-50/20 border-slate-150 hover:bg-slate-50/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-[8px] px-2 py-0.5 rounded border uppercase font-black ${getPriorityBadgeColor(task.priority)}`}>
                              {task.priority} Priority
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Dropdown status switcher */}
                              <select
                                value={task.status}
                                onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as any)}
                                className="text-[9px] font-extrabold bg-white border border-slate-200 px-1.5 py-0.5 rounded focus:outline-none"
                              >
                                <option value="Assigned">Assigned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Blocked">Blocked</option>
                                <option value="Completed">Completed</option>
                              </select>

                              <button
                                onClick={() => handleOpenEditTask(task)}
                                className="p-1 bg-white hover:bg-slate-100 text-slate-400 hover:text-teal-850 rounded border border-slate-150 transition shrink-0 cursor-pointer"
                                title="Edit Task"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>

                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 bg-white hover:bg-rose-50 hover:border-rose-150 text-slate-400 hover:text-rose-600 rounded border border-slate-150 transition shrink-0 cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h5 className="font-extrabold text-xs text-slate-900 leading-snug">{task.title}</h5>
                            <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          </div>

                          {/* Assignee Details */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase border-t border-slate-100 pt-2.5">
                            <span>Assignee: {assigneeNames.length > 0 ? assigneeNames.join(', ') : 'Unassigned'}</span>
                            <span className="text-slate-500">Due: {task.dueDate}</span>
                          </div>

                          {/* Sub-Tasks Section */}
                          <div className="border-t border-slate-100 pt-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <button
                                type="button"
                                onClick={() => setActiveSubTaskTaskId(activeSubTaskTaskId === task.id ? null : task.id)}
                                className="text-[10px] font-extrabold text-teal-850 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                              >
                                <ListTodo className="w-3 h-3" />
                                <span>Sub-Tasks ({task.subTasks?.length || 0})</span>
                                <ChevronRight className={`w-3 h-3 transition ${activeSubTaskTaskId === task.id ? 'rotate-90' : ''}`} />
                              </button>
                              {activeSubTaskTaskId === task.id && (
                                <button
                                  type="button"
                                  onClick={() => { setActiveSubTaskTaskId(task.id); setNewSubTaskTitle(''); }}
                                  className="text-[9px] font-bold text-teal-850 hover:text-teal-700 cursor-pointer"
                                >
                                  + Add
                                </button>
                              )}
                            </div>

                            {/* Sub-Tasks List */}
                            {activeSubTaskTaskId === task.id && (
                              <div className="space-y-1.5 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-150 animate-fadeIn">
                                {(task.subTasks || []).map(subTask => (
                                  <div key={subTask.id} className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-100">
                                    <input
                                      type="checkbox"
                                      checked={subTask.status === 'Completed'}
                                      onChange={(e) => handleUpdateSubTaskStatus(task.id, subTask.id, e.target.checked ? 'Completed' : 'In Progress')}
                                      className="w-3 h-3 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                    />
                                    <span className={`flex-1 text-[10px] font-semibold ${subTask.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                      {subTask.title}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubTask(task.id, subTask.id)}
                                      className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ))}

                                {/* Add Sub-Task Form */}
                                <form onSubmit={(e) => handleAddSubTask(e, task.id)} className="flex gap-1.5 pt-1 border-t border-slate-150">
                                  <input
                                    type="text"
                                    required
                                    placeholder="New sub-task..."
                                    value={newSubTaskTitle}
                                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                                    className="flex-1 bg-white border border-slate-150 px-2 py-1 rounded text-[10px] font-semibold focus:outline-none"
                                  />
                                  <button
                                    type="submit"
                                    className="px-2 py-1 bg-teal-850 hover:bg-teal-750 text-white rounded text-[10px] font-bold transition cursor-pointer"
                                  >
                                    Add
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>

                          {/* Expand Comment Drawer */}
                          <div className="border-t border-slate-100 pt-2 flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveTaskId(isTaskSelected ? null : task.id)}
                              className="text-[10px] font-extrabold text-teal-850 hover:text-teal-700 flex items-center gap-1 cursor-pointer self-start"
                            >
                              <span>Comments ({task.comments?.length || 0})</span>
                              <ChevronRight className={`w-3.5 h-3.5 transition ${isTaskSelected ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Comments Expanded inside task card */}
                            {isTaskSelected && (
                              <div className="space-y-2 mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150 animate-fadeIn">
                                <div className="space-y-2 max-h-24 overflow-y-auto">
                                  {(task.comments || []).map(com => (
                                    <div key={com.id} className="text-[10px] border-b border-slate-100 pb-1.5 last:border-0">
                                      <div className="flex items-center justify-between text-[8px] font-black uppercase text-slate-400 mb-0.5">
                                        <span>{com.authorName} ({com.authorRole})</span>
                                        <span>{formatTimestamp(com.createdAt)}</span>
                                      </div>
                                      <p className="font-semibold text-slate-700 leading-normal">{com.text}</p>
                                    </div>
                                  ))}

                                  {(task.comments || []).length === 0 && (
                                    <p className="text-[10px] text-slate-400 font-semibold text-center py-1">No comments yet.</p>
                                  )}
                                </div>

                                <form onSubmit={(e) => handleAddCommentToTask(e, task.id)} className="flex gap-1.5 pt-1.5 border-t border-slate-150">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Write a comment..."
                                    value={newTaskComment}
                                    onChange={(e) => setNewTaskComment(e.target.value)}
                                    className="flex-1 bg-white border border-slate-150 px-2 py-1 rounded text-[10px] font-semibold focus:outline-none"
                                  />
                                  <button
                                    type="submit"
                                    className="px-2.5 py-1 bg-teal-850 hover:bg-teal-750 text-white rounded text-[10px] font-bold transition cursor-pointer"
                                  >
                                    Add
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}

                    {activeProject.tasks.length === 0 && (
                      <div className="col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400 text-xs font-semibold">No tasks are scoped specifically to this project yet.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 5: MEMBERS */}
              {workspaceTab === 'members' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Members action header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase">Project Members</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Manage who has access to this project workspace.</p>
                    </div>

                    <button
                      onClick={() => setIsInviteOpen(true)}
                      className="px-3 py-1.5 bg-teal-850 hover:bg-teal-750 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Invite Member</span>
                    </button>
                  </div>

                  {/* Members List */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {(activeProject.members || []).map(member => (
                      <div 
                        key={member.id}
                        className="p-4 bg-slate-50/40 hover:bg-slate-50 border border-slate-150/70 rounded-xl flex items-center justify-between gap-4 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 bg-teal-50 text-teal-800 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-xs text-slate-900 truncate">{member.name}</p>
                            <p className="text-[10px] text-slate-500 font-semibold truncate">{member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${
                            member.role === 'owner' ? 'bg-amber-50 text-amber-800' :
                            member.role === 'admin' ? 'bg-blue-50 text-blue-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {member.role}
                          </span>
                          {member.role !== 'owner' && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded border border-transparent hover:border-rose-150 transition shrink-0 cursor-pointer"
                              title="Remove member"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {(!activeProject.members || activeProject.members.length === 0) && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400 text-xs font-semibold">No members have been added to this project yet.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 shadow-xs min-h-[580px] flex flex-col items-center justify-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mb-2" />
            <h3 className="text-sm font-black text-slate-900 uppercase">No Project Selected</h3>
            <p className="text-xs text-slate-450 mt-1 max-w-sm font-semibold">
              Establish a new project to open its document workspace and secrets logs.
            </p>
          </div>
        )}

      </div>

      {/* CREATE NEW PROJECT DIALOG */}
      {isCreateProjOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-md w-full overflow-hidden animate-fadeIn text-left">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-850" />
                <span>Initiate Project Workspace</span>
              </h3>
              <button 
                onClick={() => setIsCreateProjOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aero Portal Gateway"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description Summary</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the goals and deliverables..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assignee</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={projectAssigneeId ? employees.find(e => e.id === projectAssigneeId) ? `${employees.find(e => e.id === projectAssigneeId)!.firstName} ${employees.find(e => e.id === projectAssigneeId)!.lastName}` : 'Search assignee...' : 'Search assignee... (optional)'}
                      value={assigneeSearch}
                      onChange={(e) => { setAssigneeSearch(e.target.value); if (projectAssigneeId) setProjectAssigneeId(''); }}
                      onFocus={() => setAssigneeSearch('')}
                      className="w-full bg-slate-50 border border-slate-150 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                    />
                    {projectAssigneeId && (
                      <button
                        onClick={() => { setProjectAssigneeId(''); setAssigneeSearch(''); }}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {assigneeSearch && (
                    <div className="mt-1 max-h-40 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                      {employees
                        .filter(e => {
                          const query = assigneeSearch.toLowerCase();
                          const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
                          return fullName.includes(query) || e.email.toLowerCase().includes(query);
                        })
                        .slice(0, 8)
                        .map(emp => (
                          <button
                            key={emp.id}
                            onClick={() => { setProjectAssigneeId(emp.id); setAssigneeSearch(''); }}
                            className="w-full text-left px-3 py-2 hover:bg-teal-50 transition flex items-center gap-2.5 cursor-pointer"
                          >
                            <div className="h-6 w-6 shrink-0 rounded-lg bg-teal-50 text-teal-800 font-extrabold flex items-center justify-center text-[9px]">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-800 truncate">{emp.firstName} {emp.lastName}</p>
                              <p className="text-[9px] text-slate-400 truncate">{emp.designation}</p>
                            </div>
                          </button>
                        ))}
                      {employees.filter(e => {
                        const query = assigneeSearch.toLowerCase();
                        const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
                        return fullName.includes(query) || e.email.toLowerCase().includes(query);
                      }).length === 0 && (
                        <div className="text-center py-3 text-slate-400 text-[10px] font-semibold">No users found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</label>
                  <select
                    value={newProjStatus}
                    onChange={(e) => setNewProjStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Blocked">Blocked</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newProjStart}
                    onChange={(e) => setNewProjStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">End Date</label>
                  <input
                    type="date"
                    required
                    value={newProjEnd}
                    onChange={(e) => setNewProjEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Theme Color Accent</label>
                <div className="flex gap-3 pt-1">
                  {[
                    { bg: 'bg-indigo-500', name: 'Indigo' },
                    { bg: 'bg-emerald-500', name: 'Emerald' },
                    { bg: 'bg-amber-500', name: 'Amber' },
                    { bg: 'bg-rose-500', name: 'Rose' },
                    { bg: 'bg-teal-500', name: 'Teal' }
                  ].map(c => (
                    <button
                      key={c.bg}
                      type="button"
                      onClick={() => setNewProjColor(c.bg)}
                      className={`h-6 w-6 rounded-full transition shrink-0 cursor-pointer ${c.bg} ${
                        newProjColor === c.bg ? 'ring-2 ring-teal-850 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateProjOpen(false)}
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

      {/* EDIT EXISTING PROJECT DIALOG */}
      {isEditProjOpen && activeProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-md w-full overflow-hidden animate-fadeIn text-left">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-850" />
                <span>Edit Project Workspace</span>
              </h3>
              <button 
                onClick={() => setIsEditProjOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aero Portal Gateway"
                  value={editProjName}
                  onChange={(e) => setEditProjName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description Summary</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the goals and deliverables..."
                  value={editProjDesc}
                  onChange={(e) => setEditProjDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Project Manager / Coordinator</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={editProjManager ? editProjManager : 'Search project manager...'}
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                    onFocus={() => setManagerSearch('')}
                    className="w-full bg-slate-50 border border-slate-150 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                  />
                  {editProjManager && !managerSearch && (
                    <button
                      onClick={() => setEditProjManager('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {managerSearch && (
                  <div className="mt-1 max-h-40 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                    {employees
                      .filter(e => {
                        const query = managerSearch.toLowerCase();
                        const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
                        return fullName.includes(query) || e.email.toLowerCase().includes(query);
                      })
                      .slice(0, 8)
                      .map(emp => (
                        <button
                          key={emp.id}
                          onClick={() => { setEditProjManager(`${emp.firstName} ${emp.lastName}`); setManagerSearch(''); }}
                          className="w-full text-left px-3 py-2 hover:bg-teal-50 transition flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="h-6 w-6 shrink-0 rounded-lg bg-teal-50 text-teal-800 font-extrabold flex items-center justify-center text-[9px]">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[9px] text-slate-400 truncate">{emp.designation}</p>
                          </div>
                        </button>
                      ))}
                    {employees.filter(e => {
                      const query = managerSearch.toLowerCase();
                      const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
                      return fullName.includes(query) || e.email.toLowerCase().includes(query);
                    }).length === 0 && (
                      <div className="text-center py-3 text-slate-400 text-[10px] font-semibold">No users found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assignee</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={projectAssigneeId ? employees.find(e => e.id === projectAssigneeId) ? `${employees.find(e => e.id === projectAssigneeId)!.firstName} ${employees.find(e => e.id === projectAssigneeId)!.lastName}` : 'Search assignee...' : 'Search assignee... (optional)'}
                      value={assigneeSearch}
                      onChange={(e) => { setAssigneeSearch(e.target.value); if (projectAssigneeId) setProjectAssigneeId(''); }}
                      onFocus={() => setAssigneeSearch('')}
                      className="w-full bg-slate-50 border border-slate-150 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                    />
                    {projectAssigneeId && (
                      <button
                        onClick={() => { setProjectAssigneeId(''); setAssigneeSearch(''); }}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {assigneeSearch && (
                    <div className="mt-1 max-h-40 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                      {employees
                        .filter(e => {
                          const query = assigneeSearch.toLowerCase();
                          const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
                          return fullName.includes(query) || e.email.toLowerCase().includes(query);
                        })
                        .slice(0, 8)
                        .map(emp => (
                          <button
                            key={emp.id}
                            onClick={() => { setProjectAssigneeId(emp.id); setAssigneeSearch(''); }}
                            className="w-full text-left px-3 py-2 hover:bg-teal-50 transition flex items-center gap-2.5 cursor-pointer"
                          >
                            <div className="h-6 w-6 shrink-0 rounded-lg bg-teal-50 text-teal-800 font-extrabold flex items-center justify-center text-[9px]">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-800 truncate">{emp.firstName} {emp.lastName}</p>
                              <p className="text-[9px] text-slate-400 truncate">{emp.designation}</p>
                            </div>
                          </button>
                        ))}
                      {employees.filter(e => {
                        const query = assigneeSearch.toLowerCase();
                        const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
                        return fullName.includes(query) || e.email.toLowerCase().includes(query);
                      }).length === 0 && (
                        <div className="text-center py-3 text-slate-400 text-[10px] font-semibold">No users found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</label>
                  <select
                    value={editProjStatus}
                    onChange={(e) => setEditProjStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Blocked">Blocked</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editProjStart}
                    onChange={(e) => setEditProjStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">End Date</label>
                  <input
                    type="date"
                    required
                    value={editProjEnd}
                    onChange={(e) => setEditProjEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Theme Color Accent</label>
                <div className="flex gap-3 pt-1">
                  {[
                    { bg: 'bg-indigo-500', name: 'Indigo' },
                    { bg: 'bg-emerald-500', name: 'Emerald' },
                    { bg: 'bg-amber-500', name: 'Amber' },
                    { bg: 'bg-rose-500', name: 'Rose' },
                    { bg: 'bg-teal-500', name: 'Teal' }
                  ].map(c => (
                    <button
                      key={c.bg}
                      type="button"
                      onClick={() => setEditProjColor(c.bg)}
                      className={`h-6 w-6 rounded-full transition shrink-0 cursor-pointer ${c.bg} ${
                        editProjColor === c.bg ? 'ring-2 ring-teal-850 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you absolutely sure you want to permanently delete this project workspace and all its metrics?')) {
                      handleDeleteProject(activeProject.id);
                      setIsEditProjOpen(false);
                    }
                  }}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditProjOpen(false)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT DIALOG */}
      {isAddDocOpen && activeProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-sm w-full overflow-hidden animate-fadeIn text-left">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-850" />
                <span>Upload Document Spec</span>
              </h3>
              <button 
                onClick={() => setIsAddDocOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Attach File</label>
                <input
                  type="file"
                  id="doc-spec-file-input"
                  onChange={handleSelectDocFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('doc-spec-file-input')?.click()}
                  className="w-full border border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-teal-50/40 hover:border-teal-300 transition cursor-pointer flex flex-col items-center gap-1"
                >
                  <Upload className="w-4 h-4 text-teal-800" />
                  <span className="text-xs font-bold text-slate-600">{newDocFile ? 'Click to replace the selected file' : 'Click to choose a file'}</span>
                  <span className="text-[9px] text-slate-400 font-semibold">PDF, DOCX, ZIP, PNG, etc. up to 20 MB</span>
                </button>
                {newDocFileName && (
                  <div className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                    <span className="text-xs font-bold text-teal-800 truncate flex items-center gap-1.5 min-w-0">
                      <Paperclip className="w-3 h-3 shrink-0" />
                      <span className="truncate">{newDocFileName}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 shrink-0 ml-2">{newDocSize}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Document Filename</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. database_schema_v3.pdf"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description Details</label>
                <textarea
                  placeholder="Explain what reference documents are for..."
                  value={newDocDesc}
                  onChange={(e) => setNewDocDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Upload Spec
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT DOCUMENT DIALOG */}
      {isEditDocOpen && activeProject && editingDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-sm w-full overflow-hidden animate-fadeIn text-left">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-850" />
                <span>Edit Document Spec</span>
              </h3>
              <button 
                onClick={() => {
                  setIsEditDocOpen(false);
                  setEditingDoc(null);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateDocument} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Document Filename</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. database_schema_v3.pdf"
                  value={editDocName}
                  onChange={(e) => setEditDocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description Details</label>
                <textarea
                  placeholder="Explain what reference documents are for..."
                  value={editDocDesc}
                  onChange={(e) => setEditDocDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditDocOpen(false);
                    setEditingDoc(null);
                  }}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Save Document
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ADD SHARED VARIABLE DIALOG */}
      {isAddVarOpen && activeProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-2xl w-full overflow-hidden animate-fadeIn text-left">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Key className="w-4 h-4 text-teal-850" />
                <span>Create Shared Variable Document</span>
              </h3>
              <button 
                onClick={() => setIsAddVarOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddVariable} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Variable Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONGO_REPLICA_SET"
                  value={newVarKey}
                  onChange={(e) => setNewVarKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Document Description</label>
                <RichTextEditor
                  value={newVarVal}
                  onChange={(html) => setNewVarVal(html)}
                  placeholder="Write the document content and description here as an editable Word-like file..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddVarOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Create Document
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT SHARED VARIABLE DIALOG */}
      {isEditVarOpen && activeProject && editingVariable && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-2xl w-full overflow-hidden animate-fadeIn text-left">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-850" />
                <span>Edit Shared Variable Document</span>
              </h3>
              <button 
                onClick={() => {
                  setIsEditVarOpen(false);
                  setEditingVariable(null);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateVariable} className="p-5 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Variable Name (Key)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MONGO_REPLICA_SET"
                    value={editVarKey}
                    onChange={(e) => setEditVarKey(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Short Description</label>
                  <input
                    type="text"
                    placeholder="What is this variable used for?"
                    value={editVarDesc}
                    onChange={(e) => setEditVarDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Category Type</label>
                  <select
                    value={editVarType}
                    onChange={(e) => setEditVarType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Environment">Environment</option>
                    <option value="Server Creds">Server Creds</option>
                    <option value="Database">Database</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Secure Mask</label>
                  <button
                    type="button"
                    onClick={() => setEditVarSecret(!editVarSecret)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      editVarSecret 
                        ? 'bg-rose-50 border-rose-200 text-rose-800' 
                        : 'bg-slate-50 border-slate-150 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{editVarSecret ? 'Mask Value' : 'Plain Text'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Document Value Canvas</label>
                <RichTextEditor
                  value={editVarVal}
                  onChange={(html) => setEditVarVal(html)}
                  placeholder="Enter credential strings or write rich notes here..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditVarOpen(false);
                    setEditingVariable(null);
                  }}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Save Document
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CREATE WORK TASK DIALOG */}
      {isAddTaskOpen && activeProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-md w-full overflow-hidden animate-fadeIn text-left">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-teal-850" />
                <span>Create Project Scoped Task</span>
              </h3>
              <button 
                onClick={() => setIsAddTaskOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddScopedTask} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optimize postgres composite indexes"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description & Specs</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Provide checklist parameters..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assignees</label>
                  <div className="max-h-32 overflow-y-auto border border-slate-150 rounded-xl bg-slate-50 p-2 space-y-1">
                    {employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={newTaskAssigneeIds.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTaskAssigneeIds(prev => [...prev, emp.id]);
                            } else {
                              setNewTaskAssigneeIds(prev => prev.filter(id => id !== emp.id));
                            }
                          }}
                          className="w-3 h-3 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-[10px] font-bold text-slate-700">{emp.firstName} {emp.lastName}</span>
                      </label>
                    ))}
                  </div>
                  {newTaskAssigneeIds.length > 0 && (
                    <p className="text-[9px] text-slate-400 font-semibold">{newTaskAssigneeIds.length} selected</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Est. Hours</label>
                  <input
                    type="number"
                    required
                    value={newTaskEst}
                    onChange={(e) => setNewTaskEst(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Database, Refactor, QA"
                  value={newTaskTagString}
                  onChange={(e) => setNewTaskTagString(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
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

      {/* EDIT WORK TASK DIALOG */}
      {isEditTaskOpen && activeProject && editingTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-md w-full overflow-hidden animate-fadeIn text-left">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-teal-850" />
                <span>Edit Project Scoped Task</span>
              </h3>
              <button 
                onClick={() => {
                  setIsEditTaskOpen(false);
                  setEditingTask(null);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditTaskSubmit} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optimize postgres composite indexes"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description & Specs</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Provide checklist parameters..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assignees</label>
                  <div className="max-h-32 overflow-y-auto border border-slate-150 rounded-xl bg-slate-50 p-2 space-y-1">
                    {employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={newTaskAssigneeIds.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTaskAssigneeIds(prev => [...prev, emp.id]);
                            } else {
                              setNewTaskAssigneeIds(prev => prev.filter(id => id !== emp.id));
                            }
                          }}
                          className="w-3 h-3 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-[10px] font-bold text-slate-700">{emp.firstName} {emp.lastName}</span>
                      </label>
                    ))}
                  </div>
                  {newTaskAssigneeIds.length > 0 && (
                    <p className="text-[9px] text-slate-400 font-semibold">{newTaskAssigneeIds.length} selected</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Est. Hours</label>
                  <input
                    type="number"
                    required
                    value={newTaskEst}
                    onChange={(e) => setNewTaskEst(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Database, Refactor, QA"
                  value={newTaskTagString}
                  onChange={(e) => setNewTaskTagString(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this task and all its comments?')) {
                      handleDeleteTask(editingTask.id);
                      setIsEditTaskOpen(false);
                      setEditingTask(null);
                    }
                  }}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditTaskOpen(false);
                      setEditingTask(null);
                    }}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* INVITE MEMBER DIALOG */}
      {isInviteOpen && activeProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-sm w-full overflow-hidden animate-fadeIn text-left">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-850" />
                <span>Invite Project Member</span>
              </h3>
              <button 
                onClick={() => { setIsInviteOpen(false); setInviteSearch(''); }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Search User</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={inviteSearch}
                    onChange={(e) => setInviteSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
                {inviteSearch && (
                  <div className="mt-2 max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                    {employees
                      .filter(e => {
                        const query = inviteSearch.toLowerCase();
                        const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
                        const isAlreadyMember = activeProject.members?.some(m => m.userId === e.id);
                        return !isAlreadyMember && (fullName.includes(query) || e.email.toLowerCase().includes(query));
                      })
                      .slice(0, 10)
                      .map(emp => (
                        <button
                          key={emp.id}
                          onClick={() => handleInviteMember(emp)}
                          className="w-full text-left px-3 py-2.5 hover:bg-teal-50 transition flex items-center gap-3 cursor-pointer"
                        >
                          <div className="h-7 w-7 shrink-0 rounded-lg bg-teal-50 text-teal-800 font-extrabold flex items-center justify-center text-[10px]">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{emp.email}</p>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                            {emp.designation || 'Employee'}
                          </span>
                        </button>
                      ))}
                    {employees.filter(e => {
                      const query = inviteSearch.toLowerCase();
                      const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
                      const isAlreadyMember = activeProject.members?.some(m => m.userId === e.id);
                      return !isAlreadyMember && (fullName.includes(query) || e.email.toLowerCase().includes(query));
                    }).length === 0 && (
                      <div className="text-center py-4 text-slate-400 text-[10px] font-semibold">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="viewer">Viewer - Can view project only</option>
                  <option value="member">Member - Can view and comment</option>
                  <option value="admin">Admin - Full project access</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => { setIsInviteOpen(false); setInviteSearch(''); }}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
