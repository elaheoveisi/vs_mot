# Connect the shared leaderboard

The website already knows how to send Visual Search and Object Tracking results.
It only needs a deployed Google Apps Script Web App URL.

## 1. Create the Sheet

1. Create a new Google Sheet and name it `iHuman Lab Leaderboard`.
2. In the Sheet, open **Extensions > Apps Script**.
3. Delete the example code in `Code.gs`.
4. Copy all of [`google-apps-script.gs`](google-apps-script.gs) into `Code.gs`.
5. Save the project and name it `iHuman Lab Leaderboard API`.

## 2. Deploy the Web App

1. Select **Deploy > New deployment**.
2. Next to **Select type**, choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Select **Deploy** and approve Google's authorization prompts.
6. Copy the **Web app URL** ending in `/exec`.

Do not use the test-deployment `/dev` URL. The public website needs the
versioned `/exec` URL.

## 3. Connect the Website

Send the `/exec` URL to the site maintainer. It replaces this line in
`index.html`:

```js
const LEADERBOARD_API_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
```

After the site is updated, complete one experiment and open **Leaderboard**.
The script automatically creates a `Leaderboard` tab and adds the result.

## Updating the Backend Later

After changing the Apps Script code, use **Deploy > Manage deployments**, edit
the active deployment, select a new version, and deploy it. This keeps the same
Web App URL.
