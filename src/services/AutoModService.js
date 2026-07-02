const BAD_WORDS = [/fuck/gi, /shit/gi, /asshole/gi, /bitch/gi, /bastard/gi, /cunt/gi, /dick/gi, /piss/gi, /slut/gi, /whore/gi];
const PHISHING = [/free\s*steam/gi, /free\s*robux/gi, /free\s*vbucks/gi, /steamcommunity\.com\/[^\s]*(?:gift|free|trade)/gi, /https?:\/\/[^\s]*(?:steam|steamcommunity|discord)\.[^\s]*(?:gift|free|nitro|claim|login)/gi];
const MALWARE = [/\.exe\b/gi, /\.dll\b/gi, /\.bat\b/gi, /\.vbs\b/gi, /\.ps1\b/gi, /\.jar\b/gi, /\.scr\b/gi];

class AutoModService {
  constructor(client) { this.client = client; this.client.automod = this; }

  async check(message) {
    if (message.author.bot || !message.guild) return null;
    const guildCfg = await this.getGuildConfig(message.guild.id);
    if (!guildCfg?.auto_mod_enabled) return null;
    const content = message.content;
    if (!content) return null;
    const results = [];

    if (guildCfg.bad_words !== false) { for (const p of BAD_WORDS) { if (p.test(content)) { results.push({ type: 'bad_words', action: 'delete' }); break; } } }
    if (guildCfg.phishing !== false) { for (const p of PHISHING) { if (p.test(content)) { results.push({ type: 'phishing', action: 'ban' }); break; } } }
    if (guildCfg.fake_nitro !== false) { if (/discord\.gift\b/i.test(content) || /free.*nitro/i.test(content) || /nitro.*free/i.test(content)) results.push({ type: 'fake_nitro', action: 'delete' }); }
    if (guildCfg.malware !== false) { for (const p of MALWARE) { if (p.test(content)) { results.push({ type: 'malware', action: 'ban' }); break; } } }
    if (guildCfg.excessive_caps !== false && content.length > 15) { const l = content.replace(/[^a-zA-Z]/g, ''); const c = content.replace(/[^A-Z]/g, ''); if (l.length > 0 && c.length / l.length > 0.7) results.push({ type: 'excessive_caps', action: 'warn' }); }
    if (guildCfg.invite_links !== false) { if (/discord(?:\.gg|app\.com\/invite|\.com\/invite)\/[a-zA-Z0-9_-]+/i.test(content)) results.push({ type: 'invite_links', action: 'delete' }); }

    if (results.length > 0) await this.enforce(message, results);
    return results;
  }

  async enforce(message, results) {
    const critical = results.find(r => r.action === 'ban');
    const moderate = results.find(r => r.action === 'delete');
    try {
      if (critical) { await message.delete(); await message.member.ban({ reason: `[AUTOMOD] ${critical.type}` }); return; }
      if (moderate) { await message.delete(); const w = await message.channel.send({ content: `${message.author}, message removed. Reason: ${moderate.type}` }); setTimeout(() => w.delete().catch(() => {}), 4000); return; }
      if (results.find(r => r.action === 'warn')) { await message.delete(); const w = await message.channel.send({ content: `${message.author}, please avoid excessive caps.` }); setTimeout(() => w.delete().catch(() => {}), 4000); }
    } catch {}
  }

  async getGuildConfig(guildId) {
    const row = this.client.db.get('SELECT * FROM guilds WHERE id = $id', { id: guildId });
    if (!row) return null;
    const guildCfg = this.client.db.all('SELECT key, value FROM config WHERE guild_id = $guild_id', { guild_id: guildId });
    const cfg = {};
    for (const c of guildCfg) { try { cfg[c.key] = JSON.parse(c.value); } catch { cfg[c.key] = c.value; } }
    return { ...row, ...cfg };
  }
}

module.exports = AutoModService;
