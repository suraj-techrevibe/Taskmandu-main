import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../../services/http';

interface PagerProps {
  pagination: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

export default function Pager({ pagination, page, onPageChange, className = '' }: PagerProps) {
  const { totalPages, totalItems } = pagination;
  if (totalItems === 0) return null;
  if (totalPages <= 1) {
    return (
      <div className={`flex items-center justify-between px-4 py-3 border-t border-slate-100 text-[10px] font-bold text-slate-400 ${className}`}>
        <span>{totalItems} record{totalItems === 1 ? '' : 's'}</span>
      </div>
    );
  }

  const handlePrev = () => page > 1 && onPageChange(page - 1);
  const handleNext = () => page < totalPages && onPageChange(page + 1);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-[10px] font-bold text-slate-400 ${className}`}
    >
      <span>
        Page {page} of {totalPages} — {totalItems} record{totalItems === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrev}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pageWindow(page, totalPages).map((p, idx) =>
          p === '…' ? (
            <span key={`gap-${idx}`} className="px-1.5 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                p === page
                  ? 'bg-teal-800 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={handleNext}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}