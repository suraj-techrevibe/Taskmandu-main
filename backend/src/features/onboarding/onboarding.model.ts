import { Schema, model, type InferSchemaType } from 'mongoose';
import { EMPLOYMENT_TYPES, GENDERS, type EmploymentType, type Gender } from '../../types';

const personalDetailsSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dob: { type: String, required: true },
    gender: { type: String, enum: GENDERS, required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, trim: true, default: '' },
    emergencyContact: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const employmentInfoSchema = new Schema(
  {
    employeeId: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, required: true },
    joiningDate: { type: String, required: true },
    reportingManagerId: { type: String, default: null },
    salary: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const documentsSchema = new Schema(
  {
    citizenshipVerified: { type: Boolean, default: false },
    passportVerified: { type: Boolean, default: false },
    contractSigned: { type: Boolean, default: false },
    bankDetailsSubmitted: { type: Boolean, default: false },
  },
  { _id: false },
);

const assetsAllocatedSchema = new Schema(
  {
    laptop: { type: Boolean, default: false },
    idCard: { type: Boolean, default: false },
    simCard: { type: Boolean, default: false },
    accessCard: { type: Boolean, default: false },
  },
  { _id: false },
);

const checklistSchema = new Schema(
  {
    emailCreated: { type: Boolean, default: false },
    payrollAdded: { type: Boolean, default: false },
    systemAccessGranted: { type: Boolean, default: false },
    trainingCompleted: { type: Boolean, default: false },
  },
  { _id: false },
);

const onboardingSchema = new Schema(
  {
    personalDetails: { type: personalDetailsSchema, required: true },
    employmentInfo: { type: employmentInfoSchema, required: true },
    documents: { type: documentsSchema, default: () => ({}) },
    assetsAllocated: { type: assetsAllocatedSchema, default: () => ({}) },
    checklist: { type: checklistSchema, default: () => ({}) },
    currentStep: { type: Number, default: 0, min: 0, max: 4 },
    isCompleted: { type: Boolean, default: false },
    linkedEmployeeId: { type: String, default: null },
    activationStatus: {
      type: String,
      enum: ['Pending', 'Accepted', 'Expired'],
      default: 'Pending',
      index: true,
    },
    activationTokenHash: { type: String, select: false, default: null },
    activationTokenExpiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

onboardingSchema.index({ 'personalDetails.email': 1 });
onboardingSchema.index({ 'employmentInfo.employeeId': 1 });

export type Onboarding = InferSchemaType<typeof onboardingSchema> & {
  personalDetails: InferSchemaType<typeof personalDetailsSchema> & { gender: Gender };
  employmentInfo: InferSchemaType<typeof employmentInfoSchema> & { employmentType: EmploymentType };
};

export const Onboarding = model('Onboarding', onboardingSchema);
