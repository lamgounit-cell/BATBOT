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
    .setName('explain').setDescription('Explain a concept, code, or error')
    .addStringOption(o => o.setName('topic').setDescription('What to explain').setRequired(true))
    .addStringOption(o => o.setName('level').setDescription('Explanation depth').addChoices({ name: 'Simple', value: 'simple' }, { name: 'Detailed', value: 'detailed' }, { name: 'Expert', value: 'expert' })),

  async execute(interaction, client) {
    if (!client.ai?.enabled) return interaction.reply({ embeds: [errorEmbed('AI is not configured.')], ephemeral: true });
    await interaction.deferReply();
    const topic = interaction.options.getString('topic');
    const level = interaction.options.getString('level') || 'detailed';
    const style = level === 'simple' ? 'Explain like I am 12 years old.' : level === 'expert' ? 'Explain in technical depth for an expert audience.' : 'Explain clearly and thoroughly.';
    try {
      const reply = await client.ai.generate(`Explain this: ${topic}\n\n${style}`);
      await interaction.editReply({ embeds: [capsuleEmbed(reply)] });
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed(e.message)] });
    }
  },
};