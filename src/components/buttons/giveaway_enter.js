module.exports = {
  customId: 'giveaway_enter',
  async execute(interaction, client) {
    if (!client.giveawayEntries) client.giveawayEntries = new Map();
    if (!client.giveawayEntries.has(interaction.message.id)) {
      client.giveawayEntries.set(interaction.message.id, []);
    }
    const entries = client.giveawayEntries.get(interaction.message.id);
    if (entries.includes(interaction.user.id)) {
      return interaction.reply({ content: 'You already entered!', ephemeral: true });
    }
    entries.push(interaction.user.id);
    await interaction.reply({ content: '✅ You entered the giveaway!', ephemeral: true });
  },
};
