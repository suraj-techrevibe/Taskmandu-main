import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Pin, 
  Trash2, 
  Folder, 
  Calendar, 
  User, 
  Check, 
  Edit3, 
  Tag, 
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Role } from '../../types';
import * as noteApi from '../../services/note';
import { listNotePage } from '../../services/note';
import { useServerList } from '../../hooks/useServerList';
import Pager from '../../components/list/Pager';
import type { NoteDoc } from '../../services/note';

type Note = NoteDoc;

interface NotesModuleProps {
  currentRole: Role;
  currentUserName?: string;
  currentUserId?: string;
}

const NOTE_COLORS = [
  { name: 'Teal', class: 'bg-teal-50 hover:bg-teal-100/70 border-teal-200 text-teal-900' },
  { name: 'Indigo', class: 'bg-indigo-50 hover:bg-indigo-100/70 border-indigo-200 text-indigo-900' },
  { name: 'Violet', class: 'bg-violet-50 hover:bg-violet-100/70 border-violet-200 text-violet-900' },
  { name: 'Amber', class: 'bg-amber-50 hover:bg-amber-100/70 border-amber-200 text-amber-900' },
  { name: 'Rose', class: 'bg-rose-50 hover:bg-rose-100/70 border-rose-200 text-rose-900' },
  { name: 'Sky', class: 'bg-sky-50 hover:bg-sky-100/70 border-sky-200 text-sky-900' }
];

const CATEGORIES = [
  'All',
  'Shift Handover',
  'Company Policies',
  'Personal Reminders',
  'Technical Docs'
];

export default function NotesModule({ currentRole, currentUserName, currentUserId }: NotesModuleProps) {
  const canManageNote = (note: Note) =>
    ['Super Admin', 'HR', 'Manager', 'Team Lead'].includes(currentRole) || note.authorId === currentUserId;
  // Server-driven note grid (search, category, pinned, pagination)
  const notesData = useServerList({
    fetcher: ({ page, limit, sortBy, sortOrder, filters }) =>
      listNotePage({
        page,
        limit,
        sortBy,
        sortOrder,
        search: filters.search || undefined,
        category: filters.category || undefined,
        pinned: filters.pinned || undefined,
      }),
    defaultLimit: 9,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

  const notes = notesData.items;

  // Note Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('Personal Reminders');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0].class);
  const [noteIsPinned, setNoteIsPinned] = useState(false);

  const handleOpenNewForm = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('Personal Reminders');
    setNoteColor(NOTE_COLORS[0].class);
    setNoteIsPinned(false);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteCategory(note.category);
    setNoteColor(note.color);
    setNoteIsPinned(note.isPinned);
    setIsFormOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const payload = {
      title: noteTitle,
      content: noteContent,
      category: noteCategory,
      color: noteColor,
      isPinned: noteIsPinned
    };

    if (editingNote) {
      noteApi.updateNote(editingNote.id, payload)
        .then(() => notesData.refresh())
        .catch(() => {});
    } else {
      noteApi.createNote(payload)
        .then(() => notesData.refresh())
        .catch(() => {});
    }
    setIsFormOpen(false);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      noteApi.deleteNote(id)
        .then(() => notesData.refresh())
        .catch(() => {});
    }
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = notes.find(n => n.id === id);
    if (!target) return;
    noteApi.updateNote(id, { isPinned: !target.isPinned })
      .then(() => notesData.refresh())
      .catch(() => {});
  };

  // Server already sorts pinned notes first, then by date desc.

  return (
    <div className="space-y-6 text-slate-800 animate-fadeIn">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => notesData.setFilter('category', cat === 'All' ? '' : cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                (cat === 'All' && !notesData.filters.category) || notesData.filters.category === cat
                  ? 'bg-teal-800 text-white shadow-md shadow-teal-900/10' 
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-100 hover:border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search bar & Add Button */}
        <div className="flex items-center gap-3 self-end md:self-auto w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes content..."
              value={notesData.filters.search ?? ''}
              onChange={(e) => notesData.setFilter('search', e.target.value)}
              className="w-full bg-white border border-slate-150 pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
            />
          </div>

          <button
            onClick={handleOpenNewForm}
            className="bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-teal-900/10 flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Note</span>
          </button>
        </div>

      </div>

      {/* Main Grid View of Notes */}
      {notesData.loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin opacity-60" />
          <p className="text-xs font-semibold">Loading notes…</p>
        </div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map(note => (
            <div
              key={note.id}
              onClick={canManageNote(note) ? () => handleOpenEditForm(note) : undefined}
              className={`border rounded-2xl p-5 shadow-xs transition flex flex-col justify-between group ${note.color} ${canManageNote(note) ? 'cursor-pointer' : ''}`}
            >
              <div className="space-y-3">
                {/* Note Header (Category & Pins) */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/70 backdrop-blur-xs px-2.5 py-1 rounded-md border border-black/5">
                    {note.category}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {canManageNote(note) && (
                      <>
                        <button
                          onClick={(e) => handleTogglePin(note.id, e)}
                          className={`p-1.5 rounded-lg hover:bg-white/80 transition ${
                            note.isPinned ? 'text-teal-700' : 'text-slate-400 opacity-30 group-hover:opacity-100'
                          }`}
                          title={note.isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-teal-700' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white/80 opacity-30 group-hover:opacity-100 transition"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Title & Body */}
                <div className="text-left space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-950 transition leading-snug">
                    {note.title}
                  </h4>
                  <p className="text-xs text-slate-700/90 font-medium leading-relaxed line-clamp-4 whitespace-pre-line">
                    {note.content}
                  </p>
                </div>
              </div>

              {/* Note Footer (Author & Date) */}
              <div className="border-t border-black/5 mt-4 pt-3 flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>By: {note.author}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </span>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">No notes found</h3>
          <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
            Create your first workplace note to document shift processes, logs, policies, or technical tasks.
          </p>
          <button
            onClick={handleOpenNewForm}
            className="mt-5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create a note</span>
          </button>
        </div>
      )}

      <Pager pagination={notesData.pagination} page={notesData.page} onPageChange={notesData.setPage} />

      {/* Slide-over or Modal Overlay for Creating/Editing Note */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-md w-full overflow-hidden animate-fadeIn text-left">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-800" />
                <span>{editingNote ? 'Edit Workplace Note' : 'Create Workplace Note'}</span>
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNote} className="p-5 space-y-4">
              
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Migration Steps"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              {/* Category & Pin */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Category</label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pin to Top</label>
                  <button
                    type="button"
                    onClick={() => setNoteIsPinned(!noteIsPinned)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      noteIsPinned 
                        ? 'bg-teal-50 border-teal-200 text-teal-800' 
                        : 'bg-slate-50 border-slate-150 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${noteIsPinned ? 'fill-teal-750' : ''}`} />
                    <span>{noteIsPinned ? 'Pinned' : 'Unpinned'}</span>
                  </button>
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Note Accent Color</label>
                <div className="flex items-center gap-2">
                  {NOTE_COLORS.map(color => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNoteColor(color.class)}
                      className={`h-7 w-7 rounded-full border transition flex items-center justify-center cursor-pointer ${
                        color.class.split(' ')[0]
                      } ${noteColor === color.class ? 'ring-2 ring-teal-700 border-white' : 'border-slate-200'}`}
                      title={color.name}
                    >
                      {noteColor === color.class && <Check className="w-3.5 h-3.5 text-slate-800 font-bold" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content text */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Content Body</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Type the details of your note..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Save Note
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
