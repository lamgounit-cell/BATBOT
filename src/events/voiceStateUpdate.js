module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    if (client.logger) client.logger.logVoiceStateUpdate(oldState, newState);
    if (client.voiceAFK) client.voiceAFK.handleVoiceUpdate(oldState, newState);
  },
};
