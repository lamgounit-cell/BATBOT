const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

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
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Image generation failed (${res.status})`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const attachment = new AttachmentBuilder(buffer, { name: 'generated.png' });

      await interaction.editReply({
        content: `🎨 **${prompt}**${style ? ` (${style})` : ''}`,
        files: [attachment],
      });
    } catch (e) {
      await interaction.editReply({ content: `Error: ${e.message}` });
    }
  },
};