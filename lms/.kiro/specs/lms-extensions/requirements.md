# Requirements Document

## Introduction

This document covers three extension features for the Letter Management System (LMS): a Staff Inbox System for internal letter delivery tracking, an Admin-Controlled Password Reset system with forced password change enforcement, and a No-Reply Email Integration for sending letter copies to external recipients. All features are additive — they extend existing modules without modifying the core letter storage or dispatch structure.

## Glossary

- **LMS**: The Letter Management System (React + Node.js + MongoDB).
- **Dispatch_Controller**: The existing POST `/:id/dispatch` handler in `server/routes/incoming.js`.
- **Inbox_Service**: The new backend service responsible for creating and managing `received_letters` records.
- **Email_Service**: The new backend service responsible for sending emails via SMTP using Nodemailer.
- **Inbox_API**: The new REST endpoints (`GET /inbox`, `PATCH /inbox/:id/read`) added to the backend.
- **Admin_Panel**: The existing Users management page (`lms/src/pages/Users.jsx`) used by administrators.
- **Auth_Controller**: The existing login handler in `server/routes/auth.js`.
- **User_Model**: The existing Mongoose schema in `server/models/User.js`.
- **Record_Officer**: A user with the role `Record Officer`, who has dispatch privileges.
- **Admin**: A user with the role `admin` or a user with `canResetPassword == true`.
- **received_letters**: The new MongoDB collection used to track inbox delivery of letters to staff.
- **mustChangePassword**: A boolean field on the User_Model indicating the user must set a new password on next login.
- **canResetPassword**: A boolean field on the User_Model granting non-admin users the right to reset other users' passwords.

---

## Requirements

### Requirement 1: Staff Inbox — Received Letters Collection

**User Story:** As a staff member, I want to receive letters dispatched to me in a personal inbox, so that I can track and read letters addressed to me without searching through the full letter list.

#### Acceptance Criteria

1. THE Inbox_Service SHALL create a new MongoDB collection named `received_letters` with fields: `userId` (reference to User), `letterId` (reference to IncomingLetter), `isRead` (Boolean, default `false`), and `createdAt` (Date).
2. THE Inbox_Service SHALL NOT modify the existing `IncomingLetter` schema or any existing letter documents.
3. WHEN the Dispatch_Controller dispatches a letter and `staffIds` is provided in the request body, THE Inbox_Service SHALL insert one `received_letters` record per entry in `staffIds`.
4. WHEN `staffIds` is not provided in the dispatch request body, THE Dispatch_Controller SHALL execute the existing dispatch logic without inserting any `received_letters` records.
5. THE Inbox_API SHALL expose a `GET /api/inbox` endpoint that returns all `received_letters` records belonging to the authenticated user, sorted by `createdAt` descending.
6. THE Inbox_API SHALL expose a `PATCH /api/inbox/:id/read` endpoint that sets `isRead` to `true` for the specified `received_letters` record.
7. IF the authenticated user attempts to mark a `received_letters` record that does not belong to them as read, THEN THE Inbox_API SHALL return HTTP 403.
8. WHEN a `received_letters` record is fetched via `GET /api/inbox`, THE Inbox_API SHALL populate the `letterId` field with the referenced letter's `refNo`, `subject`, `sender`, `priority`, and `attachments`.

---

### Requirement 2: Staff Inbox — Frontend Inbox Page

**User Story:** As a staff member, I want a dedicated inbox page in the LMS UI, so that I can view and open letters sent to me.

#### Acceptance Criteria

1. THE LMS SHALL provide a new page at route `/inbox` accessible to authenticated users.
2. WHEN a user navigates to `/inbox`, THE Inbox_Page SHALL fetch and display all `received_letters` records for the authenticated user.
3. THE Inbox_Page SHALL visually distinguish unread records (where `isRead == false`) from read records.
4. WHEN a user clicks the View button on an inbox record, THE Inbox_Page SHALL mark the record as read by calling `PATCH /api/inbox/:id/read` and navigate to the letter detail view.
5. THE Sidebar SHALL include a navigation link to `/inbox` visible to all authenticated users.

---

### Requirement 3: Admin Password Reset — User Model Extension

**User Story:** As an admin, I want to reset a staff member's password and force them to change it on next login, so that I can securely manage access without sharing plaintext passwords.

#### Acceptance Criteria

1. THE User_Model SHALL be extended with a `mustChangePassword` field of type Boolean with a default value of `false`.
2. THE User_Model SHALL be extended with a `canResetPassword` field of type Boolean with a default value of `false`.
3. THE LMS SHALL NOT alter any existing fields or indexes on the User_Model.

