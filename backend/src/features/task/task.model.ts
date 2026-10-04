import { Schema, model, type InferSchemaType } from 'mongoose';
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from '../../types';

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

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    assignedToId: { type: [String], default: [] },
    assignedByName: { type: String, trim: true, default: '' },
    createdById: { type: String, default: null },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'Medium', index: true },
    dueDate: { type: String, required: true },
    estimatedHours: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: TASK_STATUSES, default: 'Assigned', index: true },
    attachments: { type: [attachmentSchema], default: [] },
    tags: { type: [String], default: [], index: true },
    comments: { type: [commentSchema], default: [] },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

export type Task = InferSchemaType<typeof taskSchema> & {
  priority: TaskPriority;
  status: TaskStatus;
};

export const Task = model('Task', taskSchema);
