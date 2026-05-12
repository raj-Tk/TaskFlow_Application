const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => {
  const db = getDb();
  const { status, priority, assignee } = req.query;

  let query = `
    SELECT t.*, p.name as project_name, p.color as project_color,
      u.name as assignee_name, u.avatar_color as assignee_color,
      c.name as creator_name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.created_by
    WHERE 1=1
  `;
  const params = [req.user.id];

  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (assignee === 'me') { query += ' AND t.assignee_id = ?'; params.push(req.user.id); }

  query += ' ORDER BY t.due_date ASC, t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  res.json({ tasks });
});

router.get('/project/:projectId', requireProjectAccess, (req, res) => {
  const db = getDb();
  const tasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color,
      c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.created_by
    WHERE t.project_id = ?
    ORDER BY t.due_date ASC, t.created_at DESC
  `).all(req.params.projectId);

  res.json({ tasks });
});

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('project_id').isInt().withMessage('Valid project ID required'),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('assignee_id').optional().isInt(),
  body('due_date').optional().isDate()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const db = getDb();
  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(req.body.project_id, req.user.id);
  if (!member && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { title, description, project_id, assignee_id, status = 'todo', priority = 'medium', due_date } = req.body;
  const result = db.prepare(`
    INSERT INTO tasks (title, description, project_id, assignee_id, created_by, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, project_id, assignee_id || null, req.user.id, status, priority, due_date || null);

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.created_by
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ task });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { title, description, assignee_id, status, priority, due_date } = req.body;
  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      assignee_id = CASE WHEN ? IS NOT NULL THEN ? ELSE assignee_id END,
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      due_date = COALESCE(?, due_date)
    WHERE id = ?
  `).run(title, description, assignee_id, assignee_id, status, priority, due_date, req.params.id);

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.created_by
    WHERE t.id = ?
  `).get(req.params.id);

  res.json({ task: updated });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

router.get('/stats/dashboard', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN t.due_date < ? AND t.status != 'done' THEN 1 ELSE 0 END) as overdue,
      SUM(CASE WHEN t.assignee_id = ? THEN 1 ELSE 0 END) as assigned_to_me
    FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
  `).get(today, req.user.id, req.user.id);

  const recentTasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color,
      u.name as assignee_name, u.avatar_color as assignee_color
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    LEFT JOIN users u ON u.id = t.assignee_id
    WHERE t.status != 'done'
    ORDER BY t.due_date ASC, t.updated_at DESC
    LIMIT 8
  `).all(req.user.id);

  res.json({ stats, recentTasks });
});

module.exports = router;
