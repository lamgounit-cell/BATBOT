const config = require('./config');
const db = require('./database/Database');
const { startKeepAlive, app } = require('./keepalive');

if (!config.token || config.token === 'your_bot_token_here') {
  console.error('[FATAL] No bot token provided. Set TOKEN in .env');
  process.exit(1);
}

async function start() {
  await db.ready;

  const { Client, GatewayIntentBits, Partials } = require('discord.js');
  const CommandHandler = require('./handlers/CommandHandler');
  const EventHandler = require('./handlers/EventHandler');
  const ComponentHandler = require('./handlers/ComponentHandler');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildScheduledEvents,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember, Partials.ThreadMember],
  });

  client.config = config;
  client.db = db;

  new CommandHandler(client).load();
  new EventHandler(client).load();
  new ComponentHandler(client).load();

  new (require('./services/SecurityService'))(client);
  new (require('./services/AutoModService'))(client);
  new (require('./services/LoggingService'))(client);
  new (require('./services/ModerationService'))(client);
  new (require('./services/TicketService'))(client);
  new (require('./services/WelcomeService'))(client);
  new (require('./services/LevelingService'))(client);
  new (require('./services/EconomyService'))(client);
  new (require('./services/VerificationService'))(client);
  new (require('./services/VoiceAFKService'))(client);
  new (require('./services/DashboardService'))(client, app);

  if (config.freeTheAiKey) {
    new (require('./ai/FreeTheAiService'))(client);
    new (require('./ai/MemoryService'))(client);
  }

  setInterval(() => {
    const now = new Date();
    const rows = client.db.all('SELECT * FROM birthdays WHERE month = $m AND day = $d', { m: now.getMonth() + 1, d: now.getDate() });
    for (const row of rows) {
      const guild = client.guilds.cache.get(row.guild_id);
      if (!guild) continue;
      const channel = guild.channels.cache.find(c => c.type === 0 && c.name.includes('general'));
      if (channel) channel.send(`🎂 Happy birthday <@${row.user_id}>!`).catch(() => {});
    }
  }, 3600000);

  startKeepAlive();

  process.on('unhandledRejection', (reason) => console.error('[ANTI_CRASH] Unhandled Rejection:', reason));
  process.on('uncaughtException', (err) => console.error('[ANTI_CRASH] Uncaught Exception:', err));
  process.on('warning', (warn) => console.warn('[ANTI_CRASH] Warning:', warn));

  console.log(`[LOGIN] Attempting login (token present: ${!!config.token}, prefix: ${config.token?.substring(0, 4)}...)`);
  client.login(config.token).catch(err => { console.error('[FATAL] Login failed:', err.message, err.name); });
}

start().catch(err => { console.error('[FATAL] Startup error:', err); process.exit(1); });
