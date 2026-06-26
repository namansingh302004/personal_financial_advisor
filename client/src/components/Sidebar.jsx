import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, BarChart2, User, LogOut } from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', label: 'dashboard', Icon: LayoutDashboard },
  { to: '/analytics', label: 'analytics', Icon: BarChart2 },
  { to: '/profile', label: 'profile', Icon: User },
];

const Sidebar = () => {
  const { logout, user } = useAuth();
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
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
            }
          >
            <Icon size={15} strokeWidth={1.8} />
            <span>[{label}]</span>
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
        <button className="sidebar-logout btn btn-ghost btn-sm" onClick={handleLogout}>
          <LogOut size={13} />
          logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
