const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit a suggestion')
    .addStringOption(o => o.setName('suggestion').setDescription('Your suggestion').setRequired(true)),

  async execute(interaction, client) {
    const suggestion = interaction.options.getString('suggestion');

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('💡 Suggestion')
      .setDescription(suggestion)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setFooter({ text: `ID: ${interaction.id}` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await msg.react('✅');
    await msg.react('❌');
  },
};
