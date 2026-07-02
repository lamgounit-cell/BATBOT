const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('np').setDescription('Show the currently playing song'),

  async execute(interaction, client) {
    const queue = client.music.getQueue(interaction.guildId);
    if (!queue.current) return interaction.reply({ content: 'Nothing playing.' });

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('Now Playing')
      .setDescription(`**[${queue.current.title}](${queue.current.url})**\nRequested by ${queue.current.requester}`);

    await interaction.reply({ embeds: [embed] });
  },
};
