const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the volume (0-100)')
    .addIntegerOption(o => o.setName('level').setDescription('Volume level 0-100').setRequired(true).setMinValue(0).setMaxValue(100)),

  async execute(interaction, client) {
    const q = client.music.queues.get(interaction.guildId);
    if (!q || !q.current) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    const vol = client.music.setVolume(interaction.guildId, interaction.options.getInteger('level'));
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setDescription(`Volume set to **${vol}%**.`);
    await interaction.reply({ embeds: [embed] });
  },
};
