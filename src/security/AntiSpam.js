const SCAM_PATTERNS = [
  /discord\.gift\b/i, /discord-nitro/i, /free.*nitro/i, /nitro.*free/i,
  /steamcommunity\.com\/gift\b/i, /giveaway.*nitro/i, /nitro.*giveaway/i,
  /xbox.*gift/i, /psn.*gift/i, /free.*steam/i,
  /https?:\/\/[^\s]*(?:nitro|free|gift|hack|steam|claim|reward|verify|airdrop)/i,
  /@everyone.*(?:nitro|free|gift)/i,
];

const DISCORD_INVITE = /discord(?:\.gg|app\.com\/invite|\.com\/invite)\/[a-zA-Z0-9_-]+/i;
const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const ZALGO = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u0900-\u0903\u093a-\u094d\u0951-\u0954\u0962\u0963\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d02\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f\u109a-\u109d\u1100-\u1159\u1160-\u11a2\u11a8-\u11f9]/u;
class AntiSpam {
  constructor(client) {
    this.client = client;
    this.messageCache = new Map();
    this.THRESHOLD_MESSAGES = 5;
    this.THRESHOLD_MENTIONS = 4;
    this.THRESHOLD_CAPS_RATIO = 0.7;
    this.THRESHOLD_CHAR_FLOOD = 20;
    this.WINDOW_MS = 4000;
  }

  check(message) {
    const content = message.content;
    const author = message.author;
    const results = [];

    if (!content && message.attachments.size === 0) return results;

    // Message spam
    const spamCheck = this.checkMessageSpam(author.id, message.guild?.id);
    if (spamCheck) results.push({ type: 'MESSAGE_SPAM', severity: 'high', ...spamCheck });

    // Mention spam
    if (message.mentions.users.size > this.THRESHOLD_MENTIONS) {
      results.push({ type: 'MENTION_SPAM', severity: 'high', mentions: message.mentions.users.size });
    }

    // URL spam
    if (content) {
      const urls = content.match(URL_PATTERN) || [];
      if (urls.length > 3) {
        results.push({ type: 'URL_SPAM', severity: 'medium', count: urls.length });
      }
    }

    // Discord invite
    if (content && DISCORD_INVITE.test(content)) {
      results.push({ type: 'INVITE_SPAM', severity: 'high' });
    }

    // Scam patterns
    for (const pattern of SCAM_PATTERNS) {
      if (content && pattern.test(content)) {
        results.push({ type: 'SCAM_LINK', severity: 'critical', match: pattern.source });
        break;
      }
    }

    // Repeated messages
    if (content && this.isRepeatedMessage(author.id, content, message.guild?.id)) {
      results.push({ type: 'REPEATED_MESSAGE', severity: 'medium' });
    }

    // Character flooding
    if (content && content.length > 50) {
      const unique = new Set(content.toLowerCase().replace(/\s/g, '')).size;
      const ratio = unique / content.length;
      if (ratio < 0.3) {
        results.push({ type: 'CHARACTER_FLOOD', severity: 'low' });
      }
    }

    // Zalgo text
    if (content && ZALGO.test(content)) {
      results.push({ type: 'ZALGO_TEXT', severity: 'low' });
    }

    // Excessive caps (respect guild toggle via config table)
    if (content && content.length > 10) {
      const cfg = message.guild ? this.client.db.get('SELECT value FROM config WHERE guild_id = $gid AND key = $key', { gid: message.guild.id, key: 'excessive_caps' }) : null;
      if (cfg === null || cfg.value !== 'false') {
        const letters = content.replace(/[^a-zA-Z]/g, '');
        const caps = content.replace(/[^A-Z]/g, '');
        if (letters.length > 0 && caps.length / letters.length > this.THRESHOLD_CAPS_RATIO) {
          results.push({ type: 'EXCESSIVE_CAPS', severity: 'low', ratio: caps.length / letters.length });
        }
      }
    }

    return results;
  }

  checkMessageSpam(userId, guildId) {
    const key = `${guildId}:${userId}`;
    const now = Date.now();

    if (!this.messageCache.has(key)) {
      this.messageCache.set(key, []);
    }

    const timestamps = this.messageCache.get(key);
    timestamps.push(now);

    const recent = timestamps.filter(t => now - t < this.WINDOW_MS);
    this.messageCache.set(key, recent);

    if (recent.length >= this.THRESHOLD_MESSAGES) {
      return { count: recent.length, window: this.WINDOW_MS };
    }

    return null;
  }

  isRepeatedMessage(userId, content, guildId) {
    const key = `repeat:${guildId}:${userId}`;
    const cache = this.client._repeatCache || new Map();
    if (!this.client._repeatCache) this.client._repeatCache = cache;

    const prev = cache.get(key);
    cache.set(key, { content, time: Date.now() });

    if (prev && prev.content === content && Date.now() - prev.time < 10000) {
      return true;
    }
    return false;
  }
}

module.exports = AntiSpam;
