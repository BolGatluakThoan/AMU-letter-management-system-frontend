const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role, office: user.office,
        avatar: user.avatar, email: user.email, canAddUsers: user.canAddUsers,
        canResetPassword: user.canResetPassword },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user._id, name: user.name, role: user.role,
      office: user.office, avatar: user.avatar, email: user.email, canAddUsers: user.canAddUsers,
      mustChangePassword: user.mustChangePassword, canResetPassword: user.canResetPassword } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/forgot — request OTP (Record Officer / system admin only)
router.post('/forgot', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'No account found with that username.' });

    // Only Record Officers can reset via this flow
    if (user.role !== 'Record Officer') {
      return res.status(403).json({ message: 'Password reset is only available for the system administrator (Record Officer). Contact your Record Office for assistance.' });
    }

    // Generate 6-digit OTP, valid for 15 minutes
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    await user.save();

    // In production: send via email/SMS. Here we return masked contact + otp for local use.
    const maskedEmail = user.email
      ? user.email.replace(/(.{2}).+(@.+)/, '$1***$2')
      : null;
    const maskedPhone = user.phone
      ? user.phone.replace(/.(?=.{4})/g, '*')
      : null;

    res.json({
      message: 'OTP generated',
      maskedEmail,
      maskedPhone,
      // Only expose OTP directly when no email/SMS transport is configured (local/offline systems)
      // In production, set SMTP_USER in .env and the OTP will be sent via email instead
      ...(process.env.SMTP_USER ? {} : { otp }),
      offlineMode: !process.env.SMTP_USER,
      name: user.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/verify-otp — verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { username, otp } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (!user.resetOtp || user.resetOtp !== otp)
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry)
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });

    // Issue a short-lived reset token
    const resetToken = jwt.sign({ id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '10m' });
    res.json({ message: 'OTP verified', resetToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password — set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    let payload;
    try { payload = jwt.verify(resetToken, process.env.JWT_SECRET); }
    catch { return res.status(400).json({ message: 'Reset session expired. Please start over.' }); }

    if (payload.purpose !== 'reset')
      return res.status(400).json({ message: 'Invalid reset token.' });

    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.password = newPassword; // pre-save hook will hash it
    user.resetOtp = '';
    user.resetOtpExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/change-password — authenticated user changes their own password
const authMiddleware = require('../middleware/auth');
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.password = newPassword; // pre-save hook hashes it
    user.mustChangePassword = false;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
