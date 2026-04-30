const mongoose = require('mongoose');

const IncomingLetterSchema = new mongoose.Schema({
  refNo:          { type: String, unique: true },
  sender:         String,
  senderOrg:      String,
  subject:        String,
  department:     String,
  priority:       { type: String, default: 'Normal' },
  mode:           String,
  dateReceived:   String,
  status:         { type: String, default: 'Registered' },
  remarks:        { type: String, default: '' },
  attachments:    { type: Array, default: [] },  // each: { name, size, type, dataUrl }
  fromOffice:     String,
  toOffice:       String,
  autoDelivered:  { type: Boolean, default: false },
  linkedOutRef:   String,
  intendedFor:    { type: String, default: '' },  // original intended recipient before Record Office routing
  dispatchRef:    { type: String, default: '' },  // Record Office indicator/reference number
  stampedBy:      { type: String, default: '' },  // Record Officer who stamped
  stampedAt:      { type: Date },                 // when stamped
  archivedAt:     { type: Date },                 // when copy was archived
  receivedBy:     { type: String, default: '' },  // name of person who physically collected the letter
  forwardedFrom:  String,
  forwardChain:   { type: Array, default: [] },
  readBy:         { type: Array, default: [] },
  deleted:        { type: Boolean, default: false },
  deletedAt:      Date,
  deletedBy:      String,
  deletedByName:  String,
  deletedByRole:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('IncomingLetter', IncomingLetterSchema);
