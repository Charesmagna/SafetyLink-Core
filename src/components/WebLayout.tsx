import React from 'react';
import { usePlatform } from '../hooks/usePlatform';
import { Shield, Map, Users, Settings, Bell, LogOut } from 'lucide-react';

interface WebLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  orgName?: string;
  onLogout?: () => void;
}

export function WebLayout({ children, activeTab, onTabChange, orgName, onLogout }: WebLayoutProps) {
  const { showSidebar, showBottomNav, isWeb } = usePlatform();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (!isWeb) return <>{children}</>;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar — web desktop only */}
      {showSidebar && (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <img src="/sl-icon.png" alt="SafetyLink" className="w-8 h-8 rounded-lg" />
              <div>
                <div className="text-white font-bold text-sm">SafetyLink</div>
                <div className="text-slate-400 text-xs truncate">{orgName || 'Control Room'}</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => onTabChange(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className={`flex-1 overflow-auto ${showBottomNav ? 'pb-20' : ''}`}>
        {children}
      </main>

      {/* Bottom nav — web mobile only */}
      {showBottomNav && isWeb && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex z-50">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${
                activeTab === id ? 'text-emerald-400' : 'text-slate-500'
              }`}>
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
