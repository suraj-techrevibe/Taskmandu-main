import { Schema, model, type InferSchemaType } from 'mongoose';
import { LEAVE_STATUSES, LEAVE_TYPES, type LeaveStatus, type LeaveType } from '../../types';

const leaveSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, trim: true, default: '' },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    leaveType: { type: String, enum: LEAVE_TYPES, required: true },
    reason: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: LEAVE_STATUSES, default: 'Pending', index: true },
    actionedAt: { type: Date, default: null },
    actionedById: { type: String, default: null },
    managerNotes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

leaveSchema.index({ status: 1, createdAt: -1 });

export type Leave = InferSchemaType<typeof leaveSchema> & {
  leaveType: LeaveType;
  status: LeaveStatus;
};

export const Leave = model('Leave', leaveSchema);
