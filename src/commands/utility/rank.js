const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your XP rank')
    .addUserOption(o => o.setName('user').setDescription('User to check')),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;
    const row = client.db.get('SELECT * FROM levels WHERE user_id = ? AND guild_id = ?', { user_id: user.id, guild_id: interaction.guild.id });
    const xp = row?.xp || 0;
    const level = row?.level || 1;
    const needed = client.leveling.xpForLevel(level);
    const rank = client.leveling.getRank(user.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setTitle('Rank')
      .addFields(
        { name: 'Level', value: `${level}`, inline: true },
        { name: 'XP', value: `${xp}/${needed}`, inline: true },
        { name: 'Rank', value: rank ? `#${rank.rank}/${rank.total}` : 'Unranked', inline: true },
      )
      .setFooter({ text: `${interaction.guild.name}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
