const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing song'),

  async execute(interaction, client) {
    const q = client.music.queues.get(interaction.guildId);
    if (!q || !q.current) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('Now Playing')
      .setDescription(`[${q.current.title}](${q.current.url})`)
      .setThumbnail(q.current.thumbnail)
      .addFields({ name: 'Duration', value: client.music.formatDuration(q.current.duration), inline: true })
      .setFooter({ text: `Requested by ${q.current.requestedBy ? `<@${q.current.requestedBy}>` : 'Unknown'}` });
    await interaction.reply({ embeds: [embed] });
  },
};
