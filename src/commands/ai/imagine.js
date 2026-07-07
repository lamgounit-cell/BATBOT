const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('imagine').setDescription('Generate an image from a prompt')
    .addStringOption(o => o.setName('prompt').setDescription('What to generate').setRequired(true))
    .addStringOption(o => o.setName('style').setDescription('Visual style').addChoices(
      { name: 'Cinematic', value: 'cinematic' }, { name: 'Anime', value: 'anime' },
      { name: 'Oil painting', value: 'oil-painting' }, { name: 'Pixel art', value: 'pixel-art' })),
  cooldown: 15,

  async execute(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ content: 'Image generation is not available with the current AI provider (DeepSeek does not support image generation).' });
  }
};