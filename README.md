# iHuman Lab Visual Instruments

A browser-based Visual Search and Multiple Object Tracking study for iHuman Lab at Oklahoma State University.

## Participant flow

- A valid email is required; participant names are not collected.
- Each email may complete Visual Search up to three times and Object Tracking up to three times.
- Visual Search allows five seconds from stimulus onset for each response.
- Personal history is cached in the participant's browser.
- Completed results are stored in the private Google Sheet through the Apps Script Web App.
- The public leaderboard displays masked emails.

## Google Sheets connection

Follow [`GOOGLE_SHEETS_SETUP.md`](GOOGLE_SHEETS_SETUP.md). After deployment, replace the placeholder assigned to `RESULTS_API_URL` in `index.html` with the Apps Script Web App URL ending in `/exec`.

