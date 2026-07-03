const express = require('express');
const fs = require('fs');

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

function startKeepAlive() {
  app.listen(PORT, () => {
    console.log(`[KEEPALIVE] Web server running on port ${PORT}`);
    try {
      const ff = require('ffmpeg-static');
      console.log(`[DIAG] ffmpeg: ${ff} (exists: ${fs.existsSync(ff)})`);
    } catch (e) { console.log('[DIAG] ffmpeg: NOT FOUND'); }
    try {
      const c = require('yt-dlp-exec/src/constants');
      console.log(`[DIAG] yt-dlp: ${c.YOUTUBE_DL_PATH} (exists: ${fs.existsSync(c.YOUTUBE_DL_PATH)})`);
    } catch (e) { console.log('[DIAG] yt-dlp: NOT FOUND'); }
  });
}

module.exports = { startKeepAlive, app };
