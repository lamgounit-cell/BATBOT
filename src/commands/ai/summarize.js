const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');
const config = require('../../config');

function capsuleEmbed(description) {
  const MAX_LEN = 4096;
  let desc = description;
  let truncated = false;
  if (desc.length > MAX_LEN) { desc = desc.slice(0, MAX_LEN - 3) + '...'; truncated = true; }
  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setDescription(desc)
    .setTimestamp();
  if (truncated) embed.setFooter({ text: 'Response was truncated due to length' });
  return embed;
}

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
      await interaction.editReply({ embeds: [capsuleEmbed(reply)] });
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed(e.message)] });
    }
  },
};