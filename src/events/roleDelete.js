module.exports = {
  name: 'roleDelete',
  async execute(role, client) {
    if (client.logger) client.logger.logRoleDelete(role);
    if (client.security) {
      const audit = await role.guild.fetchAuditLogs({ limit: 1, type: 32 }).catch(() => null);
      client.security.handleNukerAction(role.guild, 'ROLE_DELETE', audit?.entries.first()?.executor);
    }
  },
};
