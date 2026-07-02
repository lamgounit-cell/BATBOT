module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    if (client.welcome) await client.welcome.handleMemberLeave(member);
    if (client.logger) client.logger.logMemberLeave(member);
  },
};
