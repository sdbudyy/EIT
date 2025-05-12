import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, FileText, Settings, HelpCircle, LogOut, FileEdit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useProgressStore } from '../store/progress';
import AccredaLogo from '../assets/accreda-logo.png';

interface SidebarProps {
  onClose?: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: <Home size={20} /> },
  { name: 'Skills', path: '/skills', icon: <BookOpen size={20} /> },
  { name: 'SAOs', path: '/saos', icon: <FileEdit size={20} /> },
  { name: 'Documents', path: '/documents', icon: <FileText size={20} /> },
  { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
];

const secondaryNavItems = [
  { name: 'Help & Support', path: '/help', icon: <HelpCircle size={20} /> },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { overallProgress } = useProgressStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-center">
        <img src={AccredaLogo} alt="Accreda Logo" className="h-28 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-teal-600 text-white' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`
                }
                onClick={onClose}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-10 px-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 px-3">
            Support
          </h3>
          <ul className="space-y-1 px-3">
            {secondaryNavItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                  onClick={onClose}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
            <li>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2.5 rounded-lg transition-colors w-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <LogOut size={20} className="mr-3" />
                <span>Sign Out</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Program progress */}
      <div className="p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
        <div className="mb-2 flex justify-between items-center">
          <h3 className="text-sm font-medium text-slate-300">Program Progress</h3>
          <span className="text-sm font-semibold text-teal-400">{overallProgress}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-teal-500 rounded-full transition-all duration-300" 
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;