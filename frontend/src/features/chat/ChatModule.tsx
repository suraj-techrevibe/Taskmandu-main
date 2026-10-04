import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  UserPlus, 
  Users, 
  Check, 
  Lock, 
  Clock, 
  X,
  AlertCircle,
  Zap,
  ArrowLeft,
  Wifi,
  WifiOff,
  Pencil,
  Trash2
} from 'lucide-react';
import { Employee, Role } from '../../types';
import * as chatApi from '../../services/chat';
import { mapChatMessage } from '../../services/chat';
import { createChatSocket } from '../../services/chatSocket';
import type { ChatGroupDoc, ChatMessageDoc } from '../../services/chat';

type ChatGroup = ChatGroupDoc;
type ChatMessage = ChatMessageDoc;

const UNREAD_STORAGE_KEY = 'taskmandu_chat_unread_v1';

interface ChatModuleProps {
  employees: Employee[];
  currentRole: Role;
  currentUserId: string; // e.g. 'emp-101' for Alex Rivera, 'admin' for Super Admin
  currentUserName: string;
}

export default function ChatModule({ employees, currentRole, currentUserId, currentUserName }: ChatModuleProps) {
  // Persistence States
  const [groups, setGroups] = useState<ChatGroup[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [activeGroupId, setActiveGroupId] = useState<string>('');

  const [newMessageText, setNewMessageText] = useState('');
  
  // Modals & Panels states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  
  // Create Group Form States
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<ChatGroup['category']>('General');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
  const [newGroupLocked, setNewGroupLocked] = useState(false);

  // Invite Form States
  const [inviteEmployeeIds, setInviteEmployeeIds] = useState<string[]>([]);

  // Realtime presence + unread tracking
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const unreadStorageKey = `${UNREAD_STORAGE_KEY}:${currentUserId}`;
  const [unread, setUnread] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(unreadStorageKey) ?? '{}') as Record<string, number>;
    } catch {
      return {};
    }
  });

  const messageEndRef = useRef<HTMLDivElement>(null);
  const activeGroupRef = useRef(activeGroupId);
  activeGroupRef.current = activeGroupId;

  // Load real group + message data from the backend when reachable
  useEffect(() => {
    chatApi.listGroups()
      .then(async (remoteGroups) => {
        if (remoteGroups.length === 0) return;
        const msgsByGroup = await Promise.all(remoteGroups.map(g => chatApi.listMessages(g.id).catch(() => [])));
        const all = msgsByGroup.flat();
        const deduped = Array.from(new Map(all.map(m => [m.id, m])).values());
        setMessages(deduped);
        setGroups(remoteGroups);
        setActiveGroupId(prev => prev || remoteGroups[0].id);
      })
      .catch(() => {});
  }, []);

  // Persist unread counts locally
  useEffect(() => {
    localStorage.setItem(unreadStorageKey, JSON.stringify(unread));
  }, [unread, unreadStorageKey]);

  // Merge a (real) message into the list, replacing any matching optimistic temp
  const addMessage = useCallback((msg: ChatMessage, groupId?: string) => {
    const targetGroupId = groupId ?? msg.groupId;
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      const cleaned = prev.filter(m => !(
        m.id.startsWith('temp-') &&
        m.groupId === targetGroupId &&
        m.senderId === msg.senderId &&
        m.text === msg.text
      ));
      return [...cleaned, msg];
    });
  }, []);

  // Realtime event handler for `message:new`
  const handleRealtimeMessage = useCallback((msg: ChatMessage, groupId: string) => {
    const targetGroupId = groupId || msg.groupId;
    addMessage(msg, targetGroupId);
    if (msg.senderId !== currentUserId && targetGroupId !== activeGroupRef.current) {
      setUnread(prev => ({ ...prev, [targetGroupId]: (prev[targetGroupId] ?? 0) + 1 }));
    }
  }, [addMessage, currentUserId]);

  // Live socket connection for realtime chat updates
  useEffect(() => {
    if (!currentUserId) return;
    const socket = createChatSocket(
      (evt) => {
        if (evt.event === 'message:new' && evt.data) {
          const data = evt.data as { groupId: string; message: Record<string, any> };
          handleRealtimeMessage(mapChatMessage(data.message), data.groupId);
        } else if (evt.event === 'message:edited' && evt.data) {
          const data = evt.data as { groupId: string; message: Record<string, any> };
          const edited = mapChatMessage(data.message);
          setMessages(prev => prev.map(m => m.id === edited.id ? edited : m));
        } else if (evt.event === 'message:deleted' && evt.data) {
          const data = evt.data as { groupId: string; messageId: string };
          setMessages(prev => prev.filter(m => m.id !== data.messageId));
        }
      },
      (connected) => setIsSocketConnected(connected),
    );
    return () => socket.close();
  }, [currentUserId, handleRealtimeMessage]);

  // Scroll message pane to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messageEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeGroupId]);

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  const isAdminRole = currentRole === 'Super Admin' || currentRole === 'HR' || currentRole === 'Manager' || currentRole === 'Team Lead';

  // Check if current user is authorized to send message
  const canPostMessage = () => {
    if (!activeGroup) return false;
    if (activeGroup.isLocked) {
      return isAdminRole;
    }
    return true;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeGroup) return;

    const text = newMessageText.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const optimistic: ChatMessage = {
      id: tempId,
      groupId: activeGroup.id,
      senderName: currentUserName,
      senderRole: currentRole,
      senderId: currentUserId,
      text,
      createdAt: new Date().toISOString(),
      isNotice: activeGroup.category === 'Notice'
    };

    setMessages(prev => [...prev, optimistic]);
    setNewMessageText('');
    scrollToBottom();

    chatApi.sendMessage(activeGroup.id, text)
      .then(saved => addMessage(saved, activeGroup.id))
      .catch(() => {
        // Roll back the optimistic message if the send failed
        setMessages(prev => prev.filter(m => m.id !== tempId));
      });
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = () => {
    if (!editingMessageId || !editingText.trim()) return;
    const text = editingText.trim();
    chatApi.editMessage(editingMessageId, text).catch(() => {});
    handleCancelEdit();
  };

  const handleDeleteMessage = (msgId: string) => {
    if (!window.confirm('Delete this message?')) return;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    chatApi.deleteMessage(msgId).catch(() => {});
  };

  // EOD Template trigger
  const handleInsertEODTemplate = () => {
    const template = `EOD Update:
1. Done today: 
- 
2. Goals for tomorrow:
- 
3. Blockers: None.`;
    setNewMessageText(template);
  };

  // Create group handler
  const resetCreateForm = () => {
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupCategory('General');
    setNewGroupMembers([]);
    setNewGroupLocked(false);
  };

  const openCreateModal = () => {
    resetCreateForm();
    setIsCreateModalOpen(true);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    // Build the member list
    const members = newGroupMembers.length === 0 ? ['all'] : [...newGroupMembers, currentUserId];

    const newGroup: ChatGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName,
      description: newGroupDesc || 'Custom workspace discussion channel.',
      category: newGroupCategory,
      memberIds: members,
      createdBy: currentUserName,
      createdAt: new Date().toISOString(),
      isLocked: newGroupLocked
    };

    setGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
    
    // Clear forms
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupCategory('General');
    setNewGroupMembers([]);
    setNewGroupLocked(false);
    setIsCreateModalOpen(false);

    chatApi.createGroup({
      name: newGroup.name,
      description: newGroup.description,
      category: newGroup.category,
      memberIds: newGroup.memberIds,
      isLocked: newGroup.isLocked,
    })
      .then(created => {
        setGroups(prev => prev.map(g => g.id === newGroup.id ? created : g));
        setMessages(prev => prev.map(m => m.groupId === newGroup.id ? { ...m, groupId: created.id } : m));
        setActiveGroupId(created.id);
      })
      .catch(() => {});

    // Initial systems message inside group
    const sysMsg: ChatMessage = {
      id: `msg-sys-${Date.now()}`,
      groupId: newGroup.id,
      senderName: 'System Automation',
      senderRole: 'System',
      senderId: 'system',
      text: `Group chat "${newGroup.name}" created by ${currentUserName}. Description: ${newGroup.description}`,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, sysMsg]);
  };

  // Invite user handler
  const handleInviteMembers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || inviteEmployeeIds.length === 0) return;

    const currentMems = activeGroup.memberIds.includes('all') ? [] : activeGroup.memberIds;
    const updatedMems = Array.from(new Set([...currentMems, ...inviteEmployeeIds]));

    setGroups(prev => prev.map(g => {
      if (g.id === activeGroup.id) {
        return {
          ...g,
          memberIds: updatedMems
        };
      }
      return g;
    }));

    chatApi.updateGroup(activeGroup.id, { memberIds: updatedMems }).catch(() => {});

    // System log message
    const names = inviteEmployeeIds.map(id => {
      const emp = employees.find(e => e.id === id);
      return emp ? `${emp.firstName} ${emp.lastName}` : id;
    }).join(', ');

    const sysMsg: ChatMessage = {
      id: `msg-sys-${Date.now()}`,
      groupId: activeGroup.id,
      senderName: 'System Automation',
      senderRole: 'System',
      senderId: 'system',
      text: `${currentUserName} invited [ ${names} ] to join this channel.`,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, sysMsg]);
    setInviteEmployeeIds([]);
    setIsInviteModalOpen(false);
  };

  const handleToggleMemberSelection = (id: string) => {
    setNewGroupMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleToggleInviteSelection = (id: string) => {
    setInviteEmployeeIds(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  // Filter groups visible to the current user
  const visibleGroups = groups.filter(g => {
    if (g.memberIds.includes('all')) return true;
    return g.memberIds.includes(currentUserId);
  });

  // Latest message per group (used for conversation list previews + ordering)
  const lastMsgByGroup = useMemo(() => {
    const map: Record<string, ChatMessage> = {};
    for (const m of messages) {
      if (!map[m.groupId] || new Date(m.createdAt).getTime() > new Date(map[m.groupId].createdAt).getTime()) {
        map[m.groupId] = m;
      }
    }
    return map;
  }, [messages]);

  // Order conversations by most recent activity (like Messenger)
  const sortedVisibleGroups = useMemo(() => {
    return [...visibleGroups].sort((a, b) => {
      const ta = lastMsgByGroup[a.id]?.createdAt ?? a.createdAt ?? '';
      const tb = lastMsgByGroup[b.id]?.createdAt ?? b.createdAt ?? '';
      return new Date(tb).getTime() - new Date(ta).getTime();
    });
  }, [visibleGroups, lastMsgByGroup]);

  // Messages for current selected group, oldest first (recent at the bottom)
  const activeMessages = useMemo(() => {
    return messages
      .filter(m => m.groupId === activeGroupId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, activeGroupId]);

  // Keep the newest messages in view (recent at the bottom, like Messenger)
  useEffect(() => {
    scrollToBottom('smooth');
  }, [activeMessages.length]);

  const handleSelectGroup = (id: string) => {
    setActiveGroupId(id);
    setUnread(prev => (prev[id] ? { ...prev, [id]: 0 } : prev));
  };

  const formatRelativeTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getCategoryColor = (cat: ChatGroup['category']) => {
    switch (cat) {
      case 'Notice': return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'EOD': return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'Project': return 'bg-purple-50 text-purple-800 border-purple-200';
      default: return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xs h-[70vh] lg:h-[calc(100vh-10rem)] min-h-[540px] flex flex-col lg:flex-row overflow-hidden text-slate-800 animate-fadeIn">
      
      {/* LEFT COLUMN: Channels / Group chats list */}
      <div className={`${activeGroupId ? 'hidden lg:flex' : 'flex'} w-full lg:w-72 h-full border-r border-slate-100/90 bg-slate-50/50 flex-col shrink-0`}>
        
        {/* Header with Invite/Create Operations */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="font-black text-sm tracking-tight text-slate-900 uppercase">Group Channels</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Realtime connection status */}
            <span
              className={`hidden sm:flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-md border transition ${
                isSocketConnected
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                  : 'text-slate-400 bg-slate-100 border-slate-150'
              }`}
              title={isSocketConnected ? 'Live updates connected' : 'Reconnecting to live updates...'}
            >
              {isSocketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isSocketConnected ? 'Live' : 'Offline'}</span>
            </span>

            {/* Admin Create Chat Option */}
            {isAdminRole && (
              <button
                onClick={openCreateModal}
                className="p-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg transition shadow-xs flex items-center justify-center cursor-pointer"
                title="Create New Group Channel"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Channels Feed List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {sortedVisibleGroups.map(g => {
            const isSelected = activeGroupId === g.id;
            const lastMsg = lastMsgByGroup[g.id];
            const unreadCount = unread[g.id] ?? 0;
            
            return (
              <button
                key={g.id}
                onClick={() => handleSelectGroup(g.id)}
                className={`w-full text-left p-3 rounded-xl transition border cursor-pointer flex flex-col gap-1.5 ${
                  isSelected 
                    ? 'bg-white border-slate-200 shadow-xs ring-1 ring-slate-100' 
                    : 'bg-transparent border-transparent hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900 truncate">
                    <span className="text-slate-400">#</span>
                    <span className="truncate">{g.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getCategoryColor(g.category)}`}>
                      {g.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-500 font-semibold line-clamp-1 leading-relaxed">
                    {g.description}
                  </p>
                  {lastMsg && (
                    <span className="text-[9px] font-bold text-slate-400 shrink-0">
                      {formatRelativeTime(lastMsg.createdAt)}
                    </span>
                  )}
                </div>

                {lastMsg ? (
                  <div className="flex items-center gap-1.5 mt-0.5 border-t border-slate-100 pt-1.5">
                    <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1 min-w-0">
                      <span className="font-bold text-slate-600 shrink-0">
                        {lastMsg.senderId === currentUserId ? 'You' : lastMsg.senderName}:
                      </span>
                      <span className="truncate">{lastMsg.text}</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-teal-700 text-white text-[9px] font-black flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-300 font-medium truncate mt-0.5 border-t border-slate-100 pt-1.5">
                    No messages yet
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Active user identity display */}
        <div className="p-3 border-t border-slate-150 bg-white/80 backdrop-blur-xs flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-7 w-7 rounded-md bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center">
              {currentUserName[0]}
            </div>
            <div className="truncate">
              <p className="font-black text-[10px] text-slate-900 leading-tight truncate">{currentUserName}</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{currentRole}</p>
            </div>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
        </div>

      </div>

      {/* RIGHT COLUMN: Active Chat Panel */}
      <div className={`${activeGroupId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col h-full bg-white min-h-0`}>
        {activeGroup ? (
          <div className="flex-1 flex flex-col min-h-0 text-left">
            
            {/* 1. Header showing details & Invites */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setActiveGroupId('')}
                  className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
                  title="Back to channels"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xl text-slate-400 shrink-0">#</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-slate-950 truncate leading-tight">{activeGroup.name}</h3>
                    {activeGroup.isLocked && (
                      <span className="p-0.5 bg-rose-50 text-rose-600 rounded" title="Read Only for Employees">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold truncate leading-relaxed">
                    {activeGroup.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Manage / Invite members */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] font-black text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                  <Users className="w-3 h-3" />
                  <span>
                    {activeGroup.memberIds.includes('all') ? 'All Roster' : `${activeGroup.memberIds.length} Members`}
                  </span>
                </span>

                {/* Admins can Invite members directly */}
                {isAdminRole && !activeGroup.memberIds.includes('all') && (
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg transition cursor-pointer"
                    title="Invite Members to Group"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Messages list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20">
              {activeMessages.length > 0 ? (
                activeMessages.map(msg => {
                  const isSystem = msg.senderId === 'system';
                  const isMe = msg.senderId === currentUserId;
                  const initials = msg.senderName.split(' ').map(n => n[0]).join('');

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2 animate-fadeIn">
                        <div className="bg-slate-100 text-slate-500 text-[10px] px-3.5 py-1 rounded-full border border-slate-200/50 font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3 text-slate-400" />
                          <span>{msg.text}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 max-w-xl animate-fadeIn ${
                        isMe ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold ring-1 ${
                        isMe 
                          ? 'bg-[#0084FF] text-white ring-blue-500/20' 
                          : 'bg-indigo-50 text-indigo-800 ring-indigo-100'
                      }`}>
                        {initials}
                      </div>

                      <div className={`space-y-1 ${isMe ? 'flex flex-col items-end min-w-0' : ''}`}>
                        {/* Name & Role & time */}
                        <div className={`flex items-baseline gap-2 text-[10px] ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className={`font-black ${isMe ? 'text-blue-900' : 'text-slate-900'}`}>{msg.senderName}</span>
                          <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded ${
                            isMe ? 'text-blue-700 bg-blue-50' : 'text-teal-700 bg-teal-50'
                          }`}>
                            {msg.senderRole}
                          </span>
                          <span className={`font-medium text-[8px] ${isMe ? 'text-blue-400/80' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Content text */}
                        {editingMessageId === msg.id ? (
                          <div className="space-y-1.5">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit();
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                              className="w-full bg-white border border-teal-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700 resize-none"
                              rows={2}
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={handleSaveEdit}
                                className="px-2.5 py-1 bg-teal-800 hover:bg-teal-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`group relative text-xs p-3 rounded-2xl whitespace-pre-line border leading-relaxed font-medium ${
                            isMe 
                              ? 'bg-blue-100 border-blue-200 text-slate-800 rounded-tr-none w-fit max-w-full'
                              : msg.isNotice 
                                ? 'bg-rose-50 border-rose-100 text-slate-900 rounded-tl-none ring-1 ring-rose-200/20'
                                : 'bg-white border-slate-150 text-slate-800 rounded-tl-none'
                          }`}>
                            {msg.text}
                            {msg.isEdited && (
                              <span className="text-[8px] text-slate-400 font-semibold ml-1.5">(edited)</span>
                            )}
                            {(isMe || isAdminRole) && (
                              <div className={`absolute top-0 ${isMe ? 'left-full ml-1' : 'right-full mr-1'} hidden group-hover:flex items-center gap-0.5 bg-white border border-slate-150 rounded-lg shadow-sm px-1 py-0.5 z-10`}>
                                {isMe && (
                                  <button
                                    onClick={() => handleStartEdit(msg)}
                                    className="p-1 hover:bg-slate-100 rounded transition cursor-pointer text-slate-400 hover:text-blue-600"
                                    title="Edit message"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="p-1 hover:bg-rose-50 rounded transition cursor-pointer text-slate-400 hover:text-red-600"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">No Messages Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Send a message to kick off the channel discussion.
                  </p>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* 3. Compose box */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              {canPostMessage() ? (
                <form onSubmit={handleSendMessage} className="space-y-2.5">
                  
                  {/* Action row with EOD report helper template */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Always adhere to channel rules.</span>
                    </div>

                    {/* EOD Helper trigger */}
                    {activeGroup.category === 'EOD' && (
                      <button
                        type="button"
                        onClick={handleInsertEODTemplate}
                        className="text-[10px] font-black text-teal-850 hover:text-teal-700 bg-teal-50 hover:bg-teal-100/80 border border-teal-100 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3 text-teal-800" />
                        <span>Insert EOD Template</span>
                      </button>
                    )}
                  </div>

                  {/* Input form element */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={
                        activeGroup.category === 'Notice' 
                          ? 'Publish an official notice...' 
                          : 'Type your message...'
                      }
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-150 pl-4 pr-12 py-3 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                    />

                    <button
                      type="submit"
                      disabled={!newMessageText.trim()}
                      className="p-3 bg-teal-800 hover:bg-teal-700 text-white rounded-xl transition shadow-md shadow-teal-900/10 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                </form>
              ) : (
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 text-center text-rose-700 text-xs font-bold flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Only administrators and team leads are permitted to post notices in this channel.</span>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Select a Chat</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs font-semibold">
              Select one of the corporate discussion groups from the channel column to view discussion histories.
            </p>
          </div>
        )}
      </div>

      {/* CREATE NEW CHANNEL DIALOG MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-md w-full overflow-hidden animate-fadeIn text-left">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-800" />
                <span>Create Group Channel</span>
              </h3>
              <button 
                  onClick={() => { resetCreateForm(); setIsCreateModalOpen(false); }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
              
              {/* Channel Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Channel Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. daily-eod-reporting"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description</label>
                <input
                  type="text"
                  placeholder="What is this discussion about?"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                />
              </div>

              {/* Category & Locks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Category</label>
                  <select
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="EOD">Daily EOD</option>
                    <option value="Notice">Notice Panel</option>
                    <option value="Project">Project Scoped</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Posting Privileges</label>
                  <button
                    type="button"
                    onClick={() => setNewGroupLocked(!newGroupLocked)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      newGroupLocked 
                        ? 'bg-rose-50 border-rose-200 text-rose-800' 
                        : 'bg-slate-50 border-slate-150 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{newGroupLocked ? 'Admins Only' : 'Everyone'}</span>
                  </button>
                </div>
              </div>

              {/* Member checklist (Invitation) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Invite Staff Members</label>
                <div className="max-h-36 overflow-y-auto border border-slate-100 rounded-xl p-2.5 bg-slate-50/50 space-y-1">
                  {employees.map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleToggleMemberSelection(emp.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        newGroupMembers.includes(emp.id) 
                          ? 'bg-teal-50 text-teal-900' 
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span>{emp.firstName} {emp.lastName} ({emp.designation})</span>
                      {newGroupMembers.includes(emp.id) && <Check className="w-3.5 h-3.5 text-teal-800" />}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                  Leave empty to create a public channel accessible to the entire company.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                onClick={() => { resetCreateForm(); setIsCreateModalOpen(false); }}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Create Group
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* INVITE NEW MEMBERS TO EXISTING CHANNEL MODAL */}
      {isInviteModalOpen && activeGroup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-sm w-full overflow-hidden animate-fadeIn text-left">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-800" />
                <span>Invite to {activeGroup.name}</span>
              </h3>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteMembers} className="p-5 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Select Colleagues</label>
                <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl p-2.5 bg-slate-50/50 space-y-1">
                  {employees
                    .filter(emp => !activeGroup.memberIds.includes(emp.id))
                    .map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleToggleInviteSelection(emp.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          inviteEmployeeIds.includes(emp.id) 
                            ? 'bg-teal-50 text-teal-900 font-extrabold' 
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span>{emp.firstName} {emp.lastName} ({emp.department})</span>
                        {inviteEmployeeIds.includes(emp.id) && <Check className="w-3.5 h-3.5 text-teal-800" />}
                      </button>
                    ))}

                  {employees.filter(emp => !activeGroup.memberIds.includes(emp.id)).length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      All employees are already members of this channel!
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteEmployeeIds.length === 0}
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Send Invitation
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
