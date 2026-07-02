class VoiceAFKService {
  constructor(client) {
    this.client = client;
    this.afkTimers = new Map();
    client.voiceAFK = this;
    console.log('[VOICE_AFK] Initialized');
  }

  handleVoiceUpdate(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guildId = member.guild.id;

    if (newState.channelId) {
      const timer = setTimeout(() => this.moveToOverthinking(member), 30 * 60 * 1000);
      this.afkTimers.set(`${guildId}:${member.id}`, timer);
    }

    if (!newState.channelId && oldState.channelId) {
      const key = `${guildId}:${member.id}`;
      if (this.afkTimers.has(key)) {
        clearTimeout(this.afkTimers.get(key));
        this.afkTimers.delete(key);
      }
    }
  }

  async moveToOverthinking(member) {
    const key = `${member.guild.id}:${member.id}`;
    this.afkTimers.delete(key);

    if (!member.voice.channelId) return;

    const overthinking = member.guild.channels.cache.find(
      c => c.type === 2 && c.name.toLowerCase() === 'overthinking'
    );
    if (!overthinking) return;

    try {
      await member.voice.setChannel(overthinking.id);
    } catch {}
  }
}

module.exports = VoiceAFKService;
