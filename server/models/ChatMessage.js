const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  from:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  groupId:   { type: mongoose.Schema.Types.ObjectId, ref: 'ChatGroup', default: null },
  text:      { type: String, required: true },
  readAt:    { type: Date, default: null },
  readBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  editedAt:  { type: Date, default: null },
  deleted:   { type: Boolean, default: false },
  reactions: { type: Map, of: String, default: {} },
  replyTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage', default: null },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
