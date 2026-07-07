const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('code').setDescription('Generate, review, or debug code')
    .addStringOption(o => o.setName('task').setDescription('What code to write or fix').setRequired(true))
    .addStringOption(o => o.setName('language').setDescription('Programming language')),

  async execute(interaction, client) {
    if (!client.ai?.enabled) return interaction.reply({ embeds: [errorEmbed('AI is not configured.')], ephemeral: true });
    await interaction.deferReply();
    const task = interaction.options.getString('task');
    const lang = interaction.options.getString('language') || 'auto';
    try {
      const reply = await client.ai.generate(`Language: ${lang}\nTask: ${task}\n\nWrite clean, well-structured code. Include brief comments.`);
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