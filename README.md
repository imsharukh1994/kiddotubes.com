<p align="center">
  <img src="assets/logos.png" alt="Kiddotubes Logo" width="200"/>
</p>

# Kiddotubes

A kid-friendly YouTube video platform built with vanilla HTML, CSS, and JavaScript.

## Features

- Kid-friendly interface with colorful design and large icons  
- Fetches videos using the YouTube Data API v3  
- Responsive grid layout for video thumbnails  
- Embedded YouTube player for watching videos  
- Parent control system with 6-digit PIN protection  
- Watch history tracking in localStorage  
- Search functionality for finding kid-safe videos  
- Category navigation (Shows, Music, Explore, Movies, Shorts)

## Setup Instructions

1. Clone or download this repository  
2. Copy `env.example` to `.env` and fill required values (Stripe, Twilio, etc.)  
3. Install dependencies and start the server  
   - `npm install`  
   - `npm start`  
4. Open `http://localhost:3000` in your browser  
5. YouTube API key: either set `YOUTUBE_API_KEY` in `.env` and proxy via server, or keep the client key restricted to your domain in Google Cloud.  

## Using the Application

1. **First-time setup**: When you first try to watch a video, you'll be prompted to create a 6-digit parent PIN  
2. **Watching videos**: Click on any video thumbnail to open the parent control modal  
   - Enter your PIN to watch the video  
   - The video will play in an embedded YouTube player  
3. **Searching for videos**: Use the search bar at the top to find kid-friendly videos  
4. **Browsing categories**: Click on the navigation items (Shows, Music, etc.) to browse different categories  
5. **View watch history**: Click on the profile icon in the top-right corner to view watch history  

## Parent Control System

- The 4-digit PIN is stored in the browser's localStorage  
- PIN is required each time a video is played  
- Watch history is logged in localStorage and can be viewed by clicking the profile icon  

## Twilio Integration (Optional)

To enable SMS/WhatsApp notifications to parents:

1. Server sends SMS; client does not contain Twilio secrets.  
2. Configure environment variables in `.env` and set `PUBLIC_URL` to your site origin.  
3. Server will send messages via Twilio with the format:  
   `"Zakaria watched: [Video Title] on Kiddotubes.com"`

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript (no frameworks)  
- Uses CSS Grid and Flexbox for responsive layouts  
- Stores data in browser's localStorage (PIN, session timer, preferences)  
- Fetches videos from YouTube Data API v3  

### Security & Hardening (MVP)
- Static files served from `public/` only
- Helmet and compression enabled
- CORS origin can be configured via `CORS_ORIGIN`
- Stripe webhooks verified with signature (set `STRIPE_WEBHOOK_SECRET`)
- OTP generation and verification are rate-limited

### Parental Controls
- 6-digit PIN protects playback and dashboard
- Daily watch limit and allowed time window can be configured in Settings (enforced before playback)

## Browser Compatibility

- Chrome (recommended)  
- Firefox  
- Safari  
- Edge  

## Note

This is a frontend-only application. For a production environment, it's recommended to implement proper backend authentication and secure API key handling.
