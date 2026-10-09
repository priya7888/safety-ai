import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  UploadCloud, 
  FileText, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Settings, 
  LogOut, 
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ 
  currentPath = '/dashboard', 
  onNavigate, 
  isOpen = false, 
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  onExitPlatform
}) {
  const { user, logout } = useAuth();

  const isAdmin = Boolean(
    user?.is_admin || 
    user?.role === 'ADMINISTRATOR' || 
    user?.role_name === 'Administrator' || 
    (user?.email && user.email.toLowerCase().includes('admin'))
  );

  const navGroups = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'ai_analysis', path: '/ai-analysis', label: 'AI Analysis', icon: Cpu, isAi: true },
        { id: 'incident_map', path: '/incident-map', label: isAdmin ? 'Incident Radar & Map' : 'My Map & Incidents', icon: Compass },
        { id: 'bulk_upload', path: '/bulk-upload', label: 'Bulk Upload', icon: UploadCloud },
        { id: 'reports', path: '/reports', label: 'All Reports', icon: FileText },
        { id: 'week_signals', path: '/week-signals', label: 'Week Signals', icon: Activity },
        ...(isAdmin ? [{ id: 'sif_precursors', path: '/sif-precursors', label: 'Admin Dashboard (SIF)', icon: Zap }] : []),
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', path: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  const handleItemClick = (path) => {
    if (onNavigate) onNavigate(path);
    if (onClose) onClose();
  };

  const handleExit = () => {
    if (onExitPlatform) {
      onExitPlatform();
    } else {
      logout();
    }
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-[#0B1327] border-r border-slate-800/80 text-slate-300 shrink-0 select-none shadow-2xl transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      
      {/* 1. Header: SafetyAI, Subtitle & Arrow */}
      {isCollapsed ? (
        /* Collapsed Header: SafetyAI Shield + Three Lines (Menu) & Arrow */
        <div className="p-3.5 border-b border-slate-800/80 flex flex-col items-center justify-center gap-2">
          <div 
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B4A] to-[#FF5A36] flex items-center justify-center text-white shadow-lg shadow-orange-500/25 shrink-0" 
            title="SafetyAI Platform"
          >
            <ShieldCheck className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          
          {/* Three Lines (Menu) + Chevron button to Expand */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-10 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer group shadow-xs"
              title="Expand navigation sidebar"
              aria-label="Expand sidebar"
            >
              <Menu className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400 transition-colors" />
            </button>
          )}
        </div>
      ) : (
        /* Expanded Header: Full Brand Logo + Collapse Arrow */
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B4A] to-[#FF5A36] flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
                <ShieldCheck className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-lg font-black tracking-tight text-white font-heading">
                  Safety<span className="text-[#FF5A36]">AI</span>
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-tight truncate">
                AI-Powered Safety Platform
              </div>
            </div>
          </div>

          {/* Desktop Arrow Collapse Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/90 transition-all cursor-pointer items-center justify-center shrink-0 ml-1.5"
              title="Collapse sidebar (Show symbols only)"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-5 h-5 text-slate-300 hover:text-white transition-colors" />
            </button>
          )}

          {/* Mobile close button */}
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 2. Navigation Items List grouped */}
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2 py-3' : 'px-3 py-4'} space-y-3 custom-scrollbar`}>
        {navGroups.map((group, gIdx) => (
          <div key={group.title} className="space-y-1">
            {isCollapsed ? (
              gIdx > 0 ? <div className="my-2 border-t border-slate-800/80 mx-2" /> : null
            ) : (
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.path)}
                  title={item.label}
                  className={`w-full flex items-center rounded-xl text-left text-xs font-semibold transition-all duration-200 group relative cursor-pointer ${
                    isCollapsed
                      ? 'justify-center p-2.5 h-11'
                      : 'justify-between px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF5A36] to-[#FFA133] text-white font-bold shadow-md shadow-orange-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                    <div className="relative flex items-center justify-center">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                      {isCollapsed && item.isAi && (
                        <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#0B1327]" />
                      )}
                    </div>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {/* Status Badges (shown when expanded) */}
                  {!isCollapsed && (
                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor === 'rose'
                              ? 'bg-rose-500 text-white'
                              : 'bg-orange-500 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {item.isAi && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          AI
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 3. Bottom of Sidebar: User Profile & Exit Platform */}
      <div className={`p-3 border-t border-slate-800/80 bg-[#0B1327] ${isCollapsed ? 'flex flex-col items-center gap-2' : 'space-y-2.5'}`}>
        
        {/* User Identity & Settings shortcut */}
        <button
          onClick={() => handleItemClick('/settings')}
          className={`rounded-xl bg-[#131E3A] border border-slate-700/60 shadow-inner flex items-center hover:bg-[#1a294e] hover:border-slate-600 transition-all text-left cursor-pointer group ${
            isCollapsed 
              ? 'w-10 h-10 p-0 justify-center' 
              : 'w-full p-2.5 gap-2.5'
          }`}
          title={user?.full_name || 'Account Settings'}
        >
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user?.full_name || 'User'} 
              className="w-8 h-8 rounded-lg object-cover border border-orange-500/40 shrink-0 shadow-xs ring-1 ring-orange-500/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF5A36] to-[#FFA133] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'AD'}
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                {user?.full_name || 'Chief HSE Administrator'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.role_name || (user?.is_admin ? 'Administrator' : 'Normal User')}
              </div>
            </div>
          )}
        </button>

        {/* Exit to Public Website Button */}
        <button
          onClick={handleExit}
          className={`flex items-center rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer ${
            isCollapsed
              ? 'w-10 h-10 p-0 justify-center'
              : 'w-full gap-2 px-3 py-2'
          }`}
          title="Return to public safety overview or log out"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          {!isCollapsed && <span>Exit Platform</span>}
        </button>

      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Static Sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen fixed top-0 left-0 bottom-0 z-40 transition-all duration-300 shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
