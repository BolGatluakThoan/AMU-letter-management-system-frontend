# Requirements Document

## Introduction

A two-level Recycle Bin for the Letter Management System (LMS). Deleted letters are soft-deleted (never immediately removed) and held for 30 days before auto-purge. Regular users see only their own deleted items; admins and record officers see all deleted items system-wide. All delete, restore, and permanent-delete actions are recorded in an audit log.

## Glossary

- **System**: The LMS application
- **RecycleBin**: The page and feature that manages soft-deleted letters
- **User**: Any authenticated LMS user
- **Admin**: A user with role "Administrative Staff"
- **RecordOfficer**: A user with role "Record Officer"
- **MyOffice**: The office associated with the currently authenticated user
- **SoftDelete**: Marking a letter with `_deleted: true` without removing it from storage
- **RetentionPeriod**: The number of days a deleted letter is kept before permanent auto-purge (default 30)
- **AuditLog**: An append-only list of delete/restore/permanent-delete events

## Requirements

### Requirement 1: Soft-Delete Strategy

**User Story:** As a user, I want deleted letters to be recoverable, so that accidental deletions can be undone.

#### Acceptance Criteria

1. WHEN a user deletes an incoming letter, THE System SHALL set `_deleted: true`, `_deletedAt` to the current ISO timestamp, `_deletedBy` to the user's office name, and `_deletedByName` to the user's display name on that letter.
2. WHEN a user deletes an outgoing letter, THE System SHALL set `_deleted: true`, `_deletedAt` to the current ISO timestamp, `_deletedBy` to the user's office name, and `_deletedByName` to the user's display name on that letter.
3. THE System SHALL exclude letters where `_deleted: true` from all normal letter list views (Incoming, Outgoing, Archive).
4. WHEN a soft-delete action occurs, THE System SHALL append an entry to the AuditLog containing: id, action ("deleted"), refNo, type ("incoming"/"outgoing"), by (user name), office, and at (ISO timestamp).

### Requirement 2: User Recycle Bin View

**User Story:** As a user, I want to see only the letters I deleted, so that I can manage my own deleted items without seeing others'.

#### Acceptance Criteria

1. WHEN a user navigates to `/recycle-bin`, THE RecycleBin page SHALL display only letters where `_deleted: true` AND `_deletedBy === myOffice`.
2. THE RecycleBin page SHALL display columns: Type (Incoming/Outgoing), Reference No., Subject, Deleted By, Date Deleted, Days Remaining, and Actions.
3. THE System SHALL calculate Days Remaining as `RetentionPeriod - floor((now - _deletedAt) / 86400000)`.
4. IF Days Remaining is less than or equal to 0, THEN THE System SHALL treat the letter as eligible for auto-purge.

### Requirement 3: Admin System Recycle Bin View

**User Story:** As an admin or record officer, I want to see all deleted letters from all users, so that I can oversee and manage system-wide deletions.

#### Acceptance Criteria

1. WHEN an Admin or RecordOfficer navigates to `/recycle-bin`, THE RecycleBin page SHALL display a "System Recycle Bin" tab showing ALL letters where `_deleted: true` regardless of office.
2. THE System Recycle Bin tab SHALL include a Department column showing the `_deletedBy` office for each letter.
3. WHERE the System Recycle Bin tab is active, THE RecycleBin page SHALL provide the same Restore, Permanent Delete, and View Details actions as the user view.

### Requirement 4: Restore Action

**User Story:** As a user, I want to restore a deleted letter, so that it reappears in the normal letter views.

#### Acceptance Criteria

1. WHEN a user clicks Restore on a deleted letter, THE System SHALL set `_deleted: false` and clear `_deletedAt`, `_deletedBy`, and `_deletedByName` on that letter.
2. WHEN a restore action occurs, THE System SHALL append an entry to the AuditLog with action "restored".
3. WHEN a letter is restored, THE System SHALL make it visible again in the appropriate normal letter list view.

### Requirement 5: Permanent Delete Action

**User Story:** As a user, I want to permanently delete a letter from the recycle bin, so that it is completely removed from the system.

#### Acceptance Criteria

1. WHEN a user clicks Permanent Delete on a deleted letter, THE System SHALL remove that letter record entirely from storage.
2. WHEN a permanent delete action occurs, THE System SHALL append an entry to the AuditLog with action "permanently deleted".
3. THE System SHALL require a confirmation step before executing a permanent delete.

### Requirement 6: Retention Policy and Auto-Purge

**User Story:** As an admin, I want deleted letters to be automatically purged after the retention period, so that storage is managed without manual intervention.

#### Acceptance Criteria

1. THE System SHALL apply a default RetentionPeriod of 30 days.
2. WHEN the RecycleBin page is loaded, THE System SHALL permanently remove any deleted letters where `floor((now - _deletedAt) / 86400000) >= RetentionPeriod`.
3. WHERE a configurable retention setting exists in Settings, THE System SHALL use that value as the RetentionPeriod.

### Requirement 7: Audit Log

**User Story:** As an admin, I want a log of all recycle bin actions, so that I can audit who deleted or restored what and when.

#### Acceptance Criteria

1. THE System SHALL maintain an AuditLog array in application state, persisted to localStorage.
2. WHEN any delete, restore, or permanent delete action occurs, THE System SHALL add an entry with fields: id, action, refNo, type, by, office, at.
3. THE RecycleBin page SHALL display the AuditLog in a collapsible section at the bottom of the page.
4. THE AuditLog SHALL be displayed in reverse-chronological order (newest first).

### Requirement 8: Sidebar Navigation

**User Story:** As a user, I want a Recycle Bin link in the sidebar, so that I can quickly navigate to my deleted items.

#### Acceptance Criteria

1. THE Sidebar SHALL include a "Recycle Bin" navigation link with a trash icon pointing to `/recycle-bin`.
2. WHEN the user's recycle bin contains one or more items, THE Sidebar SHALL display a badge showing the count of the user's deleted items next to the Recycle Bin link.
3. WHILE the sidebar is collapsed, THE System SHALL show only the icon and badge without the label text.

### Requirement 9: Empty State

**User Story:** As a user, I want a clear empty state when my recycle bin has no items, so that I know there is nothing to manage.

#### Acceptance Criteria

1. WHEN the active recycle bin tab contains no deleted letters, THE RecycleBin page SHALL display an empty-state message indicating the bin is empty.
