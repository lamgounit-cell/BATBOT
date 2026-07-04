const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history').setDescription('View your recent conversation history'),

  async execute(interaction, client) {
    if (!client.ai?.enabled) return interaction.reply({ embeds: [infoEmbed('AI not configured.')], ephemeral: true });
    const history = client.memory.getHistory(interaction.user.id);
    if (!history.length) return interaction.reply({ embeds: [infoEmbed('No history yet.')], ephemeral: true });
    const lines = history.slice(-10).map(e => `**${e.role === 'user' ? 'You' : 'AI'}**: ${e.content.slice(0, 200)}`).join('\n');
    await interaction.reply({ embeds: [infoEmbed(`Your last ${Math.min(history.length, 10)} messages:\n\n${lines}`)], ephemeral: true });
  },
};