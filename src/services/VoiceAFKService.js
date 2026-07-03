class VoiceAFKService {
  constructor(client) {
    this.client = client;
    this.afkTimers = new Map();
    this.voiceJoins = new Map();
    client.voiceAFK = this;
    setInterval(() => this.awardVoiceXp(), 300000);
    console.log('[VOICE_AFK] Initialized');
  }

  handleVoiceUpdate(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;
    const guildId = member.guild.id;
    const key = `${guildId}:${member.id}`;

    if (newState.channelId && !oldState.channelId) {
      this.voiceJoins.set(key, Date.now());
      const timer = setTimeout(() => this.moveToOverthinking(member), 30 * 60 * 1000);
      this.afkTimers.set(key, timer);
    }

    if (!newState.channelId && oldState.channelId) {
      if (this.afkTimers.has(key)) { clearTimeout(this.afkTimers.get(key)); this.afkTimers.delete(key); }
      this.voiceJoins.delete(key);
    }
  }

  async awardVoiceXp() {
    const now = Date.now();
    for (const [key, joinedAt] of this.voiceJoins) {
      if (now - joinedAt < 300000) continue;
      this.voiceJoins.set(key, now);
      const [guildId, userId] = key.split(':');
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) continue;
      const config = this.client.db.get('SELECT leveling_enabled FROM guilds WHERE id = $id', { id: guildId });
      if (!config?.leveling_enabled) continue;
      const member = guild.members.cache.get(userId);
      if (!member || !member.voice.channelId) { this.voiceJoins.delete(key); continue; }
      const xpGain = Math.floor(Math.random() * 11) + 10;
      const row = this.client.db.get('SELECT * FROM levels WHERE user_id = $uid AND guild_id = $gid', { uid: userId, gid: guildId });
      const currentXp = (row?.xp || 0) + xpGain;
      const currentLevel = row?.level || 1;
      const needed = Math.floor(5 * Math.pow(currentLevel, 2) + 50 * currentLevel + 100);
      if (currentXp >= needed) {
        const newLevel = currentLevel + 1;
        this.client.db.run(
          'INSERT INTO levels (user_id, guild_id, xp, level) VALUES ($uid, $gid, $xp, $lvl) ON CONFLICT(user_id, guild_id) DO UPDATE SET xp = $xp2, level = $lvl2',
          { uid: userId, gid: guildId, xp: currentXp - needed, lvl: newLevel, xp2: currentXp - needed, lvl2: newLevel }
        );
        const reward = this.client.db.get('SELECT * FROM level_rewards WHERE guild_id = $gid AND level = $lvl', { gid: guildId, lvl: newLevel });
        if (reward) {
          const role = guild.roles.cache.get(reward.role_id);
          if (role) try { await member.roles.add(role); } catch {}
        }
      } else {
        this.client.db.run(
          'INSERT INTO levels (user_id, guild_id, xp, level) VALUES ($uid, $gid, $xp, 1) ON CONFLICT(user_id, guild_id) DO UPDATE SET xp = $xp2',
          { uid: userId, gid: guildId, xp: currentXp, xp2: currentXp }
        );
      }
    }
  }

  async moveToOverthinking(member) {
    const key = `${member.guild.id}:${member.id}`;
    this.afkTimers.delete(key);
    if (!member.voice.channelId) return;
    const overthinking = member.guild.channels.cache.find(c => c.type === 2 && c.name.toLowerCase() === 'overthinking');
    if (!overthinking) return;
    try { await member.voice.setChannel(overthinking.id); } catch {}
  }
}

module.exports = VoiceAFKService;