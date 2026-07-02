const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'),

  async execute(interaction, client) {
    const member = interaction.member;
    if (!member.voice.channel) return interaction.reply({ content: 'Join a voice channel first.', ephemeral: true });

    if (client.music.skip(interaction.guildId)) {
      await interaction.reply({ content: '⏭ Skipped.' });
    } else {
      await interaction.reply({ content: 'Nothing playing.' });
    }
  },
};
