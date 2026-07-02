module.exports = {
  name: 'userUpdate',
  async execute(oldUser, newUser, client) {
    if (!client.logger) return;

    if (oldUser.avatar !== newUser.avatar) {
      client.logger.logAvatarUpdate(newUser);
    }

    if (oldUser.tag !== newUser.tag) {
      client.logger.logUsernameUpdate(newUser, oldUser.tag, newUser.tag);
    }
  },
};
