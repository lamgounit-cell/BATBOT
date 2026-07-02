module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (message.author?.bot || !message.guild) return;
    if (client.logger) client.logger.logMessageDelete(message);
  },
};
