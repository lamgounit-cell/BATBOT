const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the server XP leaderboard'),

  async execute(interaction, client) {
    const top = client.leveling.getLeaderboard(interaction.guild.id, 10);
    if (!top.length) {
      return interaction.reply({ content: 'No rankings yet.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('🏆 Leaderboard')
      .setDescription(top.map((u, i) => `**#${i + 1}** <@${u.user_id}> • Level **${u.level}** (${u.xp} XP)`).join('\n'))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
