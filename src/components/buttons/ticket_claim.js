module.exports = {
  customId: 'ticket_claim',
  async execute(interaction, client) {
    if (!interaction.member.permissions.has('ManageChannels')) {
      return interaction.reply({ content: 'You cannot claim tickets.', ephemeral: true });
    }
    await client.tickets.claimTicket(interaction);
  },
};
