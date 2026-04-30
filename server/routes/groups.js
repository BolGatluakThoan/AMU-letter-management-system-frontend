const router      = require('express').Router();
const ChatGroup   = require('../models/ChatGroup');
const ChatMessage = require('../models/ChatMessage');
const auth        = require('../middleware/auth');

// GET all groups I belong to — includes unread count per group
router.get('/', auth, async (req, res) => {
  try {
    const groups = await ChatGroup.find({ members: req.user.id })
      .populate('members', 'name role office avatar')
      .populate('admins',  'name role office avatar')
      .sort({ updatedAt: -1 });

    // Attach unread count for each group
    const withUnread = await Promise.all(groups.map(async (g) => {
      const unread = await ChatMessage.countDocuments({
        groupId: g._id,
        from: { $ne: req.user.id },
        deleted: false,
        readBy: { $ne: req.user.id },
      });
      return { ...g.toObject(), unread };
    }));

    res.json(withUnread);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create group
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Group name is required' });
    const members = [...new Set([req.user.id, ...(memberIds || [])])];
    const group = await ChatGroup.create({
      name: name.trim(),
      description: description || '',
      members,
      admins: [req.user.id],
      monitors: [],
      createdBy: req.user.id,
    });
    const populated = await group.populate('members', 'name role office avatar');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update group (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const group = await ChatGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isAdmin = group.admins.map(String).includes(String(req.user.id));
    if (!isAdmin) return res.status(403).json({ message: 'Only group admins can update' });
    const { name, description } = req.body;
    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description;
    await group.save();
    res.json(group);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST add member (admin only)
router.post('/:id/members', auth, async (req, res) => {
  try {
    const group = await ChatGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isAdmin = group.admins.map(String).includes(String(req.user.id));
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can add members' });
    const { userId } = req.body;
    if (!group.members.map(String).includes(String(userId))) {
      group.members.push(userId);
      await group.save();
    }
    const populated = await group.populate('members', 'name role office avatar');
    res.json(populated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE remove member (admin only, or self-leave)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const group = await ChatGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isAdmin = group.admins.map(String).includes(String(req.user.id));
    const isSelf  = String(req.params.userId) === String(req.user.id);
    if (!isAdmin && !isSelf) return res.status(403).json({ message: 'Not authorized' });
    group.members = group.members.filter(m => String(m) !== String(req.params.userId));
    group.admins  = group.admins.filter(m => String(m) !== String(req.params.userId));
    await group.save();
    res.json({ message: 'Removed' });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE group (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await ChatGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isAdmin = group.admins.map(String).includes(String(req.user.id));
    if (!isAdmin) return res.status(403).json({ message: 'Only group admins can delete the group' });
    await ChatMessage.deleteMany({ groupId: req.params.id });
    await ChatGroup.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST assign admin role
router.post('/:id/admins', auth, async (req, res) => {
  try {
    const group = await ChatGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isAdmin = group.admins.map(String).includes(String(req.user.id));
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can assign roles' });
    const { userId } = req.body;
    if (!group.admins.map(String).includes(String(userId))) group.admins.push(userId);
    await group.save();
    res.json(group);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// GET group messages
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const group = await ChatGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isMember = group.members.map(String).includes(String(req.user.id));
    if (!isMember) return res.status(403).json({ message: 'Not a member' });
    const msgs = await ChatMessage.find({ groupId: req.params.id }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST send group message
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const group = await ChatGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isMember = group.members.map(String).includes(String(req.user.id));
    if (!isMember) return res.status(403).json({ message: 'Not a member' });
    const msg = await ChatMessage.create({
      from:    req.user.id,
      to:      null,
      groupId: req.params.id,
      text:    req.body.text,
      replyTo: req.body.replyTo || null,
      readBy:  [req.user.id],  // sender has already "read" their own message
    });
    // Bump group updatedAt so it sorts to top
    await ChatGroup.findByIdAndUpdate(req.params.id, { updatedAt: new Date() });
    res.status(201).json(msg);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST mark all group messages as read for current user
router.post('/:id/read', auth, async (req, res) => {
  try {
    await ChatMessage.updateMany(
      { groupId: req.params.id, readBy: { $ne: req.user.id }, deleted: false },
      { $addToSet: { readBy: req.user.id } }
    );
    res.json({ message: 'Marked read' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
