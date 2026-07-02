const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.json({ status: 'alive', bot: 'BATBOT' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

function startKeepAlive() {
  app.listen(PORT, () => console.log(`[KEEPALIVE] Web server running on port ${PORT}`));
}

module.exports = { startKeepAlive, app };
