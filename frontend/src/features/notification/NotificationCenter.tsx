import React from 'react';
import { SystemNotification } from '../../types';
import { Bell, Check, Clock, ShieldAlert, CheckCircle2, UserPlus } from 'lucide-react';

interface NotificationCenterProps {
  notifications: SystemNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export default function NotificationCenter({
  notifications,
  onMarkAllRead,
  onClearAll
}: NotificationCenterProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const iconMap = {
    attendance: <Clock className="w-4 h-4 text-emerald-600" />,
    shift: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
    task: <ShieldAlert className="w-4 h-4 text-amber-600" />,
    hr: <UserPlus className="w-4 h-4 text-purple-600" />
  };

  const bgMap = {
    attendance: 'bg-emerald-50 border-emerald-100',
    shift: 'bg-blue-50 border-blue-100',
    task: 'bg-amber-50 border-amber-100',
    hr: 'bg-purple-50 border-purple-100'
  };

  return (
    <div className="bg-white border border-gray-150 rounded-2xl shadow-lg p-4 w-80 space-y-4 max-h-[450px] overflow-y-auto animate-fadeIn absolute right-0 mt-2 z-50">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-xs text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onMarkAllRead}
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
          >
            Mark Read
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={onClearAll}
            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <p className="text-[11px] text-gray-400 text-center py-6">No notifications on file.</p>
        ) : (
          notifications.map((not) => (
            <div
              key={not.id}
              className={`p-3 rounded-xl border text-left transition flex gap-2.5 items-start ${
                not.read ? 'bg-white border-gray-100 opacity-60' : bgMap[not.type as keyof typeof bgMap]
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {iconMap[not.type as keyof typeof iconMap] || <Check className="w-4 h-4 text-gray-400" />}
              </div>
              
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="font-bold text-[11px] text-gray-900 truncate">{not.title}</p>
                <p className="text-[10px] text-gray-600 leading-normal">{not.message}</p>
                <p className="text-[8px] text-gray-400 font-medium">
                  {new Date(not.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
