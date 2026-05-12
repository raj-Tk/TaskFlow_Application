const router = require('express').Router();
const { getDb } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, name, email, role, avatar_color, created_at FROM users ORDER BY name').all();
  res.json({ users });
});

router.put('/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const db = getDb();
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ message: 'Role updated' });
});

module.exports = router;
