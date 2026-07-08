const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube, Spotify, or SoundCloud')
    .addStringOption(o => o.setName('query').setDescription('Song name or URL (YouTube, Spotify, SoundCloud)').setRequired(true)),

  async execute(interaction, client) {
    if (!interaction.member.voice.channel) return interaction.reply({ embeds: [errorEmbed('You must be in a voice channel.')], ephemeral: true });
    await interaction.deferReply();
    try {
      await client.music.join(interaction);
      const song = await client.music.play(interaction, interaction.options.getString('query'));
      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle('Added to Queue')
        .setDescription(`[${song.title}](${song.url})`)
        .setThumbnail(song.thumbnail)
        .addFields(
          { name: 'Duration', value: client.music.formatDuration(song.duration), inline: true },
          { name: 'Source', value: song.source || 'youtube', inline: true },
        )
        .setFooter({ text: `Requested by ${interaction.user.username}` });
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed(e.message)] });
    }
  },
};
