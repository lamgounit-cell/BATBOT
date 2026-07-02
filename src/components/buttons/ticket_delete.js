module.exports = {
  customId: 'ticket_delete',
  async execute(interaction, client) {
    await client.tickets.deleteTicket(interaction);
  },
};
