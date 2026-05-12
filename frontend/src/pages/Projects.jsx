import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Plus, FolderKanban, X, CheckSquare, Users, ArrowRight, Archive } from 'lucide-react';

const PROJECT_COLORS = ['#7c6af7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];

function ProjectCard({ project, onArchive }) {
  const progress = project.task_count > 0 ? Math.round((project.done_count / project.task_count) * 100) : 0;
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden', animation: 'fadeInUp 0.35s ease' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: project.color }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${project.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderKanban size={18} color={project.color} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{project.name}</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-2)' }}>by {project.owner_name}</p>
          </div>
        </div>
        <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '99px', background: project.status === 'active' ? 'var(--green-dim)' : 'var(--bg-4)', color: project.status === 'active' ? 'var(--green)' : 'var(--text-2)', fontWeight: '600', border: `1px solid ${project.status === 'active' ? 'rgba(74,222,128,0.2)' : 'var(--border)'}` }}>
          {project.status}
        </span>
      </div>

      {project.description && (
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.description}</p>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{project.done_count}/{project.task_count} tasks</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: project.color }}>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: project.color }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-2)', fontSize: '12px' }}>
          <Users size={12} />
          <span>{project.member_count} member{project.member_count !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => onArchive(project)} className="btn btn-ghost btn-sm btn-icon" title={project.status === 'active' ? 'Archive' : 'Restore'} style={{ padding: '5px' }}>
            <Archive size={13} />
          </button>
          <Link to={`/projects/${project.id}`} className="btn btn-sm" style={{ background: `${project.color}20`, color: project.color, border: `1px solid ${project.color}30`, gap: '5px' }}>
            Open <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function CreateProjectModal({ onClose, onCreate }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', description: '', color: '#7c6af7' });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name required');
    setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      toast.success('Project created!');
      onCreate(data.project);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>New Project</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="label">Project Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Website Redesign" autoFocus />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What's this project about?" rows={3} />
          </div>
          <div className="form-group">
            <label className="label">Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PROJECT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: '30px', height: '30px', borderRadius: '8px', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px', transition: 'var(--transition)' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false));
  }, []);

  async function handleArchive(project) {
    const newStatus = project.status === 'active' ? 'archived' : 'active';
    try {
      await api.put(`/projects/${project.id}`, { status: newStatus });
      setProjects(ps => ps.map(p => p.id === project.id ? { ...p, status: newStatus } : p));
      toast.success(`Project ${newStatus === 'archived' ? 'archived' : 'restored'}`);
    } catch {
      toast.error('Failed to update project');
    }
  }

  const active = projects.filter(p => p.status === 'active');
  const archived = projects.filter(p => p.status === 'archived');

  return (
    <div style={{ padding: '36px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>Projects</h1>
          <p style={{ color: 'var(--text-2)', marginTop: '4px', fontSize: '14px' }}>{active.length} active project{active.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          <Plus size={16} /> New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '28px', height: '28px' }} />
        </div>
      ) : active.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} />
          <h3>No projects yet</h3>
          <p>Create your first project and start organizing tasks.</p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ marginTop: '8px' }}>
            <Plus size={15} /> Create Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {active.map(p => <ProjectCard key={p.id} project={p} onArchive={handleArchive} />)}
        </div>
      )}

      {archived.length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Archive size={15} /> Archived ({archived.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', opacity: 0.6 }}>
            {archived.map(p => <ProjectCard key={p.id} project={p} onArchive={handleArchive} />)}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={p => { setProjects(ps => [p, ...ps]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
