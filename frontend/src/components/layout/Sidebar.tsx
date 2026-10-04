import React, { useEffect, useRef, useState } from 'react';
import type { AuthUser, Employee } from '../../types';
import { routeByTab } from '../../constants/routes';
import {
  BarChart3,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Key,
  Layers,
  LogOut,
  MessageSquare,
  Search,
  Shield,
  ShieldCheck,
  Umbrella,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (tabId: string) => void;
  activeTab: string;
  permissions: string[];
  user: AuthUser;
  employees: Employee[];
  onLogout: () => void;
  onChangePassword: () => void;
  onToast: (message: string) => void;
}

interface SearchItem {
  name: string;
  type: string;
  tab: string;
}

const NAV_GROUPS: {
  section: string;
  items: { id: string; label: string; icon: React.ReactNode; permissions: string[] }[];
}[] = [
    {
      section: 'Main Menu',
      items: [
        { id: 'profile', label: 'My Profile', icon: <UserRound className="w-4 h-4" />, permissions: [] },
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" />, permissions: ['dashboard:view'] },
        { id: 'projects', label: 'Projects', icon: <Layers className="w-4 h-4" />, permissions: ['projects:view'] },
        { id: 'notes', label: 'Notes', icon: <Bookmark className="w-4 h-4" />, permissions: ['notes:view'] },
        { id: 'chat', label: 'Group Chat', icon: <MessageSquare className="w-4 h-4" />, permissions: ['chat:manage'] },
      ],
    },
    {
      section: 'Workforce Modules',
      items: [
        { id: 'roster', label: 'Employee Roster', icon: <Calendar className="w-4 h-4" />, permissions: ['rosters:view'] },
        { id: 'attendance', label: 'Attendance Check-In', icon: <Clock className="w-4 h-4" />, permissions: ['attendance:view'] },
        { id: 'departments', label: 'Departments', icon: <Building2 className="w-4 h-4" />, permissions: ['departments:view'] },
        { id: 'leave', label: 'Leave Management', icon: <Umbrella className="w-4 h-4" />, permissions: ['leaves:view'] },
        { id: 'onboarding', label: 'Employee Onboarding', icon: <Users className="w-4 h-4" />, permissions: ['onboarding:manage'] },
        { id: 'offboarding', label: 'Exit / Offboarding', icon: <LogOut className="w-4 h-4" />, permissions: ['offboarding:view'] },
        { id: 'recruitment', label: 'Recruitment & Job Apps', icon: <Briefcase className="w-4 h-4" />, permissions: ['recruitment:view'] },
      ],
    },
    {
      section: 'Access Control',
      items: [
        { id: 'team', label: 'User Management', icon: <UserCog className="w-4 h-4" />, permissions: ['users:view'] },
        { id: 'roles', label: 'Roles & Permissions', icon: <ShieldCheck className="w-4 h-4" />, permissions: ['roles:view'] },
        { id: 'permissions', label: 'Permission Catalog', icon: <Shield className="w-4 h-4" />, permissions: ['roles:view'] },
      ],
    },
  ];

