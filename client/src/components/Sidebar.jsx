import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, BarChart2, User, LogOut, Sparkles, Moon, Sun, Handshake, Camera, MessageCircle, Trophy, ShieldAlert, Scissors } from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', label: 'dashboard', Icon: LayoutDashboard },
  { to: '/analytics', label: 'analytics', Icon: BarChart2 },
  { to: '/insights', label: 'ai insights', Icon: Sparkles },
  { to: '/chat', label: 'ai chat', Icon: MessageCircle },
  { to: '/moments', label: 'moments', Icon: Camera },
  { to: '/challenges', label: 'challenges', Icon: Trophy },
  { to: '/split', label: 'split bill', Icon: Scissors },
  { to: '/pricecheck', label: 'price check', Icon: ShieldAlert },
  { to: '/debts', label: 'io us', Icon: Handshake },
  { to: '/profile', label: 'profile', Icon: User },
];

const Sidebar = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">finwise</span>
        <span className="sidebar-tagline">your money, simplified.</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            id={`tour-${item.to.replace('/', '')}`}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
            }
          >
            <item.Icon size={15} strokeWidth={1.8} />
            <span>[{item.label}]</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-email">{user.email}</span>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button className="btn btn-ghost btn-sm" onClick={toggleTheme} style={{ flex: 1, padding: '8px 0', display: 'flex', justifyContent: 'center' }} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button className="sidebar-logout btn btn-ghost btn-sm" onClick={handleLogout} style={{ flex: 3 }}>
            <LogOut size={13} />
            logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
