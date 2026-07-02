const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all available commands'),

  async execute(interaction, client) {
    const categories = {};
    for (const [name, cmd] of client.commands) {
      const cat = cmd.category || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(`\`/${name}\` - ${cmd.data.description}`);
    }

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle(`${client.user.username} Commands`)
      .setDescription('A premium security & moderation bot')
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: `Total: ${client.commands.size} commands` })
      .setTimestamp();

    for (const [cat, cmds] of Object.entries(categories)) {
      embed.addFields({
        name: `📁 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
        value: cmds.join('\n'),
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
