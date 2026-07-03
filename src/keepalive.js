const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => res.json({ status: 'alive', bot: 'BATBOT' }));

let diagnostics = {};

app.get('/diagnostics', (req, res) => res.json(diagnostics));

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode >= 300 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) { file.close(); fs.unlinkSync(dest); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { file.close(); try { fs.unlinkSync(dest); } catch {} reject(err); });
  });
}

async function ensureBinaries() {
  const checks = {};
  try {
    const ff = require('ffmpeg-static');
    const exists = fs.existsSync(ff);
    checks.ffmpeg = { path: ff, exists };
    console.log(`[DIAG] ffmpeg: ${ff} (exists: ${exists})`);
  } catch (e) { checks.ffmpeg = { error: e.message }; console.log('[DIAG] ffmpeg: NOT FOUND'); }

  const isWin = process.platform === 'win32';
  const ytName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  const ytDlpBin = path.join(__dirname, '..', 'node_modules', 'yt-dlp-exec', 'bin', ytName);
  const localYt = path.join(__dirname, '..', ytName);

  let found = false;
  for (const ytPath of [ytDlpBin, localYt]) {
    if (fs.existsSync(ytPath)) {
      checks.ytdlp = { path: ytPath, exists: true };
      console.log(`[DIAG] yt-dlp: ${ytPath} (exists: true)`);
      found = true;
      break;
    }
  }

  if (!found) {
    console.log('[DIAG] yt-dlp not found, downloading...');
    try {
      const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${ytName}`;
      await downloadFile(url, localYt);
      fs.chmodSync(localYt, 0o755);
      console.log(`[DIAG] yt-dlp downloaded to ${localYt}`);
      checks.ytdlp = { path: localYt, exists: true };
      if (fs.existsSync(ytDlpBin)) {
        try { fs.copyFileSync(localYt, ytDlpBin); } catch {}
      }
    } catch (e) {
      checks.ytdlp = { error: e.message };
      console.log('[DIAG] yt-dlp download failed:', e.message);
    }
  }

  diagnostics = checks;
}

function startKeepAlive() {
  app.listen(PORT, () => {
    console.log(`[KEEPALIVE] Web server running on port ${PORT}`);
    ensureBinaries();
  });
}

module.exports = { startKeepAlive, app };