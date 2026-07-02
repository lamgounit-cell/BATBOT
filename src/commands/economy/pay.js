const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Send coins to another user')
    .addUserOption(o => o.setName('user').setDescription('Recipient').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount to send').setRequired(true).setMinValue(1)),

  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed('You cannot pay yourself.')], ephemeral: true });
    }

    const success = client.economy.transfer(interaction.user.id, interaction.guild.id, target.id, amount);
    if (!success) {
      return interaction.reply({ embeds: [errorEmbed('You don\'t have enough coins.')], ephemeral: true });
    }

    await interaction.reply({ embeds: [successEmbed(`Sent **🪙 ${amount}** to ${target}.`)] });
  },
};
