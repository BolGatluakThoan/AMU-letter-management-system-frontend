const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action:  String,
  refNo:   String,
  type:    String,
  by:      String,
  office:  String,
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
