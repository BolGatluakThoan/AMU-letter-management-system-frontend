const router = require('express').Router();
const Office = require('../models/Office');
const auth = require('../middleware/auth');

// GET all active offices
router.get('/', auth, async (req, res) => {
  try {
    const offices = await Office.find({ active: true }).sort({ name: 1 });
    res.json(offices);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create (Record Officer only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Record Officer') return res.status(403).json({ message: 'Record Officer only' });
    const office = await Office.create({ name: req.body.name.trim(), description: req.body.description || '' });
    res.status(201).json(office);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update (Record Officer only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Record Officer') return res.status(403).json({ message: 'Record Officer only' });
    const office = await Office.findByIdAndUpdate(req.params.id, { name: req.body.name, description: req.body.description }, { new: true });
    res.json(office);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE (Record Officer only — soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Record Officer') return res.status(403).json({ message: 'Record Officer only' });
    await Office.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Office deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
