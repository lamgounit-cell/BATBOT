module.exports = {
  customId: 'verify_me',
  async execute(interaction, client) {
    await client.verification.verifyMember(interaction);
  },
};
