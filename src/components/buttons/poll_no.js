module.exports = {
  customId: 'poll_no',
  async execute(interaction) {
    await interaction.reply({ content: 'You voted **No** ❌', ephemeral: true });
  },
};
