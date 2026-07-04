const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('summarize').setDescription('Summarize text or a URL')
    .addStringOption(o => o.setName('text').setDescription('Text to summarize').setRequired(true))
    .addStringOption(o => o.setName('style').setDescription('Summary style').addChoices({ name: 'Bullet points', value: 'bullets' }, { name: 'One paragraph', value: 'paragraph' }, { name: 'TL;DR', value: 'tldr' })),

  async execute(interaction, client) {
    if (!client.ai?.enabled) return interaction.reply({ embeds: [errorEmbed('AI is not configured.')], ephemeral: true });
    await interaction.deferReply();
    const text = interaction.options.getString('text');
    const style = interaction.options.getString('style') || 'paragraph';
    const fmt = style === 'bullets' ? 'as bullet points' : style === 'tldr' ? 'in one TL;DR sentence' : 'in one clear paragraph';
    try {
      const reply = await client.ai.generate(`Summarize the following ${fmt}:\n\n${text.slice(0, 6000)}`);
      await interaction.editReply(reply);
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed(e.message)] });
    }
  },
};