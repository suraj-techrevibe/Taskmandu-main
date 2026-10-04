import { Schema, model, type InferSchemaType } from 'mongoose';
import { NOTE_CATEGORIES, type NoteCategory } from '../../types';

const noteSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, trim: true, maxlength: 10000, default: '' },
    category: { type: String, enum: NOTE_CATEGORIES, default: 'Personal Reminders', index: true },
    color: { type: String, trim: true, maxlength: 200, default: '' },
    isPinned: { type: Boolean, default: false, index: true },
    author: { type: String, trim: true, maxlength: 100, default: '' },
    authorId: { type: String, default: null, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

noteSchema.index({ title: 'text', content: 'text' });

export type Note = InferSchemaType<typeof noteSchema> & {
  category: NoteCategory;
};

export const Note = model('Note', noteSchema);
