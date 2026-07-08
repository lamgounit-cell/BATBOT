const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/Embed');
const { canModerate } = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addUserOption(o => o.setName('user').setDescription('Member to timeout').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 10m, 1h, 1d)').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the timeout')),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ embeds: [errorEmbed('You need `Moderate Members` permission.')], ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const duration = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member && !canModerate(interaction.member, member)) {
      return interaction.reply({ embeds: [errorEmbed('You cannot timeout this member.')], ephemeral: true });
    }
    if (!member?.moderatable) {
      return interaction.reply({ embeds: [errorEmbed('I cannot timeout this member.')], ephemeral: true });
    }

    await interaction.deferReply();
    await client.moderation.timeout(member, duration, { reason });
    await interaction.editReply({ embeds: [successEmbed(`**${user.tag}** timed out for ${duration}.\nReason: ${reason}`)] });
  },
};
