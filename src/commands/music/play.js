const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube or Spotify')
    .addStringOption(o => o.setName('query').setDescription('Song name, YouTube URL, or Spotify URL').setRequired(true)),

  async execute(interaction, client) {
    console.log(`\n[PLAY] ===== COMMAND STARTED by ${interaction.user.tag} =====`);
    const q = interaction.options.getString('query');
    console.log(`[PLAY] query: "${q}"`);
    console.log(`[PLAY] member voice: ${interaction.member?.voice?.channel?.name || 'NONE'}`);

    try {
      console.log('[PLAY] calling deferReply...');
      await interaction.deferReply();
      console.log('[PLAY] deferReply OK');
    } catch (e) {
      console.log(`[PLAY] deferReply FAILED: ${e.constructor?.name || 'Error'}: ${e.message}`);
      console.log(`[PLAY] interaction.deferred=${interaction.deferred} replied=${interaction.replied}`);
      return;
    }

    const query = interaction.options.getString('query');
    const member = interaction.member;
    if (!member.voice.channel) return interaction.editReply({ content: 'Join a voice channel first.' }).catch(() => {});

    const song = await client.music.addSong(interaction.guildId, query, member);
    if (!song) return interaction.editReply({ content: 'Could not find that song.' }).catch(() => {});

    const channel = await client.music.join(member);
    if (!channel) return interaction.editReply({ content: 'Could not join your voice channel.' }).catch(() => {});

    const queue = client.music.getQueue(interaction.guildId);
    queue.panelChannel = interaction.channel;

    if (queue.current) {
      queue.songs.push(song);
      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle('Added to Queue')
        .setDescription(`**[${song.title}](${song.url})**\nDuration: ${song.duration}\nPosition: ${queue.songs.length}`)
        .setFooter({ text: `Requested by ${song.requester}` });
      return interaction.editReply({ embeds: [embed] }).catch(() => {});
    }

    await client.music.play(interaction.guildId, song);
    await interaction.editReply({ content: '▶ Started playing — check the control panel below.' }).catch(() => {});
  },
};
