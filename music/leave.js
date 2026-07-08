const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Disconnect the bot from voice channel'),

  async execute(interaction, client) {
    const q = client.music.queues.get(interaction.guildId);
    if (!q?.connection) return interaction.reply({ embeds: [errorEmbed('Not in a voice channel.')], ephemeral: true });
    client.music.leave(interaction.guildId);
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setDescription('Disconnected from voice channel.');
    await interaction.reply({ embeds: [embed] });
  },
};
