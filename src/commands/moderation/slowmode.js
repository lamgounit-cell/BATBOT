const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode in a channel')
    .addIntegerOption(o => o.setName('seconds').setDescription('Slowmode in seconds (0 to disable)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption(o => o.setName('channel').setDescription('Target channel').addChannelTypes(ChannelType.GuildText)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ embeds: [errorEmbed('You need `Manage Channels` permission.')], ephemeral: true });
    }

    const seconds = interaction.options.getInteger('seconds');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    await client.moderation.setSlowmode(channel, seconds);
    await interaction.reply({
      embeds: [successEmbed(`Slowmode set to **${seconds}s** in ${channel}.`)],
    });
  },
};
