const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('imagine').setDescription('Generate an image from a prompt')
    .addStringOption(o => o.setName('prompt').setDescription('What to generate').setRequired(true))
    .addStringOption(o => o.setName('style').setDescription('Visual style').addChoices(
      { name: 'Cinematic', value: 'cinematic' }, { name: 'Anime', value: 'anime' },
      { name: 'Oil painting', value: 'oil-painting' }, { name: 'Pixel art', value: 'pixel-art' })),
  cooldown: 15,

  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');
    const style = interaction.options.getString('style');
    const fullPrompt = style ? `${prompt}, ${style} style` : prompt;

    await interaction.deferReply();

    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(fullPrompt)}`;
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎨 ' + prompt)
      .setImage(url)
      .setFooter({ text: `Style: ${style || 'none'} • Powered by Pollinations.ai` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};