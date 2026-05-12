import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../context/ToastContext';
import TaskModal from '../components/TaskModal';
import { CheckSquare, Filter, Calendar, ArrowUpRight, Trash2 } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_COLOR = { low: 'var(--text-2)', medium: 'var(--accent)', high: 'var(--orange)', urgent: 'var(--red)' };
const PRIORITY_BG = { low: 'var(--bg-4)', medium: 'var(--accent-dim)', high: 'var(--orange-dim)', urgent: 'var(--red-dim)' };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', assignee: '' });
  const [editTask, setEditTask] = useState(null);
  const toast = useToast();

  async function load() {
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.priority) params.append('priority', filter.priority);
    if (filter.assignee) params.append('assignee', filter.assignee);
    const { data } = await api.get(`/tasks?${params}`);
    setTasks(data.tasks);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function handleDelete(task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks(ts => ts.filter(t => t.id !== task.id));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete');
    }
  }

  async function handleStatusChange(task, status) {
    try {
      const { data } = await api.put(`/tasks/${task.id}`, { status });
      setTasks(ts => ts.map(t => t.id === task.id ? data.task : t));
    } catch {
      toast.error('Failed to update status');
    }
  }

  const grouped = tasks.reduce((acc, t) => {
    if (!acc[t.status]) acc[t.status] = [];
    acc[t.status].push(t);
    return acc;
  }, {});

  const statusOrder = ['todo', 'in_progress', 'review', 'done'];

  return (
    <div style={{ padding: '36px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px', animation: 'fadeInUp 0.35s ease' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>All Tasks</h1>
        <p style={{ color: 'var(--text-2)', marginTop: '4px', fontSize: '14px' }}>{tasks.length} tasks across your projects</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap', animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)', fontSize: '13px', fontWeight: '600' }}>
          <Filter size={14} /> Filters:
        </div>
        <select className="input" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ width: 'auto', padding: '7px 30px 7px 12px' }}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select className="input" value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))} style={{ width: 'auto', padding: '7px 30px 7px 12px' }}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select className="input" value={filter.assignee} onChange={e => setFilter(f => ({ ...f, assignee: e.target.value }))} style={{ width: 'auto', padding: '7px 30px 7px 12px' }}>
          <option value="">All Assignees</option>
          <option value="me">Assigned to Me</option>
        </select>
        {(filter.status || filter.priority || filter.assignee) && (
          <button onClick={() => setFilter({ status: '', priority: '', assignee: '' })} className="btn btn-ghost btn-sm">Clear</button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '28px', height: '28px' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={44} />
          <h3>No tasks found</h3>
          <p>Tasks you can access will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeInUp 0.45s ease' }}>
          {statusOrder.map(status => {
            const group = grouped[status];
            if (!group?.length) return null;
            return (
              <div key={status}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className={`badge status-${status}`}>{STATUS_LABEL[status]}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{group.length} task{group.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.map(task => {
                    const isOverdue = task.due_date && task.status !== 'done' && isAfter(new Date(), parseISO(task.due_date));
                    return (
                      <div key={task.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'var(--transition)' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '5px', background: `${task.project_color}18`, color: task.project_color, fontWeight: '600' }}>{task.project_name}</span>
                            {task.assignee_name && <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>→ {task.assignee_name}</span>}
                            {task.due_date && (
                              <span style={{ fontSize: '11px', color: isOverdue ? 'var(--red)' : 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Calendar size={10} /> {format(parseISO(task.due_date), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                          <select
                            value={task.status}
                            onChange={e => handleStatusChange(task, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="input"
                            style={{ padding: '4px 26px 4px 9px', fontSize: '12px', width: 'auto' }}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                          <button onClick={() => setEditTask(task)} className="btn btn-ghost btn-icon btn-sm"><ArrowUpRight size={14} /></button>
                          <button onClick={() => handleDelete(task)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red)' }}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editTask && (
        <TaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSave={saved => {
            setTasks(ts => ts.map(t => t.id === saved.id ? saved : t));
            setEditTask(null);
          }}
        />
      )}
    </div>
  );
}
