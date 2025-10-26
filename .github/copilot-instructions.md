<!-- Guidance for AI coding agents working on the Kiddotubes repository -->
# Kiddotubes — Copilot instructions (concise)

This file tells AI coding agents the minimal, high-value knowledge to be immediately productive in this repository.

- Short summary
  - Frontend-first, vanilla app: `index.html`, many static pages (`login.html`, `profile.html`, etc.) and `app.js` drive the UI.
  - Optional Node backend (local dev / Twilio helper): `server.js` exposes three API endpoints used by the frontend.
  - Data is stored in browser `localStorage` (session flags, PINs, watch history, parent info).

- Key files to inspect first
  - `app.js` — primary client logic: YouTube queries, UI flows, parent-control modal, localStorage usage and DOM wiring.
  - `auth.js` — authentication helpers used by the UI: `Auth.requestOTP`, `Auth.verifyOTP`, session checks and `sendWatchNotification()`.
  - `server.js` — simple Express server used to generate/verify OTP and simulate/send notifications via Twilio.
  - `package.json` — run scripts (use `npm install` then `npm start` to start the backend server).
  - `README.md` and `TWILIO_SETUP.md` — operational notes and setup hints.

- Architecture & data flow (concrete)
  - The client (static pages + `app.js`) fetches YouTube Data API v3 directly using an API key in `app.js` (set `API_KEY`).
  - For OTP and SMS notifications, the client posts to the backend endpoints implemented in `server.js`:
    - POST `/api/generate-otp` — body { phoneNumber, childName }
    - POST `/api/verify-otp` — body { phoneNumber, otp }
    - POST `/api/send-notification` — body { phoneNumber, childName, videoTitle }
  - Server uses Twilio if env vars are set: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`. If not present, server logs and simulates SMS responses.

- LocalStorage conventions and important keys (search for these exact keys)
  - `isRegistered` (string 'true'|'false') — whether parent completed registration
  - `isLoggedIn` — whether parent has active session
  - `accessExpiry` — epoch ms for session expiry (30 min lifetime)
  - `parentInfo` or `parentData` — parent profile (note: both are used in different places; prefer `parentInfo` when modifying shared auth logic)
  - `parentPin` — 4-digit PIN used by parent controls
  - `watchHistory` — array, newest-first, capped (50 items)
  - Other keys: `dailyWatchLimit`, `watchTimeFrom`, `watchTimeTo`, `personalizedQuery`, `childProfilePhoto`

- Project-specific patterns and cross-file gotchas (examples from code)
  - Secrets in repo: `API_KEY` and Twilio credentials are hard-coded in `app.js`/`server.js`. When changing behavior, prefer reading from environment vars or `.env`.
  - Session model: `Auth.verifyOTP()` sets `accessExpiry` to now + 30 minutes; `Auth.isLoggedIn()` checks expiry. Many flows consult `Auth.isLoggedIn()` and/or `isRegistered` in localStorage.
  - Notification flow: `Auth.addToWatchHistory()` will call `sendWatchNotification()` which POSTs to `/api/send-notification` — follow this chain when changing notification behavior.
  - Some inconsistent key/ID names exist (e.g., `parentData` vs `parentInfo`, `registrationForm` vs `registerForm`). When editing, search and normalize both occurrences.

- Common developer workflows (how-to)
  - Run the (optional) backend locally:
    ```bash
    npm install
    npm start   # runs `node server.js` (server listens on port 3000)
    ```
  - Open the frontend: just open `index.html` in a browser, or visit `http://localhost:3000/index.html` when the server is running (server serves static files).
  - To enable Twilio for real SMS, set environment variables before starting the server (preferred):
    - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
  - To enable YouTube API access, replace `API_KEY` in `app.js` with a valid YouTube Data API v3 key and enable the API in Google Cloud.

- Safety checks and tests AI should do before altering behavior
  - Grep for the exact localStorage keys listed above before renaming them.
  - If changing OTP/session lifetimes, update both `server.js` (OTP expiry) and `auth.js` (session expiry checks).
  - When touching Twilio code, respect the server's fallback behavior — if Twilio client fails, server responds with `simulated: true`.

- Example edits the agent might be asked to make (how to implement concretely)
  - Move secret config to environment vars: read `API_KEY` from process.env in a small wrapper or add a `config.js` used by both server and client builds (document the change and search for hard-coded values).
  - Normalize parent storage: choose `parentInfo` and replace `parentData` occurrences, but also update `app.js` registration flow that currently stores `parentData`.
  - Add a small integration test: start server and call `/api/generate-otp` with a phone number and assert simulated response when Twilio is not configured.

- Where not to guess / human checks required
  - Do not attempt to send real SMS without explicit owner consent and proper credentials. If adding Twilio tests, use the server's simulation mode or mocked Twilio client.
  - API keys / credentials should never be committed. If you find real keys in the repo, flag them and suggest rotating secrets.

If anything here is unclear or you want more examples (e.g., where each localStorage key is read/written), tell me which area to expand and I'll iterate.
