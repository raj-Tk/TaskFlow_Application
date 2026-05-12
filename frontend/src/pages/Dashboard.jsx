import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { format, isAfter, parseISO } from 'date-fns';
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp,
  ArrowRight, Calendar, Zap
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ padding: '10px', borderRadius: '10px', background: `${color}20` }}>
          <Icon size={20} color={color} />
        </div>
        <span style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.03em', color }}>{value ?? 0}</span>
      </div>
      <div>
        <p style={{ fontWeight: '600', fontSize: '14px' }}>{label}</p>
        {sub && <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_COLOR = { low: 'var(--text-2)', medium: 'var(--accent)', high: 'var(--orange)', urgent: 'var(--red)' };

function TaskRow({ task }) {
  const isOverdue = task.due_date && task.status !== 'done' && isAfter(new Date(), parseISO(task.due_date));
  return (
    <Link to={`/projects/${task.project_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-3)', border: '1px solid var(--border)', marginBottom: '8px', transition: 'var(--transition)', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ width: '3px', height: '36px', borderRadius: '2px', background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
            <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '5px', background: `${task.project_color}20`, color: task.project_color, fontWeight: '600' }}>{task.project_name}</span>
            {task.due_date && (
              <span style={{ fontSize: '11px', color: isOverdue ? 'var(--red)' : 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Calendar size={10} />
                {format(parseISO(task.due_date), 'MMM d')}
                {isOverdue && ' · overdue'}
              </span>
            )}
          </div>
        </div>
        <span className={`badge status-${task.status}`}>{STATUS_LABEL[task.status]}</span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/stats/dashboard')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" style={{ width: '32px', height: '32px' }} />
    </div>
  );

  const { stats, recentTasks } = data || {};

  return (
    <div style={{ padding: '36px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '36px', animation: 'fadeInUp 0.4s ease' }}>
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '6px' }}>{greeting} ✦</p>
        <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em' }}>{user?.name?.split(' ')[0]}'s Workspace</h1>
        <p style={{ color: 'var(--text-2)', marginTop: '6px' }}>Here's what's happening across your projects today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px', animation: 'fadeInUp 0.5s ease' }}>
        <StatCard icon={CheckSquare} label="Total Tasks" value={stats?.total} color="var(--accent)" sub="across all projects" />
        <StatCard icon={TrendingUp} label="In Progress" value={stats?.in_progress} color="var(--cyan)" sub="actively working" />
        <StatCard icon={Zap} label="Completed" value={stats?.done} color="var(--green)" sub="well done!" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdue} color="var(--red)" sub="needs attention" />
      </div>

      <div style={{ animation: 'fadeInUp 0.6s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Upcoming Tasks</h2>
          <Link to="/tasks" className="btn btn-ghost btn-sm" style={{ gap: '5px' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentTasks?.length === 0 && (
          <div className="empty-state">
            <CheckSquare size={40} />
            <h3>All caught up!</h3>
            <p>No pending tasks. Create a project to get started.</p>
          </div>
        )}

        {recentTasks?.map(task => <TaskRow key={task.id} task={task} />)}
      </div>
    </div>
  );
}
