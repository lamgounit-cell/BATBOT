const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed, successEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetmemory').setDescription('Clear your conversation history'),

  async execute(interaction, client) {
    if (!client.ai?.enabled) return interaction.reply({ embeds: [infoEmbed('AI not configured.')], ephemeral: true });
    client.memory.clear(interaction.user.id);
    await interaction.reply({ embeds: [successEmbed('Conversation history cleared.')], ephemeral: true });
  },
};