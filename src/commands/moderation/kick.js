const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/Embed');
const { canModerate } = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(o => o.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the kick')),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return interaction.reply({ embeds: [errorEmbed('You need `Kick Members` permission.')], ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member && !canModerate(interaction.member, member)) {
      return interaction.reply({ embeds: [errorEmbed('You cannot kick this member.')], ephemeral: true });
    }
    if (!member?.kickable) {
      return interaction.reply({ embeds: [errorEmbed('I cannot kick this member.')], ephemeral: true });
    }

    await interaction.deferReply();
    await client.moderation.kick(member, { reason });
    await interaction.editReply({ embeds: [successEmbed(`**${user.tag}** has been kicked.\nReason: ${reason}`)] });
  },
};
