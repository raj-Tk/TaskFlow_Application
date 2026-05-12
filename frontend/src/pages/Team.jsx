import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, User } from 'lucide-react';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: me } = useAuth();
  const toast = useToast();

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.users)).finally(() => setLoading(false));
  }, []);

  async function changeRole(userId, role) {
    try {
      await api.put(`/users/${userId}/role`, { role });
      setUsers(us => us.map(u => u.id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  }

  const admins = users.filter(u => u.role === 'admin');
  const members = users.filter(u => u.role === 'member');

  return (
    <div style={{ padding: '36px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px', animation: 'fadeInUp 0.35s ease' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>Team</h1>
        <p style={{ color: 'var(--text-2)', marginTop: '4px', fontSize: '14px' }}>{users.length} members in your organization</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '28px', height: '28px' }} />
        </div>
      ) : (
        <>
          {[{ label: 'Admins', icon: Shield, color: 'var(--accent)', list: admins },
            { label: 'Members', icon: User, color: 'var(--cyan)', list: members }].map(({ label, icon: Icon, color, list }) => (
            list.length > 0 && (
              <div key={label} style={{ marginBottom: '36px', animation: 'fadeInUp 0.4s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Icon size={15} color={color} />
                  <h2 style={{ fontSize: '14px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label} · {list.length}</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {list.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '12px', transition: 'var(--transition)' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div className="avatar" style={{ width: '40px', height: '40px', background: u.avatar_color || '#6366f1', fontSize: '15px' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '600', fontSize: '15px' }}>{u.name} {u.id === me.id && <span style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: '400' }}>(you)</span>}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>{u.email}</p>
                      </div>
                      {u.id !== me.id && (
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
                          className="input"
                          style={{ width: 'auto', padding: '6px 28px 6px 10px', fontSize: '13px' }}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </>
      )}
    </div>
  );
}
