module.exports = {
  name: 'messageUpdate',
  async execute(before, after, client) {
    if (before.author?.bot || !before.guild) return;
    if (before.content === after.content) return;
    if (client.logger) client.logger.logMessageEdit(before, after);
  },
};
