# Kiddotubes

A kid-friendly YouTube video platform built with vanilla HTML, CSS, and JavaScript.

## Features

- Kid-friendly interface with colorful design and large icons
- Fetches videos using the YouTube Data API v3
- Responsive grid layout for video thumbnails
- Embedded YouTube player for watching videos
- Parent control system with 4-digit PIN protection
- Watch history tracking in localStorage
- Search functionality for finding kid-safe videos
- Category navigation (Shows, Music, Explore, Movies, Shorts)

## Setup Instructions

1. Clone or download this repository
2. Open `app.js` and replace `YOUR_YOUTUBE_API_KEY` with your own YouTube Data API key
   - If you don't have an API key, you can get one from the [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the YouTube Data API v3 in your Google Cloud project
3. Open `index.html` in your web browser

## Using the Application

1. **First-time setup**: When you first try to watch a video, you'll be prompted to create a 4-digit parent PIN
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

1. Set up a backend server with Twilio integration
2. Modify the `sendParentNotification()` function in `app.js` to make API calls to your backend
3. Configure your backend to send messages via Twilio with the format: "Zakaria watched: [Video Title] on Kiddotubes.com"

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript (no frameworks)
- Uses CSS Grid and Flexbox for responsive layouts
- Stores data in browser's localStorage
- Fetches videos from YouTube Data API v3

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Note

This is a frontend-only application. For a production environment, it's recommended to implement proper backend authentication and secure API key handling.
