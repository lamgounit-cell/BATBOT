const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Set your birthday or view list')
    .addSubcommand(s => s.setName('set').setDescription('Set your birthday')
      .addIntegerOption(o => o.setName('day').setDescription('Day (1-31)').setRequired(true).setMinValue(1).setMaxValue(31))
      .addIntegerOption(o => o.setName('month').setDescription('Month (1-12)').setRequired(true).setMinValue(1).setMaxValue(12)))
    .addSubcommand(s => s.setName('list').setDescription('List all birthdays in this server')),

  async execute(interaction, client) {
    if (interaction.options.getSubcommand() === 'set') {
      const day = interaction.options.getInteger('day');
      const month = interaction.options.getInteger('month');
      client.db.run('INSERT OR REPLACE INTO birthdays (user_id, guild_id, month, day) VALUES ($uid, $gid, $m, $d)', { uid: interaction.user.id, gid: interaction.guildId, m: month, d: day });
      return interaction.reply({ content: `✅ Birthday set to **${day}/${month}**.` });
    }

    const rows = client.db.all('SELECT user_id, month, day FROM birthdays WHERE guild_id = $gid ORDER BY month, day', { gid: interaction.guildId });
    if (!rows.length) return interaction.reply({ content: 'No birthdays set.' });

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('🎂 Birthdays')
      .setDescription(rows.map(r => `<@${r.user_id}> → **${r.day}/${r.month}**`).join('\n'));
    await interaction.reply({ embeds: [embed] });
  },
};
