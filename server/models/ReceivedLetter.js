const mongoose = require('mongoose');

const ReceivedLetterSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  letterId: { type: mongoose.Schema.Types.ObjectId, ref: 'IncomingLetter', required: true },
  isRead:   { type: Boolean, default: false },
}, { timestamps: true });

// Prevent duplicate inbox records for same user+letter
ReceivedLetterSchema.index({ userId: 1, letterId: 1 }, { unique: true });

module.exports = mongoose.model('ReceivedLetter', ReceivedLetterSchema);
