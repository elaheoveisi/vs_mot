/**
 * iHuman Lab shared leaderboard backend.
 *
 * Deploy this code as a Google Apps Script Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 */

const SPREADSHEET_ID = '1S1mD2CJWAmTycCq7msOKrO4Vxg_7OXi4d4qnluPLdUg';
const SHEET_NAME = 'Leaderboard';
const MAX_ATTEMPTS_PER_MODULE = 3;
const HEADERS = [
  'email',
  'game',
  'date',
  'accuracy',
  'meanRT',
  'falseAlarms',
  'trialsJson'
];

function doGet() {
  try {
    const sheet = getLeaderboardSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonResponse_([]);

    const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    const results = rows.map(function (row) {
      const email = normalizeEmail_(row[0]);
      return {
        player: maskEmail_(email),
        emailHash: hashEmail_(email),
        game: String(row[1] || ''),
        date: normalizeDate_(row[2]),
        accuracy: toFiniteNumber_(row[3], 0),
        meanRT: row[4] === '' ? null : toFiniteNumber_(row[4], 0),
        falseAlarms: row[5] === '' ? null : toFiniteNumber_(row[5], 0),
        trials: parseTrials_(row[6])
      };
    }).filter(function (entry) {
      return entry.game === 'vs' || entry.game === 'mot';
    });

    return jsonResponse_(results);
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error.message || error) });
  }
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const raw = event && event.postData ? event.postData.contents : '{}';
    const entry = JSON.parse(raw || '{}');
    const game = entry.game === 'vs' || entry.game === 'mot' ? entry.game : '';
    if (!game) throw new Error('Invalid game type.');

    const email = normalizeEmail_(entry.email);
    if (!isValidEmail_(email)) throw new Error('A valid participant email is required.');

    const sheet = getLeaderboardSheet_();
    const existingAttempts = countAttempts_(sheet, email, game);
    if (existingAttempts >= MAX_ATTEMPTS_PER_MODULE) {
      throw new Error('The maximum of three attempts for this module has been reached.');
    }

    const date = normalizeDate_(entry.date || new Date().toISOString());
    const accuracy = clamp_(toFiniteNumber_(entry.accuracy, 0), 0, 100);
    const meanRT = game === 'vs' ? Math.max(0, toFiniteNumber_(entry.meanRT, 0)) : '';
    const falseAlarms = game === 'mot' ? Math.max(0, toFiniteNumber_(entry.falseAlarms, 0)) : '';
    const trialsJson = JSON.stringify(Array.isArray(entry.trials) ? entry.trials : []);

    sheet.appendRow([safeSheetText_(email), game, date, accuracy, meanRT, falseAlarms, trialsJson]);
    return jsonResponse_({ ok: true, attempt: existingAttempts + 1 });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error.message || error) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function getLeaderboardSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  } else {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sheet;
}

function countAttempts_(sheet, email, game) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  return rows.filter(function (row) {
    return normalizeEmail_(row[0]) === email && String(row[1] || '') === game;
  }).length;
}

function normalizeEmail_(value) {
  return String(value || '').replace(/[\r\n\t]+/g, '').trim().toLowerCase().replace(/^'/, '').slice(0, 120);
}

function safeSheetText_(value) {
  const text = String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function maskEmail_(email) {
  const parts = email.split('@');
  if (parts.length !== 2) return 'Participant';
  const local = parts[0];
  return (local.charAt(0) || 'p') + '***@' + parts[1];
}

function hashEmail_(email) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    email,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (byte) {
    const value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function normalizeDate_(value) {
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function toFiniteNumber_(value, fallback) {
  const number = Number(value);
  return isFinite(number) ? number : fallback;
}

function clamp_(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseTrials_(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value || '[]'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
