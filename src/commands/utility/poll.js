const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a yes/no poll')
    .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true)),

  async execute(interaction, client) {
    const question = interaction.options.getString('question');

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('📊 Poll')
      .setDescription(question)
      .setFooter({ text: `By ${interaction.user.tag}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('poll_yes').setLabel('Yes').setStyle(ButtonStyle.Success).setEmoji('✅'),
      new ButtonBuilder().setCustomId('poll_no').setLabel('No').setStyle(ButtonStyle.Danger).setEmoji('❌'),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
