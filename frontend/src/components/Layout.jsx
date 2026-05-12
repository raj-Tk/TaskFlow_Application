import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Zap, LayoutDashboard, FolderKanban, CheckSquare,
  Users, LogOut, ChevronLeft, ChevronRight, Settings
} from 'lucide-react';

function Avatar({ user, size = 32 }) {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className="avatar" style={{ width: size, height: size, background: user?.avatar_color || '#6366f1', fontSize: size < 32 ? '10px' : '13px' }}>
      {initials}
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
    ...(isAdmin ? [{ to: '/team', icon: Users, label: 'Team' }] : []),
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: collapsed ? '64px' : '220px',
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 10px',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 6px 20px', marginBottom: '8px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '34px', height: '34px', background: 'var(--accent)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(124,106,247,0.35)' }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          {!collapsed && <span style={{ fontWeight: '800', fontSize: '17px', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>TaskFlow</span>}
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
              borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
              color: isActive ? 'var(--text)' : 'var(--text-2)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              transition: 'var(--transition)',
              whiteSpace: 'nowrap', overflow: 'hidden',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            })}
            onMouseEnter={e => { if (!e.currentTarget.style.background.includes('accent-dim')) e.currentTarget.style.background = 'var(--bg-3)'; }}
            onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        <button onClick={() => setCollapsed(c => !c)} className="btn btn-ghost btn-icon" style={{ alignSelf: 'flex-end', marginBottom: '12px', padding: '7px' }}>
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 8px 4px' }}>
          <Avatar user={user} size={34} />
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-2)', textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '4px', borderRadius: '6px', display: 'flex', transition: 'var(--transition)' }} title="Logout">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}

export { Avatar };
