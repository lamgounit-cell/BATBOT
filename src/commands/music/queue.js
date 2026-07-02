const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the music queue'),

  async execute(interaction, client) {
    const queue = client.music.getQueue(interaction.guildId);
    if (!queue.songs.length && !queue.current) return interaction.reply({ content: 'Queue is empty.' });

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('Music Queue');

    if (queue.current) embed.setDescription(`**Now Playing:** [${queue.current.title}](${queue.current.url})`);

    const list = queue.songs.slice(0, 10).map((s, i) => `${i + 1}. [${s.title}](${s.url}) - ${s.duration}`).join('\n');
    if (list) embed.addFields({ name: `Up Next (${queue.songs.length} songs)`, value: list });

    await interaction.reply({ embeds: [embed] });
  },
};
