const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue'),

  async execute(interaction, client) {
    const q = client.music.queues.get(interaction.guildId);
    if (!q || (!q.current && !q.songs.length)) return interaction.reply({ embeds: [errorEmbed('Queue is empty.')], ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('Music Queue');

    if (q.current) {
      embed.setDescription(`**Now Playing:** [${q.current.title}](${q.current.url}) \`[${client.music.formatDuration(q.current.duration)}]\``);
    }

    if (q.songs.length) {
      const list = q.songs.slice(0, 10).map((s, i) => `**${i + 1}.** [${s.title}](${s.url}) \`[${client.music.formatDuration(s.duration)}]\``).join('\n');
      embed.addFields({ name: `Up Next (${q.songs.length} song${q.songs.length > 1 ? 's' : ''})`, value: list });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
