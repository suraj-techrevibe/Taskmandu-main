import { Schema, model, type InferSchemaType } from 'mongoose';

const roleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    description: { type: String, default: '', maxlength: 200 },
    permissions: { type: [String], default: [], index: true },
    isSystem: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type RoleDoc = InferSchemaType<typeof roleSchema>;

export const Role = model('Role', roleSchema);
