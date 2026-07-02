const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Get a user\'s avatar')
    .addUserOption(o => o.setName('user').setDescription('User')),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;
    const avatar = user.displayAvatarURL({ size: 1024, extension: 'png' });

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle(`${user.tag}'s Avatar`)
      .setImage(avatar)
      .setURL(avatar);

    await interaction.reply({ embeds: [embed] });
  },
};
