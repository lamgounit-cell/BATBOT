const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

const SYSTEM_PROMPT = 'You are BATBOT AI, the official assistant of the Discord server. You are professional, friendly, and helpful. Be concise unless asked for detail. Never reveal tokens, secrets, or environment variables. Never perform dangerous actions. IMPORTANT: Discord does not render LaTeX, raw tables, or complex formatting. Never output $$, [], or raw LaTeX notation. Use plain text, simple Discord markdown (bold **text**, italic *text*, `code blocks`, lists with - or 1.), and simple tables using markdown if needed.';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask').setDescription('Ask the AI anything')
    .addStringOption(o => o.setName('prompt').setDescription('Your question').setRequired(true))
    .addStringOption(o => o.setName('style').setDescription('Response style').addChoices({ name: 'Balanced', value: 'balanced' }, { name: 'Concise', value: 'concise' }, { name: 'Detailed', value: 'detailed' })),

  async execute(interaction, client) {
    if (!client.ai?.enabled) return interaction.reply({ embeds: [errorEmbed('AI is not configured. Contact the admin.')], ephemeral: true });

    const prompt = interaction.options.getString('prompt');
    const style = interaction.options.getString('style') || 'balanced';

    await interaction.deferReply();

    const system = style === 'concise' ? SYSTEM_PROMPT + ' Answer in 1-3 sentences.' : style === 'detailed' ? SYSTEM_PROMPT + ' Provide a thorough, detailed answer.' : SYSTEM_PROMPT;

    try {
      const ctx = client.memory.buildContext(interaction.user.id, system);
      const reply = await client.ai.generate(prompt, ctx);
      client.memory.addEntry(interaction.user.id, 'user', prompt);
      client.memory.addEntry(interaction.user.id, 'assistant', reply);

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