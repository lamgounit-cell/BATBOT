class LevelingService {
  constructor(client) {
    this.client = client;
    this.xpCooldowns = new Map();
    this.COOLDOWN_MS = 60000;
    this.MIN_XP = 15;
    this.MAX_XP = 25;
    client.leveling = this;
  }

  xpForLevel(level) { return Math.floor(5 * Math.pow(level, 2) + 50 * level + 100); }

  async addXp(member) {
    if (member.user.bot) return;
    const key = `${member.guild.id}:${member.id}`;
    const now = Date.now();
    if (this.xpCooldowns.has(key) && now - this.xpCooldowns.get(key) < this.COOLDOWN_MS) return;
    this.xpCooldowns.set(key, now);

    const row = this.client.db.get('SELECT * FROM levels WHERE user_id = $user_id AND guild_id = $guild_id', { user_id: member.id, guild_id: member.guild.id });
    const xpGain = Math.floor(Math.random() * 11) + 15;
    const currentXp = (row?.xp || 0) + xpGain;
    const currentLevel = row?.level || 1;
    const needed = this.xpForLevel(currentLevel);

    if (currentXp >= needed) {
      const newLevel = currentLevel + 1;
      this.client.db.run(
        'INSERT INTO levels (user_id, guild_id, xp, level) VALUES ($user_id, $guild_id, $xp, $level) ON CONFLICT(user_id, guild_id) DO UPDATE SET xp = $xp2, level = $level2',
        { user_id: member.id, guild_id: member.guild.id, xp: currentXp - needed, level: newLevel, xp2: currentXp - needed, level2: newLevel }
      );
      return { leveledUp: true, oldLevel: currentLevel, newLevel };
    }

    this.client.db.run(
      'INSERT INTO levels (user_id, guild_id, xp, level) VALUES ($user_id, $guild_id, $xp, 1) ON CONFLICT(user_id, guild_id) DO UPDATE SET xp = $xp2',
      { user_id: member.id, guild_id: member.guild.id, xp: currentXp, xp2: currentXp }
    );
    return null;
  }

  getRank(userId, guildId) {
    const all = this.client.db.all('SELECT user_id, xp, level FROM levels WHERE guild_id = $guild_id ORDER BY level DESC, xp DESC', { guild_id: guildId });
    const idx = all.findIndex(r => r.user_id === userId);
    return idx === -1 ? null : { rank: idx + 1, total: all.length };
  }

  getLeaderboard(guildId, limit = 10) {
    return this.client.db.all('SELECT user_id, xp, level FROM levels WHERE guild_id = $guild_id ORDER BY level DESC, xp DESC LIMIT $limit', { guild_id: guildId, limit });
  }
}

module.exports = LevelingService;
