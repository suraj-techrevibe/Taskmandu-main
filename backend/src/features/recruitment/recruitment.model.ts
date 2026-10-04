import { Schema, model, type InferSchemaType } from 'mongoose';
import {
  APPLICATION_STAGES,
  EMPLOYMENT_TYPES,
  INTERVIEW_STATUSES,
  INTERVIEW_TYPES,
  JOB_STATUSES,
  type ApplicationStage,
  type EmploymentType,
  type InterviewStatus,
  type InterviewType,
  type JobStatus,
} from '../../types';

const jobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100, index: true },
    department: { type: String, trim: true, maxlength: 100, default: '' },
    location: { type: String, trim: true, maxlength: 100, default: '' },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: 'Full-Time', index: true },
    openings: { type: Number, required: true, min: 1, max: 100 },
    salaryMin: { type: Number, min: 0, default: null },
    salaryMax: { type: Number, min: 0, default: null },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    requirements: { type: String, trim: true, maxlength: 5000, default: '' },
    status: { type: String, enum: JOB_STATUSES, default: 'Open', index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

jobSchema.index({ title: 'text', department: 'text', location: 'text' });

const jobApplicationSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', default: null, index: true },
    candidateName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    roleApplied: { type: String, required: true, trim: true, maxlength: 100, index: true },
    stage: { type: String, enum: APPLICATION_STAGES, default: 'Applied', index: true },
    experienceYears: { type: Number, required: true, min: 0, max: 60 },
    resumeUrl: { type: String, trim: true, maxlength: 1000, default: null },
    appliedDate: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 3 },
    source: { type: String, trim: true, maxlength: 100, default: '' },
    notes: { type: String, trim: true, maxlength: 5000, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

jobApplicationSchema.index({ candidateName: 'text', email: 'text', roleApplied: 'text' });

const upcomingInterviewSchema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', default: null, index: true },
    candidateName: { type: String, required: true, trim: true },
    roleApplied: { type: String, required: true, trim: true },
    interviewDate: { type: String, required: true, index: true },
    interviewTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    interviewType: { type: String, enum: INTERVIEW_TYPES, required: true },
    interviewers: { type: [String], default: [] },
    meetingLink: { type: String, trim: true, maxlength: 1000, default: null },
    status: { type: String, enum: INTERVIEW_STATUSES, default: 'Scheduled', index: true },
    notes: { type: String, trim: true, maxlength: 5000, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

upcomingInterviewSchema.index({ interviewDate: 1, interviewTime: 1 });

export type Job = InferSchemaType<typeof jobSchema> & {
  employmentType: EmploymentType;
  status: JobStatus;
};

export type JobApplication = InferSchemaType<typeof jobApplicationSchema> & {
  stage: ApplicationStage;
};

export type UpcomingInterview = InferSchemaType<typeof upcomingInterviewSchema> & {
  interviewType: InterviewType;
  status: InterviewStatus;
};

export const Job = model('Job', jobSchema);
export const JobApplication = model('JobApplication', jobApplicationSchema);
export const UpcomingInterview = model('UpcomingInterview', upcomingInterviewSchema);
