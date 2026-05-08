# Requirements Document

## Introduction

This document defines the requirements for the Authentication Module (Sign In / Sign Out) and the Dark/Light Theme Toggle for the Letter Management System (LMS). The LMS is a React + Vite application used by university staff across six offices to manage incoming and outgoing correspondence.

The authentication module ensures that only authorized users can access the system, enforces office-based role permissions, and provides secure session management. The theme module allows users to switch between a professional dark-blue theme and a light theme, with the preference persisted across sessions.

---

## Glossary

- **LMS**: Letter Management System — the React + Vite web application.
- **Auth_Engine**: The authentication logic responsible for validating credentials and managing session state within `AppContext`.
- **Session**: The in-memory (and optionally persisted) record of the currently authenticated user, including identity, role, and office.
- **Login_Page**: The `/login` route rendered by `Login.jsx`.
- **Protected_Route**: A route that redirects unauthenticated users to the Login_Page.
- **Navbar**: The top navigation bar component (`Navbar.jsx`) visible to authenticated users.
- **Theme_Manager**: The logic within `AppContext` that stores and applies the active theme (light or dark).
- **Theme_Toggle**: The UI control in the Navbar that switches between Light Mode and Dark Mode.
- **Role**: A string value assigned to a user that determines their permissions within their office. Valid values: `Record Officer`, `Registrar`, `Finance Officer`, `Academic Staff`, `Administrator`, `Management`.
- **Office**: The university department a user belongs to. Valid values: `Record Office`, `Registrar Office`, `Finance Office`, `Academic/Faculty Office`, `Administration Office`, `Management/Executive Office`.
- **Credentials**: A username and password pair submitted on the Login_Page.
- **Mock_Users**: A static list of user accounts used for development/demo purposes in the absence of a backend, with at least one user per office.

---

## Requirements

### Requirement 1: User Authentication — Sign In

**User Story:** As a university staff member, I want to sign in with my credentials, so that I can access the LMS securely based on my assigned role and office.

#### Acceptance Criteria

1. WHEN the user submits valid Credentials on the Login_Page, THE Auth_Engine SHALL authenticate the user, create a Session containing the user's name, role, office, and avatar initials, and redirect the user to the Dashboard.
2. WHEN the user submits invalid Credentials on the Login_Page, THE Auth_Engine SHALL reject the authentication attempt and THE Login_Page SHALL display a descriptive error message within 1 second.
3. WHEN the user submits the login form with an empty username or empty password field, THE Login_Page SHALL prevent form submission and display a field-level validation message.
4. THE Auth_Engine SHALL support the following roles and their associated offices:
   - `Record Officer` → `Record Office` — can register, view, and track all incoming and outgoing letters across all offices.
   - `Registrar` → `Registrar Office` — can view and manage letters scoped to student records, enrollment, and academic correspondence.
   - `Finance Officer` → `Finance Office` — can view and manage letters scoped to the Finance department only.
   - `Academic Staff` → `Academic/Faculty Office` — can view letters relevant to academic and faculty correspondence.
   - `Administrator` → `Administration Office` — can view and manage letters across HR, operations, and general administration.
   - `Management` → `Management/Executive Office` — has read-only access to all letters for oversight purposes.
5. THE Mock_Users list SHALL contain at least one user account per office, covering all six offices defined in the Glossary.
6. WHILE an authentication request is in progress, THE Login_Page SHALL display a loading indicator and disable the submit button to prevent duplicate submissions.
7. WHEN authentication succeeds, THE Auth_Engine SHALL store the Session in React context so that all components can access the current user's name, role, office, and avatar.

---

### Requirement 2: Protected Routes

**User Story:** As a system administrator, I want all application routes to be protected, so that unauthenticated users cannot access any page other than the Login_Page.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any Protected_Route, THE LMS SHALL redirect the user to the Login_Page.
2. WHEN an authenticated user navigates to `/login`, THE LMS SHALL redirect the user to the Dashboard.
3. THE LMS SHALL treat all routes except `/login` as Protected_Routes.
4. WHEN the browser is refreshed, THE Auth_Engine SHALL restore the Session from `localStorage` if a valid persisted session exists, so that the user is not forced to sign in again.

---

### Requirement 3: Sign Out

**User Story:** As an authenticated user, I want to sign out of the system, so that my session is terminated and my account is protected on shared devices.

#### Acceptance Criteria

1. WHEN the user clicks "Sign Out" in the Navbar profile dropdown, THE Auth_Engine SHALL clear the Session from React context and from `localStorage`.
2. WHEN the Session is cleared, THE LMS SHALL redirect the user to the Login_Page.
3. WHEN the user navigates back after signing out, THE LMS SHALL redirect the user to the Login_Page rather than restoring the previous page.

---

### Requirement 4: Role-Based User Identity Display

**User Story:** As an authenticated user, I want to see my name, role, and office displayed in the Navbar, so that I can confirm which account and department I am operating under.

#### Acceptance Criteria

