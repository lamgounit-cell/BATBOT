const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all available commands'),

  async execute(interaction, client) {
    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const categories = {};
    let count = 0;

    for (const [name, cmd] of client.commands) {
      const perms = cmd.data.default_member_permissions;
      if (perms && !isAdmin) continue;
      const cat = cmd.category || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(`\`/${name}\` - ${cmd.data.description}`);
      count++;
    }

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle(`${client.user.username} Commands`)
      .setDescription('A premium security & moderation bot')
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: `Total: ${count} commands${isAdmin ? ' (admin)' : ''}` })
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
