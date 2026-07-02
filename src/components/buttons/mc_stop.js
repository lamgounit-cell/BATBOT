module.exports = {
  customId: 'mc_stop',
  async execute(interaction, client) {
    const member = interaction.member;
    if (!member.voice.channel) return interaction.reply({ content: 'Join the voice channel first.', ephemeral: true });
    client.music.stop(interaction.guildId);
    await interaction.deferUpdate();
  },
};
