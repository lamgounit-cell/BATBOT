const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('analyze').setDescription('Analyze an image')
    .addStringOption(o => o.setName('image_url').setDescription('Image URL to analyze').setRequired(true))
    .addStringOption(o => o.setName('question').setDescription('What do you want to know about this image?')),

  async execute(interaction, client) {
    if (!client.ai?.enabled) return interaction.reply({ embeds: [errorEmbed('AI is not configured.')], ephemeral: true });
    await interaction.deferReply();
    const url = interaction.options.getString('image_url');
    const question = interaction.options.getString('question') || 'Describe this image in detail.';
    try {
      const reply = await client.ai.generateWithImage(question, url);
      const chunks = reply.match(/[\s\S]{1,1900}/g) || [reply];
      for (let i = 0; i < chunks.length; i++) {
        if (i === 0) await interaction.editReply(chunks[i]);
        else { try { await interaction.followUp(chunks[i]); } catch {} }
      }
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed(e.message)] });
    }
  },
};