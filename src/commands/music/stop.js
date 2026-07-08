const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback and clear the queue'),

  async execute(interaction, client) {
    const q = client.music.queues.get(interaction.guildId);
    if (!q || !q.current) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    client.music.stop(interaction.guildId);
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setDescription('Stopped playback and cleared the queue.');
    await interaction.reply({ embeds: [embed] });
  },
};
