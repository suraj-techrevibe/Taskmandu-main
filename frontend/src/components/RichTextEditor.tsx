import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Palette,
  Paintbrush,
  Type,
  Eraser,
  FileText,
  Info,
  ChevronDown
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONT_COLORS = [
  { name: 'Dark Charcoal', value: '#1e293b' },
  { name: 'Teal Blue', value: '#0f766e' },
  { name: 'Ocean Indigo', value: '#4338ca' },
  { name: 'Rose Red', value: '#be123c' },
  { name: 'Emerald Green', value: '#047857' },
  { name: 'Amber Gold', value: '#b45309' },
  { name: 'Classic Grey', value: '#64748b' }
];

const BG_COLORS = [
  { name: 'No Highlight', value: 'transparent' },
  { name: 'Soft Yellow', value: '#fef08a' },
  { name: 'Soft Green', value: '#bbf7d0' },
  { name: 'Soft Blue', value: '#bfdbfe' },
  { name: 'Soft Red', value: '#fecaca' },
  { name: 'Soft Teal', value: '#99f6e4' }
];

const FONT_SIZES = [
  { label: 'Small', value: '2' },
  { label: 'Regular', value: '3' },
  { label: 'Medium', value: '4' },
  { label: 'Large', value: '5' },
  { label: 'Extra Large', value: '6' },
  { label: 'Heading 1', value: '7' }
];

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([value || '']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showFontColor, setShowFontColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [activeSize, setActiveSize] = useState('Regular');
  
  // Document statistics
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Focus tracking
  const [isFocused, setIsFocused] = useState(false);

  // Sync initial content or incoming edits safely
  useEffect(() => {
    if (editorRef.current) {
      const currentHTML = editorRef.current.innerHTML;
      if (value !== currentHTML) {
        editorRef.current.innerHTML = value || '';
        updateStats();
      }
    }
  }, [value]);

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const cleanText = text.trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  };

  // Push new state onto the history stack (debounced or on command)
  const pushToHistory = (newHTML: string) => {
    const trimmedNew = newHTML.trim();
    const currentHist = history[historyIndex] || '';
    if (trimmedNew === currentHist.trim()) return;

    const updatedHistory = history.slice(0, historyIndex + 1);
    const finalHistory = [...updatedHistory, trimmedNew];
    
    // Cap history length at 50 states to prevent memory issues
    if (finalHistory.length > 50) {
      finalHistory.shift();
      setHistory(finalHistory);
      setHistoryIndex(finalHistory.length - 1);
    } else {
      setHistory(finalHistory);
      setHistoryIndex(finalHistory.length - 1);
    }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html);
    updateStats();
    
    // Auto-debounce history logging after 600ms of non-typing
    const timer = setTimeout(() => {
      pushToHistory(html);
    }, 600);

    return () => clearTimeout(timer);
  };

  const handleCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      pushToHistory(html);
      updateStats();
    }
  };

  // Undo and Redo methods
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevContent = history[prevIndex];
      if (editorRef.current) {
        editorRef.current.innerHTML = prevContent;
        onChange(prevContent);
        updateStats();
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextContent = history[nextIndex];
      if (editorRef.current) {
        editorRef.current.innerHTML = nextContent;
        onChange(nextContent);
        updateStats();
      }
    }
  };

  return (
    <div className="w-full bg-slate-100/75 border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col font-sans shadow-sm">
      
      {/* WORD PROCESSOR MENU BAR (Vibe / Authenticity) */}
      <div className="bg-white/80 border-b border-slate-150/60 px-4 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-teal-850 shrink-0" />
            <span>Interactive Wordpad Canvas</span>
          </span>
          <div className="h-3 w-[1px] bg-slate-200"></div>
          <span className="hover:text-slate-800 transition cursor-pointer">File</span>
          <span className="hover:text-slate-800 transition cursor-pointer">Edit</span>
          <span className="hover:text-slate-800 transition cursor-pointer">Insert</span>
          <span className="hover:text-slate-800 transition cursor-pointer">Format</span>
          <span className="hover:text-slate-800 transition cursor-pointer">Tools</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Info className="w-3 h-3 text-teal-800" />
          <span className="font-bold text-[9px] uppercase tracking-wider">Auto-Saves to Workspace</span>
        </div>
      </div>

      {/* WYSIWYG TOOLBAR */}
      <div className="bg-white border-b border-slate-200 p-2 flex flex-wrap items-center gap-1 gap-y-1.5 shadow-2xs select-none">
        
        {/* UNDO / REDO */}
        <div className="flex items-center bg-slate-50 border border-slate-150 rounded-lg p-0.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              historyIndex === 0 
                ? 'text-slate-300 pointer-events-none' 
                : 'text-slate-600 hover:bg-white hover:text-slate-900 shadow-3xs'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              historyIndex >= history.length - 1 
                ? 'text-slate-300 pointer-events-none' 
                : 'text-slate-600 hover:bg-white hover:text-slate-900 shadow-3xs'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

        {/* BASIC TEXT FORMATTING */}
        <div className="flex items-center bg-slate-50 border border-slate-150 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => handleCommand('bold')}
            className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer shadow-3xs"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleCommand('italic')}
            className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer shadow-3xs"
            title="Italics"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleCommand('underline')}
            className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer shadow-3xs"
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleCommand('strikeThrough')}
            className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer shadow-3xs"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

        {/* ALIGNMENTS */}
        <div className="flex items-center bg-slate-50 border border-slate-150 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => handleCommand('justifyLeft')}
            className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer shadow-3xs"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleCommand('justifyCenter')}
            className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer shadow-3xs"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleCommand('justifyRight')}
            className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer shadow-3xs"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleCommand('justifyFull')}
            className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer shadow-3xs"
            title="Justify"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

        {/* LISTS */}
        <div className="flex items-center bg-slate-50 border border-slate-150 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => handleCommand('insertUnorderedList')}
            className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer shadow-3xs"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleCommand('insertOrderedList')}
            className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer shadow-3xs"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

        {/* FONT SIZE SELECTOR */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowFontSize(!showFontSize);
              setShowFontColor(false);
              setShowBgColor(false);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-150 text-slate-700 hover:bg-slate-100 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition shadow-3xs"
            title="Font Size"
          >
            <Type className="w-3.5 h-3.5 text-slate-500" />
            <span>Size: {activeSize}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showFontSize && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 min-w-32 animate-fadeIn text-left">
              {FONT_SIZES.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => {
                    handleCommand('fontSize', f.value);
                    setActiveSize(f.label);
                    setShowFontSize(false);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 text-[10px] font-semibold text-slate-700 flex items-center justify-between text-left cursor-pointer"
                >
                  <span>{f.label}</span>
                  <span className="text-[9px] text-slate-400">Grade {f.value}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FONT COLOR SELECTOR */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowFontColor(!showFontColor);
              setShowBgColor(false);
              setShowFontSize(false);
            }}
            className="p-1.5 bg-slate-50 border border-slate-150 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer transition shadow-3xs"
            title="Font Color"
          >
            <Palette className="w-3.5 h-3.5 text-teal-800" />
          </button>

          {showFontColor && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 z-40 grid grid-cols-4 gap-2 animate-fadeIn">
              {FONT_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    handleCommand('foreColor', c.value);
                    setShowFontColor(false);
                  }}
                  style={{ backgroundColor: c.value }}
                  className="h-5 w-5 rounded-full ring-1 ring-slate-200 hover:scale-110 hover:ring-slate-400 transition cursor-pointer"
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* TEXT HIGHLIGHT (BG COLOR) SELECTOR */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowBgColor(!showBgColor);
              setShowFontColor(false);
              setShowFontSize(false);
            }}
            className="p-1.5 bg-slate-50 border border-slate-150 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer transition shadow-3xs"
            title="Text Highlight"
          >
            <Paintbrush className="w-3.5 h-3.5 text-amber-600" />
          </button>

          {showBgColor && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 z-40 grid grid-cols-3 gap-2 animate-fadeIn">
              {BG_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    handleCommand('hiliteColor', c.value);
                    setShowBgColor(false);
                  }}
                  style={{ backgroundColor: c.value }}
                  className="h-6 px-1.5 rounded border border-slate-150 text-[9px] font-bold text-slate-700 flex items-center justify-center hover:scale-105 transition cursor-pointer"
                  title={c.name}
                >
                  {c.value === 'transparent' ? 'None' : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CLEAR FORMATTING */}
        <button
          type="button"
          onClick={() => handleCommand('removeFormat')}
          className="p-1.5 bg-slate-50 border border-slate-150 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer transition shadow-3xs"
          title="Clear all formatting"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>

      </div>

      {/* PAPER CANVAS PAGE SCROLLPORT */}
      <div className="p-6 bg-slate-100 overflow-y-auto max-h-[460px] flex justify-center items-start border-b border-slate-200">
        
        {/* WORD PROCESSOR 'SHEET OF PAPER' LAYOUT */}
        <div 
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 w-full max-w-2xl"
        >
          <div 
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`w-full min-h-[340px] bg-white p-8 sm:p-12 border rounded-md shadow-md outline-none text-xs text-slate-800 leading-relaxed text-left transition-all ${
              isFocused ? 'border-teal-800 ring-2 ring-teal-500/15 shadow-lg' : 'border-slate-200/60'
            }`}
            style={{
              fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif'
            }}
          />
        </div>

      </div>

      {/* INTERACTIVE DOCUMENT STATUS & METRICS FOOTER */}
      <div className="bg-white px-4 py-2.5 flex items-center justify-between border-t border-slate-150 text-[10px] font-bold text-slate-500 select-none">
        
        {/* Metric Counts */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-600">
            <span>Words:</span>
            <span className="text-teal-850">{wordCount}</span>
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <span>Characters:</span>
            <span className="text-teal-850">{charCount}</span>
          </span>
        </div>

        {/* Zoom adjustment panel */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(80, prev - 10))}
              className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
            >
              -
            </button>
            <span className="text-[9px] text-slate-700 min-w-10 text-center">{zoomLevel}% View</span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(120, prev + 10))}
              className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
