import { Schema, model, type InferSchemaType } from 'mongoose';
import { SHIFT_TYPES, type ShiftType } from '../../types';

const rosterSchema = new Schema(
  {
    employeeIds: [{ type: String, required: true, index: true }],
    department: { type: String, required: true, trim: true, index: true },
    shiftType: { type: String, enum: SHIFT_TYPES, required: true },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/, default: '09:00' },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/, default: '18:00' },
    location: { type: String, trim: true, default: '' },
    date: { type: String, required: true, index: true },
    recurring: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

rosterSchema.index({ date: 1, department: 1 });

export type Roster = InferSchemaType<typeof rosterSchema> & {
  shiftType: ShiftType;
};

export const Roster = model('Roster', rosterSchema);
