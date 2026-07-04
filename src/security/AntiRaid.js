const { PermissionsBitField, EmbedBuilder } = require('discord.js');

class AntiRaid {
  constructor(client) {
    this.client = client;
    this.joinCache = new Map();
    this.lockdownCache = new Map();
    this.RAID_THRESHOLD = 7;
    this.RAID_WINDOW = 10000;
  }

  checkJoin(member) {
    const guildId = member.guild.id;
    const now = Date.now();

    if (!this.joinCache.has(guildId)) {
      this.joinCache.set(guildId, []);
    }

    const joins = this.joinCache.get(guildId);
    joins.push({ id: member.id, time: now });

    const recent = joins.filter(j => now - j.time < this.RAID_WINDOW);
    this.joinCache.set(guildId, recent);

    if (recent.length >= this.RAID_THRESHOLD) {
      return { raid: true, count: recent.length };
    }

    return { raid: false, count: recent.length };
  }

  async activateLockdown(guild) {
    if (this.lockdownCache.get(guild.id)) return;

    try {
      const channels = guild.channels.cache.filter(c => c.isTextBased());
      for (const channel of channels.values()) {
        try {
          await channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: false,
            AddReactions: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false,
          });
        } catch {}
      }

      this.lockdownCache.set(guild.id, Date.now());
      return true;
    } catch {
      return false;
    }
  }

  async deactivateLockdown(guild) {
    if (!this.lockdownCache.has(guild.id)) return;

    try {
      const channels = guild.channels.cache.filter(c => c.isTextBased());
      for (const channel of channels.values()) {
        try {
          await channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: null,
            AddReactions: null,
            CreatePublicThreads: null,
            CreatePrivateThreads: null,
          });
        } catch {}
      }

      this.lockdownCache.delete(guild.id);
      return true;
    } catch {
      return false;
    }
  }

  isLockedDown(guildId) {
    return this.lockdownCache.has(guildId);
  }
}

module.exports = AntiRaid;