export default function Sidebar({
  expanded,
  onToggle,
  onNavigate,
  activeTab,
  permissions,
  user,
  employees,
  onLogout,
  onChangePassword,
  onToast,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingFocusRef = useRef(false);
  const expandedRef = useRef(expanded);
  const onToggleRef = useRef(onToggle);

  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  // Global shortcut: Ctrl/Cmd + K focuses the sidebar search (expanding it if collapsed)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchDropdown(true);
        if (!expandedRef.current) {
          pendingFocusRef.current = true;
          onToggleRef.current();
        } else {
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Deferred focus after the sidebar expands via Cmd/Ctrl + K
  useEffect(() => {
    if (expanded && pendingFocusRef.current) {
      pendingFocusRef.current = false;
      searchInputRef.current?.focus();
    }
  }, [expanded]);

  // Close the search dropdown when clicking outside of it
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Keep the highlighted result visible while navigating with arrow keys
  useEffect(() => {
    if (highlightedIndex === null) return;
    resultRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // Dynamic search data matching pages, employees, and projects
  const searchItems: SearchItem[] = [
    { name: 'My Profile', type: 'Page', tab: 'profile' },
    { name: 'Dashboard', type: 'Page', tab: 'dashboard' },
    { name: 'Employee Roster', type: 'Page', tab: 'roster' },
    { name: 'Attendance Check-In', type: 'Page', tab: 'attendance' },
    { name: 'Leave Management', type: 'Page', tab: 'leave' },
    { name: 'Employee Onboarding', type: 'Page', tab: 'onboarding' },
    { name: 'Exit / Offboarding', type: 'Page', tab: 'offboarding' },
    { name: 'Recruitment & Job Apps', type: 'Page', tab: 'recruitment' },
    { name: 'Projects', type: 'Page', tab: 'projects' },
    { name: 'Notes', type: 'Page', tab: 'notes' },
    { name: 'Group Chat', type: 'Page', tab: 'chat' },
    { name: 'User Management', type: 'Page', tab: 'team' },
    { name: 'Roles & Permissions', type: 'Page', tab: 'roles' },
    { name: 'Permission Catalog', type: 'Page', tab: 'permissions' },
    ...employees.map((e) => ({
      name: `${e.firstName} ${e.lastName} (${e.designation})`,
      type: 'Employee',
      tab: 'roster',
    })),
    { name: 'Figma Design System', type: 'Project', tab: 'projects' },
    { name: 'Keep React', type: 'Project', tab: 'projects' },
    { name: 'Static Mania', type: 'Project', tab: 'projects' },
  ];

  const filteredSearch = searchItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectItem = (item: SearchItem) => {
    onNavigate(item.tab);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setHighlightedIndex(null);
    onToast(`Navigated to ${item.name}`);
  };

  return (
    <>
      {/* Docked Sidebar - Bright, Clean White/Light Styling */}
      <div
        id="docked-navigation-sidebar"
        className={`shrink-0 bg-white text-slate-850 border-r border-slate-100/90 transition-all duration-300 ease-in-out flex flex-col overflow-hidden fixed inset-y-0 left-0 z-40 w-1/2 max-w-[280px] lg:w-auto lg:inset-y-auto lg:sticky lg:top-0 lg:max-h-screen lg:max-w-none ${expanded ? 'translate-x-0 lg:translate-x-0 lg:w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'
          }`}
      >
        {/* Sidebar Header & Toggle */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="/Taskmandu-logo.png"
              alt="Taskmandu logo"
              className="h-8 w-8 shrink-0 rounded-lg object-cover shadow-md shadow-teal-900/20"
            />
            {expanded && (
              <div className="animate-fadeIn truncate">
                <p className="font-black text-sm tracking-tight text-slate-900 uppercase">Taskmandu</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Workspace</p>
              </div>
            )}
          </div>

          <button
            id="sidebar-toggle-btn"
            onClick={onToggle}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 transition cursor-pointer"
            title={expanded ? 'Collapse Menu' : 'Expand Menu'}
          >
            {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links and Sections */}
        <div className="p-3 space-y-4 flex-1 min-h-0 overflow-y-auto">
          {/* Search Input Box */}
          {expanded && (
            <div className="relative animate-fadeIn" ref={searchBoxRef}>
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search workspace..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(null);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    if (!searchQuery || filteredSearch.length === 0) return;
                    e.preventDefault();
                    const max = filteredSearch.length - 1;
                    setHighlightedIndex((prev) => {
                      if (prev === null) return e.key === 'ArrowDown' ? 0 : max;
                      return e.key === 'ArrowDown' ? Math.min(prev + 1, max) : Math.max(prev - 1, 0);
                    });
                  } else if (e.key === 'Enter') {
                    if (!searchQuery || filteredSearch.length === 0) return;
                    e.preventDefault();
                    handleSelectItem(filteredSearch[highlightedIndex ?? 0]);
                  } else if (e.key === 'Escape') {
                    if (searchQuery) {
                      setSearchQuery('');
                      setHighlightedIndex(null);
                      setShowSearchDropdown(false);
                    } else {
                      searchInputRef.current?.blur();
                      setShowSearchDropdown(false);
                    }
                  }
                }}
                className="w-full bg-slate-50 border border-slate-100 pl-9 pr-10 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-2.5 top-2 hover:bg-slate-200 text-slate-500 p-0.5 rounded transition text-[10px] font-bold cursor-pointer"
                >
                  ✕
                </button>
              ) : (
                <span className="absolute right-2.5 top-2.5 bg-slate-200/60 text-slate-500 px-1 py-0.5 rounded text-[8px] font-black">
                  ⌘K
                </span>
              )}

              {/* Floating Search Dropdown */}
              {showSearchDropdown && searchQuery && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto p-1.5 space-y-1">
                  <div className="px-2 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Results for "{searchQuery}"
                  </div>
                  {filteredSearch.length > 0 ? (
                    filteredSearch.map((item, idx) => (
                      <button
                        key={idx}
                        ref={(el) => {
                          resultRefs.current[idx] = el;
                        }}
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-left text-[11px] font-bold p-2 rounded-lg transition flex items-center justify-between cursor-pointer ${
                          idx === highlightedIndex
                            ? 'bg-teal-50 text-teal-900'
                            : 'text-slate-700 hover:bg-teal-50 hover:text-teal-900'
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded shrink-0 ml-1.5">
                          {item.type}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-3 text-slate-400 text-[10px] font-semibold">
                      No matches found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nav groups */}
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={group.section} className={`space-y-1.5 ${groupIdx > 0 ? 'pt-1' : ''}`}>
              {expanded && (
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-3 mb-2">
                  {group.section}
                </p>
              )}
              {group.items
                .filter((tab) => tab.permissions.length === 0 || tab.permissions.some((p) => permissions.includes(p)))
                .map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onNavigate(tab.id)}
                      className={`w-full flex items-center transition-all duration-150 py-2 rounded-lg text-xs font-bold cursor-pointer ${expanded ? 'px-3 gap-2.5 text-left' : 'justify-center px-1'
                        } ${isActive
                          ? 'bg-teal-800 text-white shadow-md shadow-teal-900/10'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      title={!expanded ? tab.label : undefined}
                    >
                      <span className={`${isActive ? 'text-white' : 'text-slate-450 shrink-0'}`}>
                        {tab.icon}
                      </span>
                      {expanded && <span className="truncate">{tab.label}</span>}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer detailing Active User info & sign-out button */}
        <div className="px-3 py-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50 shrink-0 mt-auto">
          <div
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer group"
            title="My Profile"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-7 w-7 shrink-0 rounded-lg object-cover ring-1 ring-slate-200 group-hover:ring-teal-200 transition"
              />
            ) : (
              <div className="h-7 w-7 shrink-0 rounded-lg bg-teal-50 text-teal-800 font-extrabold flex items-center justify-center text-xs ring-1 ring-teal-100 group-hover:bg-teal-100 transition">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
            )}
            {expanded && (
              <div className="truncate animate-fadeIn text-left leading-tight group-hover:opacity-70 transition">
                <p className="font-extrabold text-xs text-slate-900">{user.name}</p>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{user.role}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onChangePassword}
              className="p-1.5 text-slate-450 hover:text-teal-700 rounded-lg hover:bg-teal-50 transition cursor-pointer"
              title="Change Password"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-450 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile backdrop blur when drawer open */}
      {expanded && (
        <div onClick={onToggle} className="lg:hidden fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm" />
      )}
    </>
  );
}
