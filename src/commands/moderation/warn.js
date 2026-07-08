const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addUserOption(o => o.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the warning').setRequired(true)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ embeds: [errorEmbed('You need `Moderate Members` permission.')], ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    await client.moderation.warn(interaction.guild.id, user.id, interaction.user.id, reason);
    const count = client.moderation.getWarnings(interaction.guild.id, user.id).length;

    await interaction.reply({
      embeds: [successEmbed(`**${user.tag}** has been warned.\nReason: ${reason}\nTotal warnings: ${count}`)],
    });
  },
};
