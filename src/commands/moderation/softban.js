const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/Embed');
const { canModerate } = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Ban and immediately unban a member (clears messages)')
    .addUserOption(o => o.setName('user').setDescription('Member to softban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({ embeds: [errorEmbed('You need `Ban Members` permission.')], ephemeral: true });
    }
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member && !canModerate(interaction.member, member)) {
      return interaction.reply({ embeds: [errorEmbed('You cannot softban this member.')], ephemeral: true });
    }
    await interaction.deferReply();
    await client.moderation.softban(interaction.guild, user, { reason });
    await interaction.editReply({ embeds: [successEmbed(`**${user.tag}** softbanned.\nReason: ${reason}`)] });
  },
};
