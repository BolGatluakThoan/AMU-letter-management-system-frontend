const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET all users (Record Officer sees all, others see own office)
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'Record Officer' ? {} : { office: req.user.office };
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/users/directory — all users for chat (name, role, office only)
router.get('/directory', auth, async (req, res) => {
  try {
    const users = await User.find({}).select('name role office avatar');
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST add user — only Record Officer, Deans, Directors
router.post('/', auth, async (req, res) => {
  try {
    const allowed = ['Record Officer', 'Dean', 'Director'];
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: 'Not authorized to add users' });
    const user = new User(req.body);
    await user.save();
    const u = user.toObject(); delete u.password;
    res.status(201).json(u);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update user
router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.password) {
      const bcrypt = require('bcryptjs');
      data.password = await bcrypt.hash(data.password, 10);
    } else { delete data.password; }
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST /api/users/:id/reset-password — admin or canResetPassword only
router.post('/:id/reset-password', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'Record Officer';
    if (!isAdmin && !req.user.canResetPassword)
      return res.status(403).json({ message: 'Not authorized to reset passwords' });
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let plain = '';
    for (let i = 0; i < 8; i++) plain += chars[Math.floor(Math.random() * chars.length)];
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(plain, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashed, mustChangePassword: true });
    res.json({ password: plain });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE user
router.delete('/:id', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
