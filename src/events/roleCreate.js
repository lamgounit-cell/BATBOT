module.exports = {
  name: 'roleCreate',
  async execute(role, client) {
    if (client.logger) client.logger.logRoleCreate(role);
    if (client.security) {
      const audit = await role.guild.fetchAuditLogs({ limit: 1, type: 30 }).catch(() => null);
      client.security.handleNukerAction(role.guild, 'ROLE_CREATE', audit?.entries.first()?.executor);
    }
  },
};
