module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;
    if (!client.security) return;

    const violations = client.security.handleMessage(message);
    if (client.automod) await client.automod.check(message);

    if (client.leveling && violations.length === 0) {
      const result = await client.leveling.addXp(message.member);
      if (result?.leveledUp) {
        const channel = message.channel;
        channel.send(`🎉 ${message.author}, you leveled up to **Level ${result.newLevel}**!`).catch(() => {});
      }
    }

    if (violations.length === 0) return;

    const critical = violations.find(v => v.severity === 'critical');
    const high = violations.find(v => v.severity === 'high');

    try {
      if (critical) {
        await message.delete();
        await message.member.ban({ reason: `[SECURITY] ${critical.type}` });
        return;
      }

      if (high) {
        await message.delete();
        await message.member.timeout(600000, `[SECURITY] ${high.type}`);
        return;
      }

      await message.delete();
      const warning = await message.channel.send({
        content: `${message.author}, please avoid: ${violations.map(v => v.type).join(', ')}`,
      });
      setTimeout(() => warning.delete().catch(() => {}), 5000);
    } catch {}
  },
};
