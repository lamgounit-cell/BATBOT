module.exports = {
  name: 'channelCreate',
  async execute(channel, client) {
    if (!channel.guild) return;
    if (client.logger) client.logger.logChannelCreate(channel);
    if (client.security) {
      const audit = await channel.guild.fetchAuditLogs({ limit: 1, type: 10 }).catch(() => null);
      client.security.handleNukerAction(channel.guild, 'CHANNEL_CREATE', audit?.entries.first()?.executor);
    }
  },
};
