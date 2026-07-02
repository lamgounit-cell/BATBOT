module.exports = {
  name: 'channelDelete',
  async execute(channel, client) {
    if (!channel.guild) return;
    if (client.logger) client.logger.logChannelDelete(channel);
    if (client.security) {
      const audit = await channel.guild.fetchAuditLogs({ limit: 1, type: 12 }).catch(() => null);
      client.security.handleNukerAction(channel.guild, 'CHANNEL_DELETE', audit?.entries.first()?.executor);
    }
  },
};
