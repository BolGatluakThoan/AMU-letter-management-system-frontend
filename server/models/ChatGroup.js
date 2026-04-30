const mongoose = require('mongoose');

const ChatGroupSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  monitors:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  avatar:      { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ChatGroup', ChatGroupSchema);
