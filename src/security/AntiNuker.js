class AntiNuker {
  constructor(client) {
    this.client = client;
    this.actionCache = new Map();
    this.THRESHOLD = 4;
    this.WINDOW = 8000;
  }

  track(guildId, actionType, executor) {
    const key = `${guildId}:${actionType}`;
    const now = Date.now();

    if (!this.actionCache.has(key)) {
      this.actionCache.set(key, []);
    }

    const actions = this.actionCache.get(key);
    actions.push({ executor, time: now });

    const recent = actions.filter(a => now - a.time < this.WINDOW);
    this.actionCache.set(key, recent);

    if (recent.length >= this.THRESHOLD) {
      const unique = [...new Set(recent.map(a => a.executor?.id).filter(Boolean))];
      return { detected: true, count: recent.length, type: actionType, executors: unique };
    }

    return { detected: false, count: recent.length };
  }

  async handleNuker(guild, report) {
    for (const executorId of report.executors) {
      try {
        const member = await guild.members.fetch(executorId).catch(() => null);
        if (!member) continue;

        await member.ban({ reason: `[ANTI_NUKER] Detected: ${report.type} (${report.count} actions in ${this.WINDOW/1000}s)` });
      } catch {}
    }
  }
}

module.exports = AntiNuker;
