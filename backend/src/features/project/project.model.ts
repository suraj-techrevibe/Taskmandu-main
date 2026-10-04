import { Schema, model, type InferSchemaType } from 'mongoose';
import {
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  VARIABLE_TYPES,
  type ProjectStatus,
  type TaskPriority,
  type TaskStatus,
  type VariableType,
} from '../../types';

const documentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    size: { type: String, trim: true, default: '' },
    uploadedBy: { type: String, trim: true, default: '' },
    uploadedAt: { type: Date, default: null },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    filePath: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: '' },
  },
  { _id: true },
);

const sharedVariableSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 200 },
    value: { type: String, trim: true, maxlength: 5000, default: '' },
    isSecret: { type: Boolean, default: false },
    type: { type: String, enum: VARIABLE_TYPES, default: 'Environment' },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    updatedBy: { type: String, trim: true, default: '' },
    updatedAt: { type: Date, default: null },
  },
  { _id: true },
);

const attachmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    size: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const commentSchema = new Schema(
  {
    authorId: { type: String, required: true },
    authorName: { type: String, required: true, trim: true },
    authorRole: { type: String, trim: true, default: '' },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const subTaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    assignedToId: { type: [String], default: [] },
    assignedByName: { type: String, trim: true, default: '' },
    status: { type: String, enum: TASK_STATUSES, default: 'Assigned' },
    completedAt: { type: Date, default: null },
    comments: { type: [commentSchema], default: [] },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } },
);

const projectTaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    assignedToId: { type: [String], default: [] },
    assignedByName: { type: String, trim: true, default: '' },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'Medium' },
    dueDate: { type: String, required: true },
    estimatedHours: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: TASK_STATUSES, default: 'Assigned' },
    attachments: { type: [attachmentSchema], default: [] },
    tags: { type: [String], default: [] },
    comments: { type: [commentSchema], default: [] },
    subTasks: { type: [subTaskSchema], default: [] },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } },
);

const projectMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    status: { type: String, enum: PROJECT_STATUSES, default: 'Planning', index: true },
    manager: { type: String, trim: true, maxlength: 100, default: '' },
    startDate: { type: String, trim: true, default: '' },
    endDate: { type: String, trim: true, default: '' },
    color: { type: String, trim: true, maxlength: 200, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    documents: { type: [documentSchema], default: [] },
    sharedVariables: { type: [sharedVariableSchema], default: [] },
    tasks: { type: [projectTaskSchema], default: [] },
    members: { type: [projectMemberSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

projectSchema.index({ name: 'text', description: 'text' });

// Members only persist their `userId`; materialize name/email from the linked
// User account on read so clients keep receiving a stable member shape.
projectSchema.post(['find', 'findOne', 'findOneAndUpdate'], async function (res: any) {
  if (!res) return;
  const docs = Array.isArray(res) ? res : [res];
  const withMembers = docs.filter((d: any) => Array.isArray(d?.members) && d.members.length);
  if (!withMembers.length) return;
  const Model = this.model;
  await Model.populate(withMembers, { path: 'members.userId', select: 'name email' });
  for (const d of withMembers) {
    d.members = d.members.map((m: any) => ({
      _id: m._id,
      userId: m.userId?._id?.toString() ?? m.userId?.toString() ?? '',
      name: m.userId?.name ?? '',
      email: m.userId?.email ?? '',
      role: m.role ?? 'member',
      joinedAt: m.joinedAt ?? null,
    }));
  }
});

export type Project = InferSchemaType<typeof projectSchema> & {
  status: ProjectStatus;
};

export type ProjectTask = InferSchemaType<typeof projectTaskSchema> & {
  priority: TaskPriority;
  status: TaskStatus;
};

export type ProjectVariable = InferSchemaType<typeof sharedVariableSchema> & {
  type: VariableType;
};

export const Project = model('Project', projectSchema);
