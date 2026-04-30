const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  office:      { type: String, default: '' },
  description: { type: String, default: '' },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);
