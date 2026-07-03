const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => res.json({ status: 'alive', bot: 'BATBOT' }));

app.get('/diagnostics', (req, res) => {
  const checks = {};
  try {
    const ff = require('ffmpeg-static');
    checks.ffmpeg = { path: ff, exists: fs.existsSync(ff) };
  } catch (e) { checks.ffmpeg = { error: e.message }; }
  try {
    const c = require('yt-dlp-exec/src/constants');
    checks.ytdlp = { path: c.YOUTUBE_DL_PATH, exists: fs.existsSync(c.YOUTUBE_DL_PATH) };
  } catch (e) { checks.ytdlp = { error: e.message }; }
  res.json(checks);
});

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode >= 300 && res.location) return downloadFile(res.location, dest).then(resolve, reject);
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function ensureBinaries() {
  try {
    const ff = require('ffmpeg-static');
    console.log(`[DIAG] ffmpeg: ${ff} (exists: ${fs.existsSync(ff)})`);
  } catch (e) { console.log('[DIAG] ffmpeg: NOT FOUND', e.message); }

  const ytBin = path.join(__dirname, '..', 'node_modules', 'yt-dlp-exec', 'bin',
    process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  const localYt = path.join(__dirname, '..', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

  for (const ytPath of [ytBin, localYt]) {
    if (fs.existsSync(ytPath)) { console.log(`[DIAG] yt-dlp: ${ytPath} (exists: true)`); return; }
  }

  console.log('[DIAG] yt-dlp not found, downloading...');
  try {
    const isWin = process.platform === 'win32';
    const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${isWin ? 'yt-dlp.exe' : 'yt-dlp'}`;
    const dest = path.join(__dirname, '..', `yt-dlp${isWin ? '.exe' : ''}`);
    await downloadFile(url, dest);
    fs.chmodSync(dest, 0o755);
    console.log(`[DIAG] yt-dlp downloaded to ${dest}`);
    if (fs.existsSync(ytBin)) fs.copyFileSync(dest, ytBin);
  } catch (e) {
    console.log('[DIAG] yt-dlp download failed:', e.message);
  }
}

function startKeepAlive() {
  ensureBinaries().then(() => {
    app.listen(PORT, () => console.log(`[KEEPALIVE] Web server running on port ${PORT}`));
  });
}

module.exports = { startKeepAlive, app };