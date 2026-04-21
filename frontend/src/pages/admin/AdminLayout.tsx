import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, School, Users, Bus, GraduationCap,
  BarChart3, LogOut, Menu, X,
} from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/classes', label: 'Classes', icon: School },
  { to: '/admin/teachers', label: 'Teachers', icon: Users },
  { to: '/admin/buses', label: 'Buses', icon: Bus },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static h-full z-30 w-64 bg-navy-950 flex flex-col border-r border-white/5 shrink-0
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
              <Bus className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">BusFee Tracker</h1>
              <p className="text-xs text-gold-400 font-medium">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
            <div className="w-9 h-9 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 font-bold text-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              id="admin-logout-btn"
              onClick={handleLogout}
              title="Logout"
              className="text-gray-500 hover:text-red-400 transition-colors shrink-0 p-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-navy-950 border-b border-white/5 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-gold-400" />
            <span className="font-bold text-white">BusFee Tracker</span>
          </div>
          <button
            id="admin-mobile-menu-btn"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 hover:text-white p-1"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-navy-900 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
