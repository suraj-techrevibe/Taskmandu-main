import { Schema, model, type InferSchemaType } from 'mongoose';
import { CLEARANCE_STATUSES, REHIRE_ELIGIBILITIES, type ClearanceStatus, type RehireEligibility } from '../../types';

const clearanceStatusSchema = new Schema(
  {
    hr: { type: String, enum: CLEARANCE_STATUSES, default: 'Pending' },
    finance: { type: String, enum: CLEARANCE_STATUSES, default: 'Pending' },
    it: { type: String, enum: CLEARANCE_STATUSES, default: 'Pending' },
    operations: { type: String, enum: CLEARANCE_STATUSES, default: 'Pending' },
  },
  { _id: false },
);

const assetsReturnedSchema = new Schema(
  {
    laptop: { type: Boolean, default: false },
    monitor: { type: Boolean, default: false },
    accessCard: { type: Boolean, default: false },
    simCard: { type: Boolean, default: false },
  },
  { _id: false },
);

const exitInterviewSchema = new Schema(
  {
    companyFeedback: { type: String, default: '' },
    suggestions: { type: String, default: '' },
    rehireEligibility: { type: String, enum: REHIRE_ELIGIBILITIES, default: 'Yes' },
  },
  { _id: false },
);

const offboardingSchema = new Schema(
  {
    employeeId: { type: String, required: true },
    lastWorkingDay: { type: String, required: true },
    reason: { type: String, trim: true, default: '' },
    noticePeriod: { type: Number, required: true, min: 0 },
    feedback: { type: String, trim: true, default: '' },
    clearanceStatus: { type: clearanceStatusSchema, default: () => ({}) },
    assetsReturned: { type: assetsReturnedSchema, default: () => ({}) },
    exitInterview: { type: exitInterviewSchema, default: () => ({}) },
    currentStep: { type: Number, default: 0, min: 0, max: 4 },
    isCompleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

offboardingSchema.index({ employeeId: 1 }, { unique: true });

export type Offboarding = InferSchemaType<typeof offboardingSchema> & {
  clearanceStatus: InferSchemaType<typeof clearanceStatusSchema> & {
    hr: ClearanceStatus;
    finance: ClearanceStatus;
    it: ClearanceStatus;
    operations: ClearanceStatus;
  };
  exitInterview: InferSchemaType<typeof exitInterviewSchema> & {
    rehireEligibility: RehireEligibility;
  };
};

export const Offboarding = model('Offboarding', offboardingSchema);
