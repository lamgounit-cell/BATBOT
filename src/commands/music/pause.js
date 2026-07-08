const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause or resume the current song'),

  async execute(interaction, client) {
    const q = client.music.queues.get(interaction.guildId);
    if (!q || !q.current) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    const result = client.music.pause(interaction.guildId);
    const status = result === 'paused' ? 'Paused' : 'Resumed';
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setDescription(`${status} the current song.`);
    await interaction.reply({ embeds: [embed] });
  },
};
