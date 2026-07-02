module.exports = {
  customId: 'ticket_close',
  async execute(interaction, client) {
    await client.tickets.closeTicket(interaction);
  },
};
