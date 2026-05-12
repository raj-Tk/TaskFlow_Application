import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/Layout';
import TaskModal from '../components/TaskModal';
import {
  Plus, ArrowLeft, Users, UserPlus, X, Trash2,
  MoreHorizontal, Calendar, ChevronDown
} from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'var(--text-2)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--cyan)' },
  { key: 'review', label: 'Review', color: 'var(--yellow)' },
  { key: 'done', label: 'Done', color: 'var(--green)' },
];

const PRIORITY_DOT = {
  low: 'var(--text-2)', medium: 'var(--accent)', high: 'var(--orange)', urgent: 'var(--red)'
};

function TaskCard({ task, onClick, onDelete }) {
  const isOverdue = task.due_date && task.status !== 'done' && isAfter(new Date(), parseISO(task.due_date));

  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px',
      padding: '14px', cursor: 'pointer', transition: 'var(--transition)',
      position: 'relative', animation: 'fadeInUp 0.25s ease'
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: PRIORITY_DOT[task.priority], flexShrink: 0 }} />
          <p style={{ fontWeight: '600', fontSize: '14px', lineHeight: '1.4' }}>{task.title}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(task); }} className="btn btn-ghost btn-icon" style={{ padding: '3px', opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          ref={el => { if (el) el.closest('[data-card]')?.addEventListener('mouseenter', () => el.style.opacity = '1'); if (el) el.closest('[data-card]')?.addEventListener('mouseleave', () => el.style.opacity = '0'); }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {task.description && (
        <p style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {task.due_date ? (
          <span style={{ fontSize: '11px', color: isOverdue ? 'var(--red)' : 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '5px', background: isOverdue ? 'var(--red-dim)' : 'var(--bg-4)' }}>
            <Calendar size={10} />
            {format(parseISO(task.due_date), 'MMM d')}
          </span>
        ) : <span />}

        {task.assignee_name && (
          <div className="avatar" style={{ width: '22px', height: '22px', background: task.assignee_color || '#6366f1', fontSize: '9px' }}>
            {task.assignee_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdd }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, { email, role });
      toast.success('Member added!');
      onAdd(data.member);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>Add Member</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="member@example.com" autoFocus />
            <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '5px' }}>User must already have an account.</p>
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(null); // null | 'create' | task
  const [showAddMember, setShowAddMember] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState('todo');

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/tasks/project/${projectId}`)
    ]).then(([pRes, tRes]) => {
      setProject(pRes.data.project);
      setMembers(pRes.data.members);
      setTasks(tRes.data.tasks);
    }).catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [projectId]);

  function openCreateTask(status = 'todo') {
    setDefaultStatus(status);
    setShowTaskModal('create');
  }

  async function handleDeleteTask(task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks(ts => ts.filter(t => t.id !== task.id));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  }

  async function handleRemoveMember(memberId) {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
      setMembers(ms => ms.filter(m => m.id !== memberId));
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" style={{ width: '28px', height: '28px' }} />
    </div>
  );

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  const myRole = members.find(m => m.id === user.id)?.role;
  const canManage = myRole === 'admin' || isAdmin;

  return (
    <div style={{ padding: '28px 36px', minHeight: '100vh' }}>
      <div style={{ marginBottom: '28px', animation: 'fadeInUp 0.35s ease' }}>
        <Link to="/projects" style={{ color: 'var(--text-2)', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '16px' }}>
          <ArrowLeft size={13} /> Projects
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${project?.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${project?.color}40` }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: project?.color }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>{project?.name}</h1>
              {project?.description && <p style={{ color: 'var(--text-2)', fontSize: '14px', marginTop: '2px' }}>{project.description}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {members.slice(0, 4).map((m, i) => (
                <div key={m.id} style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: members.length - i }}>
                  <div className="avatar" title={`${m.name} (${m.role})`} style={{ width: '32px', height: '32px', background: m.avatar_color || '#6366f1', border: '2px solid var(--bg)', fontSize: '11px' }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              ))}
              {members.length > 4 && <span style={{ marginLeft: '6px', fontSize: '12px', color: 'var(--text-2)' }}>+{members.length - 4}</span>}
            </div>

            {canManage && (
              <>
                <button onClick={() => setShowAddMember(true)} className="btn btn-ghost btn-sm"><UserPlus size={14} /> Add Member</button>
                <button onClick={() => openCreateTask()} className="btn btn-primary btn-sm"><Plus size={14} /> Add Task</button>
              </>
            )}
          </div>
        </div>

        {members.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px 4px 5px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '99px', fontSize: '12px' }}>
                <div className="avatar" style={{ width: '20px', height: '20px', background: m.avatar_color || '#6366f1', fontSize: '8px' }}>{m.name.charAt(0).toUpperCase()}</div>
                <span style={{ fontWeight: '500' }}>{m.name}</span>
                <span style={{ color: 'var(--text-2)', textTransform: 'capitalize', fontSize: '11px' }}>· {m.role}</span>
                {canManage && m.id !== user.id && (
                  <button onClick={() => handleRemoveMember(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '0 2px', display: 'flex', lineHeight: 1 }}>
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', minWidth: '900px', overflowX: 'auto' }}>
        {COLUMNS.map(col => (
          <div key={col.key} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                <span style={{ fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.label}</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-2)', background: 'var(--bg-4)', padding: '2px 7px', borderRadius: '5px', fontWeight: '600' }}>
                {tasksByStatus[col.key]?.length || 0}
              </span>
            </div>

            {tasksByStatus[col.key]?.map(task => (
              <div key={task.id} data-card>
                <TaskCard
                  task={task}
                  onClick={() => setShowTaskModal(task)}
                  onDelete={handleDeleteTask}
                />
              </div>
            ))}

            {canManage && (
              <button onClick={() => openCreateTask(col.key)} style={{ background: 'none', border: '1.5px dashed var(--border)', borderRadius: '10px', color: 'var(--text-2)', cursor: 'pointer', padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'var(--transition)', marginTop: 'auto' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = col.color; e.currentTarget.style.color = col.color; e.currentTarget.style.background = `${col.color}10`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'none'; }}
              >
                <Plus size={14} /> Add task
              </button>
            )}
          </div>
        ))}
      </div>

      {showTaskModal && (
        <TaskModal
          task={showTaskModal !== 'create' ? showTaskModal : null}
          projectId={parseInt(projectId)}
          members={members}
          onClose={() => setShowTaskModal(null)}
          onSave={savedTask => {
            if (showTaskModal === 'create') {
              setTasks(ts => [savedTask, ...ts]);
            } else {
              setTasks(ts => ts.map(t => t.id === savedTask.id ? savedTask : t));
            }
            setShowTaskModal(null);
          }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddMember(false)}
          onAdd={m => { setMembers(ms => [...ms, m]); setShowAddMember(false); }}
        />
      )}
    </div>
  );
}