---

### Requirement 4: Admin Password Reset — Reset API

**User Story:** As an admin, I want to trigger a password reset for any user, so that I can restore access without knowing the user's current password.

#### Acceptance Criteria

1. THE LMS SHALL expose a `POST /api/users/:id/reset-password` endpoint.
2. WHEN a reset request is received, THE Reset_API SHALL generate a random alphanumeric password of at least 8 characters.
3. WHEN a reset request is received, THE Reset_API SHALL hash the generated password using bcrypt before saving it to the User_Model.
4. WHEN a reset request is received, THE Reset_API SHALL set `mustChangePassword` to `true` on the target user.
5. WHEN a reset request is received, THE Reset_API SHALL return the plaintext generated password in the response so the admin can communicate it to the user.
6. IF the requesting user's role is not `admin` AND `canResetPassword` is not `true` on the requesting user, THEN THE Reset_API SHALL return HTTP 403.
7. THE Reset_API SHALL NOT modify any fields other than `password`, `mustChangePassword`, and the bcrypt hash on the target user document.

---

### Requirement 5: Admin Password Reset — Forced Change on Login

**User Story:** As a staff member whose password was reset, I want to be prompted to set a new password immediately after logging in, so that I can replace the temporary password with one only I know.

#### Acceptance Criteria

1. WHEN a user successfully authenticates via `POST /api/auth/login` and `mustChangePassword` is `true`, THE Auth_Controller SHALL include a `mustChangePassword: true` flag in the login response payload.
2. WHEN the frontend receives a login response with `mustChangePassword: true`, THE Login_Page SHALL redirect the user to the change-password route instead of the dashboard.
3. THE LMS SHALL provide a change-password page at route `/change-password` accessible only to authenticated users.
4. WHEN a user submits a new password on the change-password page, THE Change_Password_API SHALL accept `POST /api/auth/change-password` with the new password, hash it, save it, and set `mustChangePassword` to `false`.
5. IF the new password submitted to `POST /api/auth/change-password` is fewer than 6 characters, THEN THE Change_Password_API SHALL return HTTP 400 with a descriptive error message.
6. WHILE `mustChangePassword` is `true` for the authenticated user, THE LMS frontend SHALL prevent navigation to any route other than `/change-password`.

---

### Requirement 6: Delegated Reset Permission

**User Story:** As an admin, I want to grant specific staff members the ability to reset passwords, so that I can delegate access management without giving full admin rights.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a toggle control per user to enable or disable `canResetPassword`.
2. WHEN an admin toggles `canResetPassword` for a user, THE Admin_Panel SHALL call `PUT /api/users/:id` with the updated `canResetPassword` value.
3. WHEN `canResetPassword` is `true` for a user, THE Reset_API SHALL permit that user to call `POST /api/users/:id/reset-password` for other users.
4. IF a user with `canResetPassword == false` and role other than `admin` attempts to call `POST /api/users/:id/reset-password`, THEN THE Reset_API SHALL return HTTP 403.
5. THE LMS SHALL include `canResetPassword` in the JWT payload so the frontend can conditionally render the reset action.

---

### Requirement 7: No-Reply Email Integration

**User Story:** As a Record Officer, I want to optionally send a copy of a dispatched letter to external email addresses, so that recipients outside the system can receive the letter without needing an LMS account.

#### Acceptance Criteria

1. THE Email_Service SHALL use Nodemailer configured with SMTP credentials stored in environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
2. WHEN the Dispatch_Controller dispatches a letter and `emails` (array of strings) is provided in the request body, THE Email_Service SHALL send one email per address in `emails` with the letter subject and a PDF attachment of the letter file.
3. WHEN `emails` is not provided or is an empty array in the dispatch request body, THE Dispatch_Controller SHALL complete the dispatch without invoking the Email_Service.
4. IF the Email_Service fails to send an email for any reason, THEN THE Dispatch_Controller SHALL log the error and continue — the dispatch response SHALL NOT be affected by email delivery failure.
5. THE Email_Service SHALL send emails from the address configured in `SMTP_FROM` and SHALL NOT expose any staff member's personal email address as the sender.
6. THE Dispatch_Controller SHALL accept both `staffIds` and `emails` in the same request, executing inbox insertion and email sending independently.
7. THE Dispatch_UI (IncomingLetters.jsx dispatch modal) SHALL provide an optional input field for entering one or more external email addresses before dispatching.
