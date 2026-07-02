const categoryNames = { general: 'General Support', report: 'Report', appeal: 'Appeal', partnership: 'Partnership', other: 'Other' };

module.exports = {
  customId: 'ticket_category',
  async execute(interaction, client) {
    const category = interaction.values[0];
    const name = categoryNames[category] || 'General';
    await client.tickets.createTicket(interaction, name);
  },
};
