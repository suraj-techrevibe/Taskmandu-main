import { Schema, model, type InferSchemaType } from 'mongoose';

const departmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: '', maxlength: 300 },
    headEmployeeId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type Department = InferSchemaType<typeof departmentSchema>;

export const Department = model('Department', departmentSchema);
