const router      = require('express').Router();
const ChatMessage = require('../models/ChatMessage');
const auth        = require('../middleware/auth');

// GET /api/chat — conversations list + unread counts
router.get('/', auth, async (req, res) => {
  try {
    const me   = req.user.id;
    const msgs = await ChatMessage.find({ $or: [{ from: me }, { to: me }] }).sort({ createdAt: -1 });
    const map  = {};
    msgs.forEach(m => {
      const other = String(m.from) === String(me) ? String(m.to) : String(m.from);
      if (!map[other]) map[other] = { latest: m, unread: 0 };
      if (String(m.to) === String(me) && !m.readAt && !m.deleted) map[other].unread++;
    });
    res.json(map);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/chat/:userId — full conversation, marks received msgs as read
router.get('/:userId', auth, async (req, res) => {
  try {
    const me    = req.user.id;
    const other = req.params.userId;
    const msgs  = await ChatMessage.find({
      $or: [{ from: me, to: other }, { from: other, to: me }],
    }).sort({ createdAt: 1 });
    await ChatMessage.updateMany({ from: other, to: me, readAt: null }, { readAt: new Date() });
    res.json(msgs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/chat/:userId — send message
router.post('/:userId', auth, async (req, res) => {
  try {
    const msg = await ChatMessage.create({
      from:    req.user.id,
      to:      req.params.userId,
      text:    req.body.text,
      replyTo: req.body.replyTo || null,
    });
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/chat/msg/:id — edit message (sender only)
router.put('/msg/:id', auth, async (req, res) => {
  try {
    const msg = await ChatMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (String(msg.from) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
    msg.text     = req.body.text;
    msg.editedAt = new Date();
    await msg.save();
    res.json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/chat/msg/:id — soft delete (sender only)
router.delete('/msg/:id', auth, async (req, res) => {
  try {
    const msg = await ChatMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (String(msg.from) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
    msg.deleted = true;
    await msg.save();
    res.json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/chat/msg/:id/react — toggle reaction (same emoji = remove)
router.post('/msg/:id/react', auth, async (req, res) => {
  try {
    const msg = await ChatMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    const { emoji } = req.body;
    const uid = String(req.user.id);
    const current = msg.reactions.get(uid);
    // same emoji clicked again → remove; different or new → set
    if (current === emoji) msg.reactions.delete(uid);
    else if (emoji)        msg.reactions.set(uid, emoji);
    else                   msg.reactions.delete(uid);
    await msg.save();
    res.json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
