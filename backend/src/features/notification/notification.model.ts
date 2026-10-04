import { Schema, model, type InferSchemaType } from 'mongoose';
import { NOTIFICATION_TYPES, type NotificationType } from '../../types';

const notificationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true, index: true },
    recipientId: { type: String, default: null, index: true },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

notificationSchema.index({ read: 1, createdAt: -1 });

export type SystemNotification = InferSchemaType<typeof notificationSchema> & {
  type: NotificationType;
};

export const Notification = model('SystemNotification', notificationSchema);
