# Requirements: Relax Strict Cookie Expiration Check

## User Story

As a **developer using Spotify Automation**,
I want **the authentication validation logic to tolerate non-essential expired cookies**,
So that **the automation pipeline does not fail unnecessarily when the session is effectively still valid.**

## Acceptance Criteria

### 1. Tolerate Expired Cookies
- **Given** the authentication state file (`spotify-auth.json`) contains one or more expired cookies.
- **And** the file also contains valid cookies necessary for the session.
- **When** `AuthManager.isAuthValid()` is called.
- **Then** it should **NOT** throw an `EXPIRED_AUTH` error.
- **And** it should return `true` (assuming other checks pass).

### 2. Log Warnings
- **Given** an expired cookie is detected during validation.
- **When** `AuthManager.isAuthValid()` processes this cookie.
- **Then** a warning message should be logged to the console (e.g., `[WARN] Cookie 'cookie_name' has expired.`).

### 3. Maintain Integrity
- **Given** the authentication file is corrupted or missing essential properties.
- **When** `AuthManager.isAuthValid()` is called.
- **Then** it should still throw appropriate errors (`INVALID_AUTH_FILE`, etc.) as before.
