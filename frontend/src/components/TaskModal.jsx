import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { X, Loader } from 'lucide-react';

const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

export default function TaskModal({ task, projectId, members = [], onClose, onSave }) {
  const isEdit = !!task;
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee_id: task?.assignee_id || '',
    due_date: task?.due_date || '',
    project_id: task?.project_id || projectId || '',
  });

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null,
        project_id: parseInt(form.project_id),
        due_date: form.due_date || null,
      };
      let data;
      if (isEdit) {
        ({ data } = await api.put(`/tasks/${task.id}`, payload));
      } else {
        ({ data } = await api.post('/tasks', payload));
      }
      toast.success(isEdit ? 'Task updated' : 'Task created');
      onSave(data.task);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input" name="title" value={form.title} onChange={handle} placeholder="What needs to be done?" autoFocus />
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" name="description" value={form.description} onChange={handle} placeholder="Add more details..." rows={3} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" name="status" value={form.status} onChange={handle}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="input" name="priority" value={form.priority} onChange={handle}>
                {PRIORITIES.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="label">Assignee</label>
              <select className="input" name="assignee_id" value={form.assignee_id} onChange={handle}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input className="input" type="date" name="due_date" value={form.due_date} onChange={handle} style={{ colorScheme: 'dark' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader size={15} className="spinning" /> : null}
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
