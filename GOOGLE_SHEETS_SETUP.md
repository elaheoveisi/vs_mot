# Connect the shared leaderboard

The website needs a deployed Google Apps Script Web App URL. A normal Google Sheet sharing URL cannot receive website results.

## Deploy the backend

1. Open [Google Apps Script](https://script.google.com/) and create a new project.
2. Delete the example `myFunction` code.
3. Copy all of [`google-apps-script.gs`](google-apps-script.gs) into `Code.gs`.
4. Save the project as `iHuman Lab Leaderboard API`.
5. Select **Deploy > New deployment**.
6. Select **Web app**.
7. Set **Execute as** to **Me**.
8. Set **Who has access** to **Anyone**.
9. Deploy and approve access to the iHuman Lab Leaderboard Sheet.
10. Copy the Web App URL ending in `/exec`.

Do not use a `/dev` test URL.

## Connect the website

Replace this line in `index.html`:

```js
const RESULTS_API_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
```

with the deployed `/exec` URL, then publish `index.html` again.

The backend writes to spreadsheet ID `1S1mD2CJWAmTycCq7msOKrO4Vxg_7OXi4d4qnluPLdUg`, enforces three attempts per email for each module, and returns masked participant emails to the public leaderboard.

