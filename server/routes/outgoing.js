const router = require('express').Router();
const OutgoingLetter = require('../models/OutgoingLetter');
const IncomingLetter = require('../models/IncomingLetter');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');

const log = (action, refNo, type, user) =>
  AuditLog.create({ action, refNo, type, by: user.name, office: user.office });

// GET all
router.get('/', auth, async (req, res) => {
  try {
    const letters = await OutgoingLetter.find();
    res.json(letters);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /deleted — all soft-deleted letters
// Record Officer: sees all; others: sees only their own deletions
router.get('/deleted', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'Record Officer'
      ? { deleted: true }
      : { deleted: true, deletedByName: req.user.name };
    const letters = await OutgoingLetter.find(filter).sort({ deletedAt: -1 });
    res.json(letters);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create
router.post('/', auth, async (req, res) => {
  try {
    // Use timestamp + random to guarantee uniqueness
    const ts = Date.now();
    const rand = String(Math.floor(Math.random() * 900) + 100);
    const refNo = `OUT-2026-${ts}-${rand}`;
    const attachments = (req.body.attachments || []).map(a => ({ name: a.name, size: a.size, type: a.type, url: a.url || '', filename: a.filename || '' }));
    const letter = new OutgoingLetter({ ...req.body, attachments, refNo, fromOffice: req.user.office });
    await letter.save();

    // Always create an incoming entry in Record Office for routing
    const inTs = Date.now();
    const inRand = String(Math.floor(Math.random() * 900) + 100);
    const inRef = `INC-2026-${inTs}-${inRand}`;
    await IncomingLetter.create({
      refNo: inRef,
      sender: req.user.name,
      senderOrg: req.user.office,
      subject: req.body.subject,
      department: 'Record Office',
      priority: req.body.priority || 'Normal',
      mode: req.body.dispatchMethod || 'Internal',
      dateReceived: req.body.datePrepared || new Date().toISOString().slice(0, 10),
      status: 'Registered',
      remarks: `Outgoing letter prepared by ${req.user.office}. To be dispatched to: ${req.body.toOffice || req.body.recipient || 'External'}${req.body.recipientOrg ? ' (' + req.body.recipientOrg + ')' : ''}. Ref: ${refNo}`,
      fromOffice: req.user.office,
      toOffice: 'Record Office',
      linkedOutRef: refNo,
      autoDelivered: false,
      intendedFor: req.body.toOffice || req.body.recipient || '',
      attachments: attachments,   // carry attachments so Record Office can see the document
      readBy: [],
    });
    res.status(201).json(letter);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update
router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.attachments) {
      data.attachments = data.attachments.map(a => ({ name: a.name, size: a.size, type: a.type, url: a.url || '', filename: a.filename || '' }));
    }
    const letter = await OutgoingLetter.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(letter);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE (soft)
router.delete('/:id', auth, async (req, res) => {
  try {
    const letter = await OutgoingLetter.findByIdAndUpdate(
      req.params.id,
      { $set: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.office,
        deletedByName: req.user.name,
        deletedByRole: req.user.role || '',
      }},
      { new: true }
    );
    await log('deleted', letter.refNo, 'outgoing', req.user);
    res.json(letter);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST restore
router.post('/:id/restore', auth, async (req, res) => {
  try {
    const letter = await OutgoingLetter.findByIdAndUpdate(req.params.id, {
      deleted: false, deletedAt: null, deletedBy: null, deletedByName: null,
    }, { new: true });
    await log('restored', letter.refNo, 'outgoing', req.user);
    res.json(letter);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE permanent
router.delete('/:id/permanent', auth, async (req, res) => {
  try {
    const letter = await OutgoingLetter.findById(req.params.id);
    if (letter) await log('permanently deleted', letter.refNo, 'outgoing', req.user);
    await OutgoingLetter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Permanently deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
