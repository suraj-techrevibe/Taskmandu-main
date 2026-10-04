import { Schema, model, type InferSchemaType } from 'mongoose';

export const INVITATION_STATUSES = ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Expired'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

const invitationSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    role: { type: String, required: true, trim: true },
    employeeId: { type: String, default: null, trim: true },
    tokenHash: { type: String, required: true, select: false },
    status: { type: String, enum: INVITATION_STATUSES, default: 'Pending', index: true },
    expiresAt: { type: Date, required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invitedByName: { type: String, required: true },
    acceptedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type Invitation = InferSchemaType<typeof invitationSchema>;

export const Invitation = model('Invitation', invitationSchema);
