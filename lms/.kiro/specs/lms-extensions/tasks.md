# Implementation Plan: LMS Extensions

## Overview

Additive extensions to the LMS: Password Reset with forced change, Staff Inbox, and Email Integration. All features are optional and non-breaking.

## Tasks

- [x] 1. Extend User model with mustChangePassword and canResetPassword fields
  - Add `mustChangePassword` (Boolean, default false) and `canResetPassword` (Boolean, default false) to `server/models/User.js`
  - Do NOT modify any existing fields
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Add POST /api/users/:id/reset-password route
  - [x] 2.1 Implement reset-password endpoint in `server/routes/users.js`
    - Generate random 8-char alphanumeric password
    - bcrypt hash it, set mustChangePassword=true, return plaintext
    - Guard: role==admin OR canResetPassword==true → else 403
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 3. Extend login response and add change-password endpoint
  - [x] 3.1 Extend POST /api/auth/login to include mustChangePassword and canResetPassword in response
    - _Requirements: 5.1_
  - [x] 3.2 Add POST /api/auth/change-password route
    - Accepts newPassword (min 6 chars), hashes, saves, sets mustChangePassword=false
    - Requires valid JWT
    - _Requirements: 5.4, 5.5_

- [x] 4. Frontend API methods for password reset
  - Add `api.resetUserPassword(userId)` and `api.changePassword(newPassword)` to `lms/src/lib/api.js`
  - _Requirements: 4.1, 5.4_

- [x] 5. Frontend ChangePassword page and routing
  - [x] 5.1 Create `lms/src/pages/ChangePassword.jsx`
    - Form: new password + confirm, calls api.changePassword, redirects to dashboard
    - _Requirements: 5.3, 5.4_
  - [x] 5.2 Add /change-password route to `lms/src/App.jsx`
    - Redirect to /change-password if mustChangePassword==true after login
    - Block navigation to other routes while mustChangePassword is true
    - _Requirements: 5.2, 5.3, 5.6_

- [x] 6. Users.jsx: Reset Password button and canResetPassword toggle
  - [x] 6.1 Replace existing manual reset modal with API-based reset (calls api.resetUserPassword, shows generated password)
    - Show Reset Password button only for admin/canResetPassword users
    - _Requirements: 4.1, 4.5, 6.1_
  - [x] 6.2 Add canResetPassword toggle per user in admin panel
    - Calls updateUser with canResetPassword value
    - _Requirements: 6.1, 6.2_

- [x] 7. Checkpoint — Password Reset feature complete
  - Ensure all password reset flows work end-to-end, ask the user if questions arise.

- [x] 8. Create ReceivedLetter model
  - Create `server/models/ReceivedLetter.js` with fields: userId (ref User), letterId (ref IncomingLetter), isRead (Boolean default false), createdAt
  - _Requirements: 1.1, 1.2_

- [x] 9. Create inbox routes
  - Create `server/routes/inbox.js`
  - GET /api/inbox — returns user's records sorted by createdAt desc, populate letterId fields
  - PATCH /api/inbox/:id/read — sets isRead=true, 403 if not owner
  - _Requirements: 1.5, 1.6, 1.7, 1.8_

- [x] 10. Register inbox route and extend dispatch to insert ReceivedLetter records
  - [x] 10.1 Register /api/inbox in `server/index.js`
    - _Requirements: 1.5_
  - [x] 10.2 Extend POST /:id/dispatch in `server/routes/incoming.js`
    - After existing dispatch logic, if staffIds array provided, insert ReceivedLetter records
    - Non-breaking: only runs if staffIds present
    - _Requirements: 1.3, 1.4_

- [x] 11. Frontend Inbox page and routing
  - [x] 11.1 Add api.getInbox() and api.markInboxRead(id) to `lms/src/lib/api.js`
    - _Requirements: 2.2_
  - [x] 11.2 Create `lms/src/pages/Inbox.jsx`
    - List received letters, unread bold/highlighted, View button marks read and opens letter detail
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 11.3 Add /inbox route to `lms/src/App.jsx`
    - _Requirements: 2.1_
  - [x] 11.4 Add Inbox link to `lms/src/components/Sidebar.jsx` with unread count badge
    - _Requirements: 2.5_

- [x] 12. Checkpoint — Staff Inbox feature complete
  - Ensure inbox creation and read flows work, ask the user if questions arise.

- [x] 13. Add nodemailer to server dependencies
  - Add nodemailer to `server/package.json` dependencies
  - _Requirements: 7.1_

- [x] 14. Create emailService
  - Create `server/services/emailService.js`
  - Nodemailer transporter using SMTP env vars
  - Export async sendLetterEmail(to, subject, attachmentPath) — errors caught and logged, never thrown
  - _Requirements: 7.1, 7.4, 7.5_

- [x] 15. Extend dispatch to send emails
  - Extend POST /:id/dispatch in `server/routes/incoming.js`
  - If emails array provided, call emailService.sendLetterEmail for each (fire-and-forget)
  - Non-breaking: only runs if emails present
  - _Requirements: 7.2, 7.3, 7.4, 7.6_

- [x] 16. Frontend: email input in dispatch modal
  - In `lms/src/pages/IncomingLetters.jsx` dispatch modal, add optional "External Email Addresses" input (comma-separated)
  - Pass emails[] to dispatch API call via AppContext
  - _Requirements: 7.7_

- [x] 17. Final checkpoint — All features complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All features are additive — existing code is only extended, never refactored
- Checkpoints ensure incremental validation
