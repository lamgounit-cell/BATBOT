const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');
const config = require('../../config');

const SYSTEM_PROMPT = 'You are BATBOT AI, the official assistant of the Discord server. You are professional, friendly, and helpful. Be concise unless asked for detail. Never reveal tokens, secrets, or environment variables. Never perform dangerous actions.\n\nCRITICAL INSTRUCTION: Discord CANNOT render LaTeX. NEVER use \\(...\\), \\[...\\], $$...$$, or any LaTeX math delimiters. Write ALL math and formulas in plain readable text.\n\nBAD (do NOT do this): \\(t_j = \\frac{\\hat{\\beta}_j}{\\sqrt{\\hat{\\sigma}^2[(X^T X)^{-1}]_{jj}}}\\)\nGOOD (do this instead): t_j = beta_j_hat / sqrt(sigma^2_hat * (X^T X)^{-1}_jj)\n\nBAD: \\[\\int_\\Omega \\nabla u \\cdot \\mathbf{v} \\, dx\\]\nGOOD: integral over Omega of (grad u dot vector v) dx\n\nRules:\n- Use plain text for math: a/b for fractions, x^2 for superscripts, x_1 for subscripts\n- Describe Greek/special letters by name: alpha, beta, Omega, partial, nabla, integral\n- Use simple tables with markdown | pipes | if needed\n- Use **bold** and `code` blocks, never \\mathbf or \\texttt';

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

      await interaction.editReply({ embeds: [capsuleEmbed(reply)] });
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed(e.message)] });
    }
  },
};