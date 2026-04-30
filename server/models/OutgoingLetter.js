const mongoose = require('mongoose');

const OutgoingLetterSchema = new mongoose.Schema({
  refNo:              { type: String, unique: true },
  referralNo:         { type: String, default: '' },   // manual referral number e.g. FIN/PROC/045/2026
  recipient:          String,
  recipientOrg:       String,
  subject:            String,
  department:         String,
  datePrepared:       String,
  relatedIncoming:    { type: String, default: '' },
  dispatchMethod:     String,
  trackingNo:         { type: String, default: '' },
  responsibleOfficer: String,
  status:             { type: String, default: 'Draft' },
  toOffice:           String,
  fromOffice:         String,
  priority:           { type: String, default: 'Normal' },
  notes:              { type: String, default: '' },
  attachments:        { type: Array, default: [] },
  copies:             { type: Array, default: [] },    // CC recipients [{no, body, file}]
  deleted:            { type: Boolean, default: false },
  deletedAt:          Date,
  deletedBy:          String,
  deletedByName:      String,
  deletedByRole:      { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('OutgoingLetter', OutgoingLetterSchema);
