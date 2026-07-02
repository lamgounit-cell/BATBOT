const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Send the verification panel')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to send panel').setRequired(true)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ embeds: [errorEmbed('Admin only.')], ephemeral: true });
    }
    const channel = interaction.options.getChannel('channel');
    await client.verification.sendPanel(channel, interaction.guild.id);
    await interaction.reply({ content: `Panel sent to ${channel}.`, ephemeral: true });
  },
};
