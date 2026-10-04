import { Schema, model, type InferSchemaType } from 'mongoose';
import {
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  GENDERS,
  type EmployeeStatus,
  type EmploymentType,
  type Gender,
} from '../../types';

const employeeSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    dob: { type: String, required: true },
    gender: { type: String, enum: GENDERS, required: true },
    address: { type: String, trim: true },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    employeeId: { type: String, required: true, unique: true, trim: true },
    department: { type: String, required: true, trim: true, index: true },
    designation: { type: String, required: true, trim: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, required: true },
    joiningDate: { type: String, required: true },
    reportingManagerId: { type: String, default: null },
    salary: { type: Number, required: true, min: 0 },
    status: { type: String, enum: EMPLOYEE_STATUSES, default: 'Active', index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

employeeSchema.index({ firstName: 'text', lastName: 'text', email: 'text', designation: 'text' });

export type Employee = InferSchemaType<typeof employeeSchema> & {
  gender: Gender;
  employmentType: EmploymentType;
  status: EmployeeStatus;
};

export const Employee = model('Employee', employeeSchema);
