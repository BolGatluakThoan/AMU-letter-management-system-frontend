const router = require('express').Router();
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(500);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
