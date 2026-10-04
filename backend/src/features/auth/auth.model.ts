import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, required: true, trim: true, index: true },
    phone: { type: String, default: null, trim: true, maxlength: 30 },
    employeeId: { type: String, default: null },
    avatar: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    lastLoginAt: { type: Date, default: null },
    refreshToken: { type: String, select: false, default: null },
    passwordChangedAt: { type: Date, default: null },
    passwordResetToken: { type: String, select: false, default: null },
    passwordResetExpires: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.refreshToken;
        return ret;
      },
    },
  },
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = new Date();
  }
  next();
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export type User = InferSchemaType<typeof userSchema>;

export type UserDocument = HydratedDocument<User>;

export const User = model('User', userSchema);
