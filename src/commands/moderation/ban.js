const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/Embed');
const { canModerate } = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(o => o.setName('user').setDescription('Member to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the ban'))
    .addIntegerOption(o => o.setName('delete_days').setDescription('Delete messages from (days)').setMinValue(0).setMaxValue(7)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({ embeds: [errorEmbed('You need `Ban Members` permission.')], ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member && !canModerate(interaction.member, member)) {
      return interaction.reply({ embeds: [errorEmbed('You cannot ban this member.')], ephemeral: true });
    }
    if (!member?.bannable) {
      return interaction.reply({ embeds: [errorEmbed('I cannot ban this member.')], ephemeral: true });
    }

    await interaction.deferReply();
    await client.moderation.ban(interaction.guild, user, { reason, deleteDays });
    if (client.logger) client.logger.logBan(interaction.guild, user, interaction.user, reason);
    await interaction.editReply({ embeds: [successEmbed(`**${user.tag}** has been banned.\nReason: ${reason}`)] });
  },
};
