import { Schema, model, type InferSchemaType } from 'mongoose';
import { ATTENDANCE_STATUSES, type AttendanceStatus } from '../../types';

const attendanceSchema = new Schema(
  {
    employeeId: { type: String, required: true },
    checkInTime: { type: Date, required: true },
    locationType: { type: String, enum: ['Onsite', 'WFH'], default: 'Onsite' },
    checkOutTime: { type: Date, default: null },
    date: { type: String, required: true, index: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: 'Present', index: true },
    workingHours: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

attendanceSchema.index({ employeeId: 1, date: 1, checkInTime: -1 }, { unique: false });

export type Attendance = InferSchemaType<typeof attendanceSchema> & {
  status: AttendanceStatus;
};

export const Attendance = model('Attendance', attendanceSchema);