1. WHILE a Session is active, THE Navbar SHALL display the authenticated user's full name, role label, and office name in the profile area.
2. WHILE a Session is active, THE Navbar SHALL display the user's avatar initials derived from the user's name.
3. IF the Session does not contain a valid user name, THEN THE Navbar SHALL display a fallback label of "User" for the name, "Unknown" for the role, and "Unknown Office" for the office.
4. WHILE a Session is active, THE Navbar SHALL render the office name in a visually distinct style (e.g., subdued color or smaller font) beneath the user's name and role, so that the office is identifiable at a glance.

---

### Requirement 5: Role-Based Letter Access Control

**User Story:** As a system administrator, I want each role to see only the letters relevant to their office, so that sensitive correspondence is not exposed to unauthorized staff.

#### Acceptance Criteria

1. WHILE the active Session contains the role `Record Officer`, THE LMS SHALL display all incoming and outgoing letters regardless of department.
2. WHILE the active Session contains the role `Registrar`, THE LMS SHALL display only letters whose department matches `Registrar` or academic correspondence categories.
3. WHILE the active Session contains the role `Finance Officer`, THE LMS SHALL display only letters whose department matches `Finance`.
4. WHILE the active Session contains the role `Academic Staff`, THE LMS SHALL display only letters whose department matches `Academic` or `Faculty`.
5. WHILE the active Session contains the role `Administrator`, THE LMS SHALL display letters whose department matches `Admin`, `HR`, or `Operations`.
6. WHILE the active Session contains the role `Management`, THE LMS SHALL display all letters in read-only mode, with create, edit, and delete controls hidden.
7. IF the active Session contains a role not listed in the Glossary, THEN THE Auth_Engine SHALL clear the Session and redirect the user to the Login_Page.

---

### Requirement 6: Dark / Light Theme Toggle

**User Story:** As a user, I want to switch between Dark Mode and Light Mode, so that I can use the LMS comfortably in different lighting environments.

#### Acceptance Criteria

1. THE Theme_Manager SHALL maintain a theme state with two valid values: `light` and `dark`.
2. WHEN the user clicks the Theme_Toggle in the Navbar, THE Theme_Manager SHALL switch the active theme from `light` to `dark` or from `dark` to `light`.
3. WHEN the active theme changes, THE Theme_Manager SHALL apply a `data-theme` attribute to the `<html>` element so that CSS variables defined in `index.css` reflect the correct color palette.
4. WHEN the active theme changes, THE Theme_Manager SHALL persist the selected theme value to `localStorage` under the key `lms-theme`.
5. WHEN the LMS initializes, THE Theme_Manager SHALL read the `lms-theme` key from `localStorage` and apply the stored theme; IF no stored value exists, THEN THE Theme_Manager SHALL default to `light` theme.
6. THE Navbar SHALL render the Theme_Toggle as an icon button that displays a sun icon in Dark Mode and a moon icon in Light Mode, indicating the action that will be taken on click.

---

### Requirement 7: Dark Mode Color Palette

**User Story:** As a user, I want the Dark Mode to use a professional dark-blue color palette, so that the interface is visually consistent and easy to read in low-light conditions.

#### Acceptance Criteria

1. THE Theme_Manager SHALL define a `[data-theme="dark"]` CSS rule block in `index.css` that overrides the following CSS variables: `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-2`, `--text-muted`, `--text-faint`, and `--sidebar-bg`.
2. WHEN Dark Mode is active, THE LMS SHALL render the main background (`--bg`) using a dark navy color in the range `#0d1117` to `#0f172a`.
3. WHEN Dark Mode is active, THE LMS SHALL render card and modal surfaces (`--surface`) using a dark blue-gray color in the range `#161b22` to `#1e293b`.
4. WHEN Dark Mode is active, THE LMS SHALL render body text (`--text`) with sufficient contrast against `--surface` to meet a contrast ratio of at least 4.5:1.
5. WHEN Dark Mode is active, THE LMS SHALL render the Sidebar background (`--sidebar-bg`) using a color darker than `--surface` to maintain visual hierarchy.

---

### Requirement 8: Theme and Session Persistence (Round-Trip)

**User Story:** As a user, I want my theme preference and session to survive a page refresh, so that I do not have to reconfigure the application every time I reload.

#### Acceptance Criteria

1. FOR ALL valid theme values (`light`, `dark`), writing the theme to `localStorage` then reading it back SHALL produce the same theme value (round-trip property).
2. FOR ALL valid Session objects, serializing the Session to `localStorage` then deserializing it SHALL produce a Session with identical `name`, `role`, `office`, and `avatar` fields (round-trip property).
3. WHEN `localStorage` contains a corrupted or unrecognized theme value, THE Theme_Manager SHALL fall back to `light` theme without throwing an error.
4. WHEN `localStorage` contains a corrupted or unrecognized Session value, THE Auth_Engine SHALL clear the corrupted entry and redirect the user to the Login_Page.
