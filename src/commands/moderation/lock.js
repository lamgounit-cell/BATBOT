const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addChannelOption(o => o.setName('channel').setDescription('Channel to lock').addChannelTypes(ChannelType.GuildText)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ embeds: [errorEmbed('You need `Manage Channels` permission.')], ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    await client.moderation.lock(channel);
    await interaction.reply({ embeds: [successEmbed(`🔒 ${channel} has been locked.`)] });
  },
};
