const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username:       { type: String, required: true, unique: true, trim: true },
  password:       { type: String, required: true },
  name:           { type: String, required: true },
  role:           { type: String, required: true },
  office:         { type: String, required: true },
  avatar:         { type: String, default: '' },
  email:          { type: String, default: '' },
  canAddUsers:    { type: Boolean, default: false },
  resetOtp:         { type: String,  default: '' },
  resetOtpExpiry:   { type: Date,   default: null },
  phone:            { type: String, default: '' },
  _invitedByOffice: { type: String, default: '' },
  mustChangePassword: { type: Boolean, default: false },
  canResetPassword:   { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', UserSchema);
