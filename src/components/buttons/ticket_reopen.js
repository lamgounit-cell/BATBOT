module.exports = {
  customId: 'ticket_reopen',
  async execute(interaction, client) {
    await client.tickets.reopenTicket(interaction);
  },
};
