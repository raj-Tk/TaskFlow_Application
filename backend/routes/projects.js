const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => {
  const db = getDb();
  if (req.user.role === 'admin') {
    const projects = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON u.id = p.owner_id
      ORDER BY p.created_at DESC
    `).all();
    return res.json({ projects });
  }
  else {
  const projects = db.prepare(`
    SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
      (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count,
      pm.role as my_role
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.owner_id
    ORDER BY p.created_at DESC
  `).all(req.user.id);

  res.json({ projects });
  }
});

router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('description').optional().trim(),
  body('color').optional()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, color = '#6366f1' } = req.body;
  const db = getDb();

  const result = db.prepare(
    'INSERT INTO projects (name, description, owner_id, color) VALUES (?, ?, ?, ?)'
  ).run(name, description, req.user.id, color);

  db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  ).run(result.lastInsertRowid, req.user.id, 'admin');

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ project });
});

router.get('/:projectId', requireProjectAccess, (req, res) => {
  const db = getDb();
  const project = db.prepare(`
    SELECT p.*, u.name as owner_name
    FROM projects p JOIN users u ON u.id = p.owner_id
    WHERE p.id = ?
  `).get(req.params.projectId);

  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar_color, pm.role
    FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `).all(req.params.projectId);

  res.json({ project, members });
});

router.put('/:projectId', requireProjectAccess, [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'archived']),
  body('color').optional()
], (req, res) => {
  if (req.projectRole !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only project admins can edit projects' });
  }

  const db = getDb();
  const { name, description, status, color } = req.body;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      color = COALESCE(?, color)
    WHERE id = ?
  `).run(name, description, status, color, req.params.projectId);

  res.json({ project: db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId) });
});

router.delete('/:projectId', requireProjectAccess, (req, res) => {
  if (req.projectRole !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only project admins can delete projects' });
  }
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.projectId);
  res.json({ message: 'Project deleted' });
});

router.post('/:projectId/members', requireProjectAccess, [
  body('email').isEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['admin', 'member'])
], (req, res) => {
  if (req.projectRole !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only project admins can add members' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const db = getDb();
  const { email, role = 'member' } = req.body;

  const user = db.prepare('SELECT id, name, email, avatar_color FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found. They must register first.' });

  const existing = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.projectId, user.id);
  if (existing) return res.status(409).json({ error: 'User already in project' });

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(req.params.projectId, user.id, role);
  res.status(201).json({ member: { ...user, role } });
});

router.delete('/:projectId/members/:userId', requireProjectAccess, (req, res) => {
  if (req.projectRole !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only project admins can remove members' });
  }
  const db = getDb();
  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.projectId, req.params.userId);
  res.json({ message: 'Member removed' });
});

module.exports = router;
