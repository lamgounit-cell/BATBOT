module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    if (client.logger) {
      const audit = await ban.guild.fetchAuditLogs({ limit: 1, type: 22 }).catch(() => null);
      const entry = audit?.entries.first();
      client.logger.logBan(ban.guild, ban.user, entry?.executor || ban.guild.members.me, entry?.reason);
    }
  },
};
