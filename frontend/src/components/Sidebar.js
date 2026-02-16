import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, UserCircle, BarChart3,
  LogOut, ChevronLeft, ChevronRight, GraduationCap, Menu, X, Settings, Trophy, Newspaper
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Kullanicilar' },
  { to: '/admin/courses', icon: BookOpen, label: 'Egitimler' },
  { to: '/admin/qualifications', icon: Newspaper, label: 'Kalifikasyon' },
  { to: '/leaderboard', icon: Trophy, label: 'Siralama' },
  { to: '/admin/reports', icon: BarChart3, label: 'Raporlar' },
  { to: '/admin/settings', icon: Settings, label: 'Ayarlar' },
  { to: '/profile', icon: UserCircle, label: 'Profil' },
];

const distributorLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/qualifications', icon: Newspaper, label: 'Kalifikasyon' },
  { to: '/leaderboard', icon: Trophy, label: 'Siralama' },
  { to: '/profile', icon: UserCircle, label: 'Profil' },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/settings`)
      .then(res => {
        if (res.data?.logo_url) {
          setLogoUrl(res.data.logo_url.startsWith('/api') ? `${BACKEND_URL}${res.data.logo_url}` : res.data.logo_url);
        }
      })
      .catch(() => {});
  }, []);

  const links = user?.role === 'distributor' ? distributorLinks : adminLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    distributor: 'Distributor'
  };

  const sidebarContent = (
    <div className="flex flex-col h-full" data-testid="sidebar">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-[4.5rem] h-[4.5rem] rounded-lg object-contain flex-shrink-0" data-testid="sidebar-logo" />
          ) : (
            <div className="w-[4.5rem] h-[4.5rem] rounded-lg bg-[#00C853] flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          )}
          {!collapsed && (
            <div className="animate-fadeIn">
              <h1 className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: 'Barlow Condensed' }}>
                PROFIT TEAM
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Egitim Platformu</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/dashboard'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-[#00C853] text-white font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
            data-testid={`sidebar-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-[#00C853]/20 flex items-center justify-center text-[#00C853] font-bold text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{roleLabel[user?.role]}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all duration-200"
          data-testid="logout-button"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Cikis Yap</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center py-3 border-t border-white/10 text-gray-500 hover:text-white transition-colors"
        data-testid="sidebar-collapse-btn"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#111111] text-white rounded-lg flex items-center justify-center shadow-lg"
        data-testid="mobile-menu-btn"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-[#111111]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              data-testid="mobile-menu-close"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside
        className={`hidden lg:flex flex-col bg-[#111111] h-screen fixed left-0 top-0 z-40 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      <div className={`hidden lg:block transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`} />
    </>
  );
};
