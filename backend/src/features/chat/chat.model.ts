import { Schema, model, type InferSchemaType } from 'mongoose';
import { CHAT_GROUP_CATEGORIES, type ChatGroupCategory } from '../../types';

const chatGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    category: { type: String, enum: CHAT_GROUP_CATEGORIES, default: 'General', index: true },
    memberIds: { type: [String], default: [] },
    createdBy: { type: String, trim: true, default: '' },
    createdById: { type: String, default: null },
    isLocked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const chatMessageSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'ChatGroup', required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true, trim: true },
    senderRole: { type: String, trim: true, default: '' },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
    isNotice: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

chatMessageSchema.index({ groupId: 1, createdAt: -1 });

export type ChatGroup = InferSchemaType<typeof chatGroupSchema> & {
  category: ChatGroupCategory;
};

export type ChatMessage = InferSchemaType<typeof chatMessageSchema>;

export const ChatGroup = model('ChatGroup', chatGroupSchema);
export const ChatMessage = model('ChatMessage', chatMessageSchema);
