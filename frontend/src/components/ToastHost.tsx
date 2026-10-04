import { useSyncExternalStore } from 'react';
import { CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { dismissToast, getToasts, subscribeToast } from '../services/toast';

const STYLES = {
  success: {
    container: 'bg-teal-600 border-teal-500',
    icon: <CheckCircle2 className="w-4 h-4 text-white shrink-0" />,
  },
  error: {
    container: 'bg-rose-600 border-rose-500',
    icon: <XCircle className="w-4 h-4 text-white shrink-0" />,
  },
  info: {
    container: 'bg-slate-800 border-slate-700',
    icon: <Info className="w-4 h-4 text-sky-300 shrink-0" />,
  },
} as const;

export default function ToastHost() {
  const toasts = useSyncExternalStore(subscribeToast, getToasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => {
        const style = STYLES[t.type];
        return (
          <div
            key={t.id}
            className={`${style.container} text-white rounded-xl shadow-xl border px-4 py-3 flex items-start gap-2.5 animate-fadeIn`}
          >
            {style.icon}
            <p className="text-xs font-bold leading-relaxed flex-1 break-words">{t.message}</p>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 text-white/70 hover:text-white transition cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
