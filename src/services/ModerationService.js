const ms = require('ms');
const { canModerate } = require('../utils/Permissions');

class ModerationService {
  constructor(client) { this.client = client; client.moderation = this; }

  async ban(guild, user, options = {}) {
    return guild.members.ban(user, { reason: options.reason || 'No reason provided', deleteMessageSeconds: (options.deleteDays || 0) * 86400 });
  }

  async softban(guild, user, options = {}) {
    const reason = options.reason || 'No reason provided';
    await guild.members.ban(user, { reason, deleteMessageSeconds: 86400 });
    await guild.members.unban(user, `[SOFTBAN] ${reason}`);
  }

  async tempban(guild, user, duration, options = {}) {
    const reason = options.reason || 'No reason provided';
    await guild.members.ban(user, { reason: `[TEMPBAN ${duration}] ${reason}` });
    setTimeout(async () => {
      try { await guild.members.unban(user, '[TEMPBAN] Duration expired'); } catch {}
    }, ms(duration));
  }

  async kick(member, options = {}) { return member.kick(options.reason || 'No reason provided'); }

  async timeout(member, duration, options = {}) {
    const msDuration = typeof duration === 'string' ? ms(duration) : duration;
    return member.timeout(msDuration, options.reason || 'No reason provided');
  }

  async warn(guildId, userId, moderatorId, reason) {
    const result = this.client.db.run(
      'INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES ($guild_id, $user_id, $moderator_id, $reason)',
      { guild_id: guildId, user_id: userId, moderator_id: moderatorId, reason }
    );
    return result.lastInsertRowid;
  }

  getWarnings(guildId, userId) {
    return this.client.db.all(
      'SELECT * FROM warnings WHERE guild_id = $guild_id AND user_id = $user_id AND active = 1 ORDER BY timestamp DESC',
      { guild_id: guildId, user_id: userId }
    );
  }

  clearWarnings(guildId, userId) {
    return this.client.db.run(
      'UPDATE warnings SET active = 0 WHERE guild_id = $guild_id AND user_id = $user_id',
      { guild_id: guildId, user_id: userId }
    );
  }

  async purge(channel, amount, options = {}) {
    let messages;
    if (options.user) {
      const all = await channel.messages.fetch({ limit: Math.min(amount + 20, 100) });
      messages = all.filter(m => m.author.id === options.user.id).first(amount);
    } else {
      messages = await channel.bulkDelete(Math.min(amount, 100), true);
    }
    return messages?.size || 0;
  }

  async lock(channel) { return channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: false }); }
  async unlock(channel) { return channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: null }); }
  async setSlowmode(channel, seconds) { return channel.setRateLimitPerUser(seconds); }
}

module.exports = ModerationService;
