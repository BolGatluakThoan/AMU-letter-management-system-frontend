const router = require('express').Router();
const Department = require('../models/Department');
const auth = require('../middleware/auth');

// GET all active departments
router.get('/', auth, async (req, res) => {
  try {
    const depts = await Department.find({ active: true }).sort({ name: 1 });
    res.json(depts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create (Record Officer only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Record Officer') return res.status(403).json({ message: 'Record Officer only' });
    const dept = await Department.create({ name: req.body.name.trim(), office: req.body.office || '', description: req.body.description || '' });
    res.status(201).json(dept);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update (Record Officer only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Record Officer') return res.status(403).json({ message: 'Record Officer only' });
    const dept = await Department.findByIdAndUpdate(req.params.id, { name: req.body.name, office: req.body.office, description: req.body.description }, { new: true });
    res.json(dept);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE (Record Officer only — soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Record Officer') return res.status(403).json({ message: 'Record Officer only' });
    await Department.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Department deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
