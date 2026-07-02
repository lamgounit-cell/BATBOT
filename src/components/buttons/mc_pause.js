module.exports = {
  customId: 'mc_pause',
  async execute(interaction, client) {
    const member = interaction.member;
    if (!member.voice.channel) return interaction.reply({ content: 'Join the voice channel first.', ephemeral: true });
    const queue = client.music.getQueue(interaction.guildId);
    if (!queue.current) return interaction.reply({ content: 'Nothing playing.', ephemeral: true });

    if (!queue.paused) {
      queue.pauseOffset = Date.now() - queue.startTime;
      queue.paused = true;
    } else {
      queue.startTime = Date.now();
      queue.pauseOffset = 0;
      queue.paused = false;
    }

    client.music.togglePause(interaction.guildId);
    await interaction.deferUpdate();
  },
};
