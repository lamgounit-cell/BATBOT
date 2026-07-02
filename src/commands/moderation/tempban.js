const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/Embed');
const { canModerate } = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Temporarily ban a member')
    .addUserOption(o => o.setName('user').setDescription('Member to tempban').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 1h, 1d, 7d)').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({ embeds: [errorEmbed('You need `Ban Members` permission.')], ephemeral: true });
    }
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member && !canModerate(interaction.member, member)) {
      return interaction.reply({ embeds: [errorEmbed('You cannot ban this member.')], ephemeral: true });
    }
    await interaction.deferReply();
    await client.moderation.tempban(interaction.guild, user, duration, { reason });
    await interaction.editReply({ embeds: [successEmbed(`**${user.tag}** tempbanned for ${duration}.\nReason: ${reason}`)] });
  },
};
