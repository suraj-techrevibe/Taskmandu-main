import React, { useState } from 'react';
import type { SystemNotification } from '../../types';
import NotificationCenter from '../../features/notification/NotificationCenter';
import { Bell, Menu, MessageSquare, Share2, UserRoundPlus } from 'lucide-react';

interface TopbarProps {
  title: string;
  onToggleSidebar: () => void;
  notifications: SystemNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNavigateChat: () => void;
  canInvite: boolean;
  onInvite: () => void;
  onToast: (message: string, duration?: number) => void;
}

export default function Topbar({
  title,
  onToggleSidebar,
  notifications,
  onMarkAllRead,
  onClearAll,
  onNavigateChat,
  canInvite,
  onInvite,
  onToast,
}: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      onToast('Workspace link copied to clipboard!', 3000);
    } catch {
      onToast('Link copied: ' + window.location.host, 3000);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-none lg:rounded-2xl px-5 lg:px-6 py-4 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</span>
        <span className="text-[9px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md uppercase">
          Active
        </span>
      </div>

      {/* Overlapping team avatars and interaction buttons */}
      <div className="flex items-center gap-4">
        {/* Teammate avatar circles */}
        <div className="hidden md:flex items-center">
          {canInvite && (
            <button
              onClick={onInvite}
              className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-teal-800 hover:bg-teal-50 hover:text-teal-900 transition cursor-pointer"
              title="Invite Team Member"
            >
              <UserRoundPlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onNavigateChat();
              onToast('Opened Group Chat workspace');
            }}
            className="hidden md:flex p-2 text-slate-400 hover:text-teal-800 hover:bg-teal-50 hover:border-teal-150 rounded-xl border border-slate-100 transition cursor-pointer"
            title="Workspace Group Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Notification icon & panel popup */}
          <div className="relative">
            <button
              id="not-toggle-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-100 transition cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <NotificationCenter
                notifications={notifications}
                onMarkAllRead={onMarkAllRead}
                onClearAll={onClearAll}
              />
            )}
          </div>

          {/* Share Button with clipboard capability */}
          <button
            onClick={handleShare}
            className="hidden md:flex px-3.5 py-2 text-xs font-black text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Copy Application Link"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}