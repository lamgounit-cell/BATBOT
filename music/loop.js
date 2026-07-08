const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle loop for the current queue'),

  async execute(interaction, client) {
    const q = client.music.queues.get(interaction.guildId);
    if (!q || !q.current) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    q.loop = !q.loop;
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setDescription(`Loop is now **${q.loop ? 'enabled' : 'disabled'}**.`);
    await interaction.reply({ embeds: [embed] });
  },
};
