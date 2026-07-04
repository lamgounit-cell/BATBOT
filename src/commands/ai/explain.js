const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

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
      const chunks = reply.match(/[\s\S]{1,1900}/g) || [reply];
      for (let i = 0; i < chunks.length; i++) {
        if (i === 0) await interaction.editReply(chunks[i]);
        else await interaction.followUp(chunks[i]);
      }
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed(e.message)] });
    }
  },
};