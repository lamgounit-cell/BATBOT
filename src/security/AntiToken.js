class AntiToken {
  constructor(client) {
    this.client = client;
    this.webhookSpamCache = new Map();
  }

  checkWebhook(webhook) {
    const name = webhook.name?.toLowerCase() || '';
    const suspicious = ['nitro', 'free', 'gift', 'steal', 'hack', 'token', 'verify', 'claim'];
    for (const word of suspicious) {
      if (name.includes(word)) return { detected: true, reason: 'suspicious_webhook_name', word };
    }
    return { detected: false };
  }

  trackWebhookSpam(guildId) {
    const now = Date.now();
    if (!this.webhookSpamCache.has(guildId)) {
      this.webhookSpamCache.set(guildId, []);
    }
    const hooks = this.webhookSpamCache.get(guildId);
    hooks.push(now);
    const recent = hooks.filter(t => now - t < 60000);
    this.webhookSpamCache.set(guildId, recent);
    return recent.length > 3;
  }
}

module.exports = AntiToken;
