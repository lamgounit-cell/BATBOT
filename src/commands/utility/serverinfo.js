const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Get information about this server'),

  async execute(interaction, client) {
    const guild = interaction.guild;

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Members', value: guild.memberCount.toLocaleString(), inline: true },
        { name: 'Channels', value: guild.channels.cache.size.toLocaleString(), inline: true },
        { name: 'Roles', value: guild.roles.cache.size.toLocaleString(), inline: true },
        { name: 'Boosts', value: String(guild.premiumSubscriptionCount || 0), inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: `ID: ${guild.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
