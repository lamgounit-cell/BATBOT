module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, client) {
    if (!client.logger) return;

    if (oldMember.nickname !== newMember.nickname) {
      client.logger.logNicknameUpdate(newMember, oldMember.nickname, newMember.nickname);
    }

    if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil && newMember.communicationDisabledUntil) {
      const audit = await newMember.guild.fetchAuditLogs({ limit: 1, type: 24 }).catch(() => null);
      const entry = audit?.entries.first();
      const duration = Math.round((newMember.communicationDisabledUntil - Date.now()) / 60000);
      client.logger.logTimeout(newMember, entry?.executor || newMember.guild.members.me, duration, entry?.reason);
    }
  },
};
