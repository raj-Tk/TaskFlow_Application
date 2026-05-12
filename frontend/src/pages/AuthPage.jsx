import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { Zap, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: '' }));
  }

  function validate() {
    const e = {};
    if (mode === 'signup' && !form.name.trim()) e.name = 'Name is required';
    if (!form.email.includes('@')) e.email = 'Enter a valid email';
    if (form.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : form;
      const { data } = await api.post(endpoint, payload);
      login(data.user, data.token);
      toast.success(mode === 'login' ? `Welcome back, ${data.user.name}!` : `Account created!`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,106,247,0.08) 0%, transparent 70%)', top: '-100px', left: '-100px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)', bottom: '-50px', right: '-50px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', background: 'var(--accent)', borderRadius: '14px', marginBottom: '16px', boxShadow: '0 8px 32px rgba(124,106,247,0.4)' }}>
            <Zap size={26} color="white" fill="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>TaskFlow</h1>
          <p style={{ color: 'var(--text-2)', marginTop: '6px', fontSize: '14px' }}>Team productivity, beautifully organized</p>
        </div>

        <div className="card" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-light)', padding: '32px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: '8px', padding: '4px', marginBottom: '28px' }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setErrors({}); }} className="btn" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontWeight: '600', fontSize: '14px', background: mode === m ? 'var(--bg-4)' : 'transparent', color: mode === m ? 'var(--text)' : 'var(--text-2)', border: mode === m ? '1px solid var(--border-light)' : 'none', transition: 'var(--transition)' }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="label">Full Name</label>
                <input className="input" name="name" placeholder="John Doe" value={form.name} onChange={handle} autoComplete="name" />
                {errors.name && <p className="error-msg">{errors.name}</p>}
              </div>
            )}

            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} autoComplete="email" />
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" name="password" type={showPass ? 'text' : 'password'} placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'} value={form.password} onChange={handle} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} style={{ paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-msg">{errors.password}</p>}
            </div>

            {mode === 'signup' && (
              <div className="form-group">
                <label className="label">Role</label>
                <select className="input" name="role" value={form.role} onChange={handle}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px', marginTop: '4px' }}>
              {loading ? <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Processing...</> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-2)' }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrors({}); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600', font: 'inherit', fontSize: '13px' }}>
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
