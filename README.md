# iHuman LAB Visual Instruments

A browser-based visual-search and multiple-object-tracking app for iHuman LAB.

## Run locally

Open `index.html` in a modern browser.

## Data storage

- Participant name, settings, and personal session history are stored in the current browser with `localStorage`.
- The shared leaderboard can use a Google Apps Script web-app endpoint connected to Google Sheets.
- To connect the leaderboard, replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` in `index.html` with the deployed web-app URL.

Without that endpoint, both experiment modules still run, but the shared leaderboard is unavailable.
