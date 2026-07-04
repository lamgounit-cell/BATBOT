const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

module.exports = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  dbPath: process.env.DB_PATH || './database.sqlite',
  prefix: process.env.PREFIX || '!',
  embedColor: parseInt(process.env.EMBED_COLOR?.replace('#', ''), 16) || 0x5865F2,
  logLevel: process.env.LOG_LEVEL || 'info',
  developers: process.env.DEVELOPERS?.split(',').map(id => id.trim()) || [],
  owners: process.env.OWNERS?.split(',').map(id => id.trim()) || [],
  geminiKey: process.env.GEMINI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-2.0-flash',
  aiMaxHistory: parseInt(process.env.AI_MAX_HISTORY) || 20,
  aiEnabled: process.env.AI_ENABLED !== 'false',
};
