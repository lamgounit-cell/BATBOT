const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

function truncate(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate text to another language')
    .addStringOption(o => o.setName('text').setDescription('Text to translate').setRequired(true))
    .addStringOption(o => o.setName('to').setDescription('Target language (e.g. French, Spanish, Arabic)').setRequired(true).setMaxLength(50))
    .addStringOption(o => o.setName('from').setDescription('Source language (auto-detected if omitted)').setMaxLength(50)),

  async execute(interaction, client) {
    if (!client.ai?.enabled) return interaction.reply({ embeds: [errorEmbed('AI not configured.')], ephemeral: true });
    await interaction.deferReply();
    const text = interaction.options.getString('text');
    const to = interaction.options.getString('to');
    const from = interaction.options.getString('from');
    const source = from ? ` from ${from}` : '';
    try {
      const reply = await client.ai.generate(`Translate the following text${source} to ${to}. Return ONLY the translated text, nothing else:\n\n${text}`);
      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle('Translation')
        .addFields({ name: 'Input', value: truncate(text, 1024) }, { name: `Output (${to})`, value: truncate(reply, 1024) })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed(e.message)] });
    }
  },
};
