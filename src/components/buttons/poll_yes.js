module.exports = {
  customId: 'poll_yes',
  async execute(interaction) {
    await interaction.reply({ content: 'You voted **Yes** ✅', ephemeral: true });
  },
};
