const router = require('express').Router();
const ReceivedLetter = require('../models/ReceivedLetter');
const auth = require('../middleware/auth');

// POST /api/inbox — create a record directly (upsert — never duplicate)
router.post('/', auth, async (req, res) => {
  try {
    const { userId, letterId } = req.body;
    if (!userId || !letterId) return res.status(400).json({ message: 'userId and letterId required' });
    // findOneAndUpdate with upsert — atomic, no duplicates
    const record = await ReceivedLetter.findOneAndUpdate(
      { userId, letterId },
      { $setOnInsert: { userId, letterId, isRead: false } },
      { upsert: true, new: true }
    );
    res.status(201).json(record);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/inbox/cleanup — remove duplicate records for current user
router.post('/cleanup', auth, async (req, res) => {
  try {
    // For Record Officer: clean all users. For others: clean only their own.
    const filter = req.user.role === 'Record Officer' ? {} : { userId: req.user.id };
    const all = await ReceivedLetter.find(filter).sort({ createdAt: 1 });
    const seen = new Map();
    const toDelete = [];
    for (const r of all) {
      const key = `${r.userId}-${r.letterId}`;
      if (seen.has(key)) toDelete.push(r._id);
      else seen.set(key, r._id);
    }
    if (toDelete.length > 0) {
      await ReceivedLetter.deleteMany({ _id: { $in: toDelete } });
    }
    res.json({ removed: toDelete.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/inbox — returns authenticated user's received letters (skip orphaned records)
router.get('/', auth, async (req, res) => {
  try {
    const records = await ReceivedLetter.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('letterId', 'refNo subject sender senderOrg priority attachments remarks dateReceived mode department fromOffice toOffice');
    // Filter out records where the letter was permanently deleted
    const valid = records.filter(r => r.letterId != null);
    res.json(valid);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/inbox/all — Record Officer only: all inbox records for tracking/reporting
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Record Officer') return res.status(403).json({ message: 'Record Officer only' });
    const records = await ReceivedLetter.find()
      .sort({ createdAt: -1 })
      .populate('letterId', 'refNo subject sender senderOrg priority attachments remarks dateReceived mode department')
      .populate('userId', 'name office');
    const valid = records.filter(r => r.letterId != null);
    res.json(valid);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/inbox/:id/read — mark as read (owner only)
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const record = await ReceivedLetter.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Not found' });
    if (String(record.userId) !== String(req.user.id))
      return res.status(403).json({ message: 'Forbidden' });
    record.isRead = true;
    await record.save();
    res.json(record);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
