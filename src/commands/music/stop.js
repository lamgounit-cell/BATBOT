const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop music and clear queue'),

  async execute(interaction, client) {
    const member = interaction.member;
    if (!member.voice.channel) return interaction.reply({ content: 'Join a voice channel first.', ephemeral: true });

    client.music.stop(interaction.guildId);
    await interaction.reply({ content: '⏹ Stopped and left the channel.' });
  },
};
