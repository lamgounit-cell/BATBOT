const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a member')
    .addUserOption(o => o.setName('user').setDescription('Member to check').setRequired(true)),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const warnings = client.moderation.getWarnings(interaction.guild.id, user.id);

    if (!warnings.length) {
      return interaction.reply({ embeds: [errorEmbed(`**${user.tag}** has no warnings.`)], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle(`Warnings for ${user.tag}`)
      .setDescription(`Total: ${warnings.length}`)
      .setTimestamp();

    for (const w of warnings.slice(0, 10)) {
      embed.addFields({
        name: `Case #${w.id}`,
        value: `**Reason:** ${w.reason}\n**Moderator:** <@${w.moderator_id}>\n**Date:** ${w.timestamp}`,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
