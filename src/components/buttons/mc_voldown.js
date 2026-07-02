module.exports = {
  customId: 'mc_voldown',
  async execute(interaction, client) {
    const member = interaction.member;
    if (!member.voice.channel) return interaction.reply({ content: 'Join the voice channel first.', ephemeral: true });
    const queue = client.music.getQueue(interaction.guildId);
    if (!queue.current) return interaction.reply({ content: 'Nothing playing.', ephemeral: true });
    client.music.setVolume(interaction.guildId, queue.volume - 0.1);
    await interaction.deferUpdate();
  },
};
