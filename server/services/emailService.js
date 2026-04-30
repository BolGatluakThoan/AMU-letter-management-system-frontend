const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'localhost',
  port:   parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

/**
 * Send a letter email to an external recipient.
 * Errors are caught and logged — never thrown.
 * @param {string} to - recipient email address
 * @param {string} subject - letter subject
 * @param {string|null} attachmentPath - absolute path to attachment file, or null
 */
async function sendLetterEmail(to, subject, attachmentPath) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@lms.local',
      to,
      subject: `[LMS] ${subject}`,
      text: `Please find attached the letter regarding: ${subject}\n\nThis is an automated message from the Letter Management System.`,
    };
    if (attachmentPath) {
      const fs = require('fs');
      if (fs.existsSync(attachmentPath)) {
        mailOptions.attachments = [{ path: attachmentPath }];
      }
    }
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} for subject: ${subject}`);
  } catch (err) {
    console.error(`Email send failed to ${to}:`, err.message);
  }
}

module.exports = { sendLetterEmail };
