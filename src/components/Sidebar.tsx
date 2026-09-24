import React from 'react';
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  Flame,
  Database,
  Settings,
  Info,
  Radio,
  Bluetooth,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { SystemStatus } from '../types/smce';

export type NavTab =
  | 'dashboard'
  | 'monitoring'
  | 'risk'
  | 'protection'
  | 'logs'
  | 'esp32'
  | 'settings'
  | 'about';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  systemStatus: SystemStatus;
  alertCount: number;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  systemStatus,
  alertCount,
  isOpenMobile,
  onToggleMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'monitoring' as NavTab,
      label: 'Live Monitoring',
      icon: Activity,
      badge: 'LIVE',
    },
    {
      id: 'risk' as NavTab,
      label: 'Risk Analysis',
      icon: ShieldAlert,
      badge: null,
    },
    {
      id: 'protection' as NavTab,
      label: 'Protection Control',
      icon: Flame,
      badge: null,
    },
    {
      id: 'logs' as NavTab,
      label: 'Data Logs',
      icon: Database,
      badge: null,
    },
    {
      id: 'esp32' as NavTab,
      label: 'ESP32 Bluetooth',
      icon: Bluetooth,
      badge: 'BLE',
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
    {
      id: 'about' as NavTab,
      label: 'About System',
      icon: Info,
      badge: null,
    },
  ];

  const getStatusColor = (status: SystemStatus) => {
    switch (status) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'WARNING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'PROTECTION ACTIVE':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'NORMAL':
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Mobile Close Button */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white font-mono">SMCE Telemetry</span>
          </div>
          <button
            onClick={onToggleMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Station Status Banner */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Station Status
          </div>
          <div
            className={`mt-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border flex items-center justify-between ${getStatusColor(
              systemStatus
            )}`}
          >
            <span className="truncate">{systemStatus}</span>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse ml-2" />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-cyan-400' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 space-y-2">
        <div className="flex items-center justify-between">
          <span>Firmware</span>
          <span className="text-slate-400">v2.4.1-RTOS</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Sector</span>
          <span className="text-cyan-400">Ladakh Base-4</span>
        </div>
        <div className="text-[10px] text-slate-600 pt-1 border-t border-slate-900">
          Autonomous Protection Active
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950/90 border-r border-slate-800 shrink-0 sticky top-[65px] h-[calc(100vh-65px)]">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
          onClick={onToggleMobile}
        >
          <div
            className="w-72 bg-slate-950 border-r border-slate-800 h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
