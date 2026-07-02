module.exports = {
  name: 'guildBanRemove',
  async execute(ban, client) {
    if (client.logger) client.logger.logUnban(ban.guild, ban.user);
  },
};
