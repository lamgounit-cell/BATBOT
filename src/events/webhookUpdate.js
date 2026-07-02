module.exports = {
  name: 'webhookUpdate',
  async execute(channel, client) {
    if (!client.security || !channel.guild) return;
    const audit = await channel.guild.fetchAuditLogs({ limit: 1, type: 51 }).catch(() => null);
    const executor = audit?.entries.first()?.executor;
    const webhooks = await channel.fetchWebhooks().catch(() => []);
    for (const hook of webhooks) {
      const check = client.security.handleWebhookCreate(hook);
      if (check.detected) {
        await hook.delete(`[SECURITY] ${check.reason}`).catch(() => {});
        client.security.triggerSecurityAlert(channel.guild, 'Suspicious Webhook Deleted', { name: hook.name });
      }
    }
  },
};
