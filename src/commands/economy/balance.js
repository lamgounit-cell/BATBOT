const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your coin balance')
    .addUserOption(o => o.setName('user').setDescription('User to check')),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;
    const bal = client.economy.getBalance(user.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setTitle('💰 Balance')
      .addFields(
        { name: 'Wallet', value: `🪙 ${bal.balance.toLocaleString()}`, inline: true },
        { name: 'Bank', value: `🏦 ${bal.bank.toLocaleString()}`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
