/**
 * iHuman Lab shared leaderboard backend.
 *
 * Paste this file into Extensions > Apps Script from the Google Sheet that
 * should store the leaderboard. Deploy it as a Web app that executes as you
 * and is accessible to anyone.
 */

const SHEET_NAME = 'Leaderboard';
const HEADERS = [
  'name',
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
      return {
        name: String(row[0] || 'Anonymous'),
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

    const name = safeText_(entry.name || 'Anonymous', 80);
    const date = normalizeDate_(entry.date || new Date().toISOString());
    const accuracy = clamp_(toFiniteNumber_(entry.accuracy, 0), 0, 100);
    const meanRT = game === 'vs' ? Math.max(0, toFiniteNumber_(entry.meanRT, 0)) : '';
    const falseAlarms = game === 'mot' ? Math.max(0, toFiniteNumber_(entry.falseAlarms, 0)) : '';
    const trialsJson = JSON.stringify(Array.isArray(entry.trials) ? entry.trials : []);

    const sheet = getLeaderboardSheet_();
    sheet.appendRow([name, game, date, accuracy, meanRT, falseAlarms, trialsJson]);
    return jsonResponse_({ ok: true });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error.message || error) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function getLeaderboardSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('This script must be attached to a Google Sheet.');

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function safeText_(value, maxLength) {
  let text = String(value).trim().slice(0, maxLength);
  if (!text) text = 'Anonymous';
  // Prevent names from being interpreted as spreadsheet formulas.
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
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
