import { Schema, model, type HydratedDocument, type Types } from 'mongoose';
import {
  APPLICATION_STEP,
  APPLICATION_STEP_VALUES,
  BRE_STATUS,
  BRE_STATUS_VALUES,
  EMPLOYMENT_MODE_VALUES,
  type ApplicationStep,
  type BreStatus,
  type EmploymentMode,
} from '../utils/constants';

export interface ISalarySlip {
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface IApplication {
  userId: Types.ObjectId;
  fullName?: string;
  pan?: string;
  dob?: Date;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  breStatus: BreStatus;
  breFailures: string[];
  salarySlip?: ISalarySlip;
  step: ApplicationStep;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationDocument = HydratedDocument<IApplication>;

const salarySlipSchema = new Schema<ISalarySlip>(
  {
    path: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, required: true, default: () => new Date() },
  },
  {
    _id: false,
    // The absolute path on disk is internal — never serialise it to a client.
    toJSON: { transform: (_doc, ret: Record<string, unknown>) => { delete ret.path; return ret; } },
  },
);

const applicationSchema = new Schema<IApplication>(
  {
    // One application per borrower — the multi-step form edits this single document.
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    fullName: { type: String, trim: true },
    pan: { type: String, uppercase: true, trim: true },
    dob: { type: Date },
    monthlySalary: { type: Number, min: 0 },
    employmentMode: { type: String, enum: EMPLOYMENT_MODE_VALUES },
    breStatus: { type: String, enum: BRE_STATUS_VALUES, required: true, default: BRE_STATUS.PENDING, index: true },
    breFailures: { type: [String], default: [] },
    salarySlip: { type: salarySlipSchema },
    step: { type: String, enum: APPLICATION_STEP_VALUES, required: true, default: APPLICATION_STEP.REGISTERED, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_d, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Application = model<IApplication>('Application', applicationSchema);
