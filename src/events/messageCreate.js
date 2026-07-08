const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    if (message.mentions.has(client.user) && client.ai?.enabled) {
      const text = message.content.replace(/<@!?\d+>/g, '').trim();
      if (text) {
        try {
          const ctx = client.memory.buildContext(message.author.id, 'You are BATBOT AI, the official assistant of the server. Be helpful and concise. No LaTeX.');
          const reply = await client.ai.generate(text, ctx);
          client.memory.addEntry(message.author.id, 'user', text);
          client.memory.addEntry(message.author.id, 'assistant', reply);
          const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(reply.length > 4096 ? reply.slice(0, 4093) + '...' : reply)
            .setTimestamp();
          if (reply.length > 4096) embed.setFooter({ text: 'Response truncated due to length' });
          await message.reply({ embeds: [embed] });
        } catch {}
      }
      return;
    }

    if (!client.security) return;

    const violations = client.security.handleMessage(message);
    if (client.automod) await client.automod.check(message);

    if (client.leveling && violations.length === 0 && client.db.get('SELECT leveling_enabled FROM guilds WHERE id = $id', { id: message.guild.id })?.leveling_enabled) {
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
