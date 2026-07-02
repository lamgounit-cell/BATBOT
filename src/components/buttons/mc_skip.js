module.exports = {
  customId: 'mc_skip',
  async execute(interaction, client) {
    const member = interaction.member;
    if (!member.voice.channel) return interaction.reply({ content: 'Join the voice channel first.', ephemeral: true });
    client.music.skip(interaction.guildId);
    await interaction.deferUpdate();
  },
};
