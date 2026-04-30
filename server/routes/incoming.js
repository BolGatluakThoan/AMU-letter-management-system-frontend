const router = require('express').Router();
const IncomingLetter = require('../models/IncomingLetter');
const AuditLog = require('../models/AuditLog');
const ReceivedLetter = require('../models/ReceivedLetter');
const User = require('../models/User');
const auth = require('../middleware/auth');

const log = (action, refNo, type, user) =>
  AuditLog.create({ action, refNo, type, by: user.name, office: user.office });

// GET all
router.get('/', auth, async (req, res) => {
  try {
    const letters = await IncomingLetter.find();
    res.json(letters);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /deleted — all soft-deleted letters
// Record Officer: sees all; others: sees only their own deletions
router.get('/deleted', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'Record Officer'
      ? { deleted: { $eq: true } }
      : { deleted: { $eq: true }, deletedByName: req.user.name };
    const letters = await IncomingLetter.find(filter).sort({ deletedAt: -1 });
    res.json(letters);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create
router.post('/', auth, async (req, res) => {
  try {
    const ts = Date.now();
    const rand = String(Math.floor(Math.random() * 900) + 100);
    const year = new Date().getFullYear();
    const refNo = `INC-${year}-${ts}-${rand}`;
    // Preserve url/filename so receivers can view/download attachments
    const attachments = (req.body.attachments || []).map(a => ({
      name: a.name, size: a.size, type: a.type, url: a.url || '', filename: a.filename || ''
    }));
    const letter = new IncomingLetter({ ...req.body, attachments, refNo, fromOffice: req.user.office, readBy: [] });
    await letter.save();
    res.status(201).json(letter);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update
router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.attachments) {
      data.attachments = data.attachments.map(a => ({
        name: a.name, size: a.size, type: a.type, url: a.url || '', filename: a.filename || ''
      }));
    }
    const letter = await IncomingLetter.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(letter);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE (soft)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only Record Officer can soft-delete incoming letters
    if (req.user.role !== 'Record Officer') {
      return res.status(403).json({ message: 'Only the Record Officer can delete incoming letters.' });
    }
    const letter = await IncomingLetter.findByIdAndUpdate(
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
    if (!letter) return res.status(404).json({ message: 'Letter not found' });
    await log('deleted', letter.refNo, 'incoming', req.user);
    res.json(letter);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST restore
router.post('/:id/restore', auth, async (req, res) => {
  try {
    const letter = await IncomingLetter.findByIdAndUpdate(req.params.id, {
      deleted: false, deletedAt: null, deletedBy: null, deletedByName: null,
    }, { new: true });
    await log('restored', letter.refNo, 'incoming', req.user);
    res.json(letter);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST dispatch — Record Officer stamps and forwards to intended office
// Creates a forwarded copy for the recipient AND archives the original
router.post('/:id/dispatch', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Record Officer') return res.status(403).json({ message: 'Only Record Officer can dispatch' });
    const { toOffice, note, dispatchRef, receivedBy, copies } = req.body;
    const now = new Date();

    // Validate: need either a toOffice or at least one inbox-only copy with a staffId
    const hasInboxOnlyCopies = Array.isArray(copies) && copies.some(c => c.deliveryMode === 'inbox' && c.staffId);
    if (!toOffice && !hasInboxOnlyCopies) {
      return res.status(400).json({ message: 'Select a destination office or add at least one inbox-only copy with a staff member.' });
    }

    // Stamp the original letter
    const original = await IncomingLetter.findByIdAndUpdate(req.params.id, {
      status: 'Forwarded',
      forwardedTo: toOffice || 'Inbox Only',
      dispatchRef: dispatchRef || '',
      stampedBy: req.user.name,
      stampedAt: now,
      archivedAt: now,
      receivedBy: receivedBy || '',
      remarks: note ? `[Record Office] ${note}` : undefined,
    }, { new: true });

    // Create forwarded copy for recipient office (only if toOffice is set)
    let forwarded;
    if (toOffice) {
      const fwdTs = Date.now();
      const fwdRand = String(Math.floor(Math.random() * 900) + 100);
      const fwdYear = new Date().getFullYear();
      const newRef = `INC-${fwdYear}-${fwdTs}-${fwdRand}`;
      forwarded = await IncomingLetter.create({
        refNo: newRef,
        sender: original.sender,
        senderOrg: original.senderOrg,
        subject: original.subject,
        department: toOffice,
        priority: original.priority,
        mode: 'Internal Dispatch',
        dateReceived: now.toISOString().slice(0, 10),
        status: 'Registered',
        remarks: `Dispatched by Record Office${dispatchRef ? ' [Ref: ' + dispatchRef + ']' : ''}${note ? '. Note: ' + note : ''}`,
        fromOffice: 'Record Office',
        toOffice,
        autoDelivered: true,
        linkedOutRef: original.refNo,
        forwardedFrom: original.refNo,
        forwardChain: [...(original.forwardChain || []), original.refNo],
        dispatchRef: dispatchRef || '',
        stampedBy: req.user.name,
        stampedAt: now,
        readBy: [],
        attachments: (original.attachments || []).map(a => ({ name: a.name, size: a.size, type: a.type, url: a.url || '', filename: a.filename || '' })),
        receivedBy: receivedBy || '',
      });
    } else {
      // Inbox-only dispatch — use original as the reference letter for inbox records
      forwarded = original;
    }

    await log('dispatched to ' + (toOffice || 'inbox only'), original.refNo, 'incoming', req.user);

    // Respond immediately — inbox/email work runs in background
    res.json({ original, forwarded });

    // ── Background: inbox creation + emails (non-blocking) ──
    setImmediate(async () => {
      try {
        const { staffIds, emails, copies } = req.body;

        // Helper: upsert a single inbox record (no duplicates)
        const upsertInbox = (userId, letterId) =>
          ReceivedLetter.findOneAndUpdate(
            { userId, letterId },
            { $setOnInsert: { userId, letterId, isRead: false } },
            { upsert: true, new: true }
          ).catch(() => {});

        // Only create inbox records for EXPLICITLY selected staff (staffIds from dispatch form)
        // Do NOT auto-inbox the whole office — inbox is opt-in per dispatch
        if (Array.isArray(staffIds) && staffIds.length > 0) {
          const mongoose = require('mongoose');
          for (const id of staffIds) {
            if (mongoose.Types.ObjectId.isValid(id)) {
              await upsertInbox(id, forwarded._id);
            }
          }
        }

        // CC copies
        if (Array.isArray(copies) && copies.length > 0) {
          const mongoose = require('mongoose');
          for (const copy of copies) {
            const copyOffice = copy.office || copy.body;
            const isInboxOnly = copy.deliveryMode === 'inbox';

            if (isInboxOnly) {
              if (copy.staffId && mongoose.Types.ObjectId.isValid(copy.staffId)) {
                await upsertInbox(copy.staffId, forwarded._id);
              }
            } else {
              // Office mode: only create inbox for explicitly selected staffId, NOT whole office
              if (copy.staffId && mongoose.Types.ObjectId.isValid(copy.staffId)) {
                await upsertInbox(copy.staffId, forwarded._id);
              }
            }

            if (copy.email && copy.email.trim()) {
              const emailService = require('../services/emailService');
              const ap = original.attachments?.[0]?.filename
                ? require('path').join(__dirname, '../uploads', original.attachments[0].filename) : null;
              emailService.sendLetterEmail(copy.email.trim(), original.subject, ap);
            }
          }
        }

        // Top-level emails
        if (Array.isArray(emails) && emails.length > 0) {
          const emailService = require('../services/emailService');
          const ap = original.attachments?.[0]?.filename
            ? require('path').join(__dirname, '../uploads', original.attachments[0].filename) : null;
          for (const to of emails) emailService.sendLetterEmail(to, original.subject, ap);
        }
      } catch (e) { console.error('Background inbox/email error:', e.message); }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete('/:id/permanent', auth, async (req, res) => {
  try {
    const letter = await IncomingLetter.findById(req.params.id);
    if (letter) await log('permanently deleted', letter.refNo, 'incoming', req.user);
    await IncomingLetter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Permanently deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
