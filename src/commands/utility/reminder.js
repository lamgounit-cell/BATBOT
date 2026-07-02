const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reminder').setDescription('Set a reminder')
    .addStringOption(o => o.setName('time').setDescription('e.g. 10m, 1h, 1d').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('What to remind?').setRequired(true)),

  async execute(interaction, client) {
    const timeStr = interaction.options.getString('time');
    const message = interaction.options.getString('message');
    const ms = require('ms');
    const duration = ms(timeStr);
    if (!duration || duration > 86400000 * 30)
      return interaction.reply({ embeds: [errorEmbed('Invalid time. Use e.g. 10m, 1h, 1d.')], ephemeral: true });

    client.db.run('INSERT INTO reminders (user_id, channel_id, message, remind_at) VALUES ($user_id, $channel_id, $message, datetime("now", $offset))',
      { user_id: interaction.user.id, channel_id: interaction.channel.id, message, offset: `+${Math.round(duration / 1000)} seconds` });

    setTimeout(async () => {
      try {
        await interaction.user.send({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('⏰ Reminder').setDescription(message)] });
      } catch {
        const ch = interaction.guild?.channels.cache.get(interaction.channelId);
        if (ch) ch.send(`${interaction.user}, reminder: ${message}`).catch(() => {});
      }
    }, duration);

    await interaction.reply({ embeds: [successEmbed(`Reminder set for **${timeStr}**.`)], ephemeral: true });
  },
};
