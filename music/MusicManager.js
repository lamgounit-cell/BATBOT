const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const play = require('play-dl');

class MusicManager {
  constructor(client) {
    this.client = client;
    this.queues = new Map();
    client.music = this;
    console.log('[MUSIC] Initialized');
  }

  getQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, {
        player: createAudioPlayer(),
        connection: null,
        songs: [],
        volume: 50,
        current: null,
        loop: false,
      });
      const q = this.queues.get(guildId);
      q.player.on('stateChange', (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
          this.next(guildId);
        }
      });
      q.player.on('error', () => { this.next(guildId); });
    }
    return this.queues.get(guildId);
  }

  async join(interaction) {
    const member = interaction.member;
    const channel = member.voice.channel;
    if (!channel) throw new Error('You must be in a voice channel.');
    const guildId = interaction.guildId;
    const q = this.getQueue(guildId);

    if (q.connection) {
      const currentChannel = q.connection.joinConfig.channelId;
      if (currentChannel !== channel.id) {
        q.connection.destroy();
        q.connection = null;
      } else {
        return;
      }
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await entersState(connection, VoiceConnectionStatus.Connecting, 5000);
      } catch {
        connection.destroy();
        this.queues.delete(guildId);
      }
    });

    q.connection = connection;
    connection.subscribe(q.player);
  }

  async play(interaction, query) {
    const q = this.getQueue(interaction.guildId);
    let song;

    if (play.yt_validate(query) === 'video') {
      const info = await play.video_info(query);
      song = {
        title: info.video_details.title,
        url: info.video_details.url,
        duration: info.video_details.durationInSec,
        thumbnail: info.video_details.thumbnails[0]?.url,
        requestedBy: interaction.user.id,
      };
    } else {
      const results = await play.search(query, { limit: 1 });
      if (!results.length) throw new Error('No results found.');
      const info = results[0];
      song = {
        title: info.title,
        url: info.url,
        duration: info.durationInSec,
        thumbnail: info.thumbnails[0]?.url,
        requestedBy: interaction.user.id,
      };
    }

    q.songs.push(song);

    if (!q.current) return this.startPlayback(interaction.guildId);
    return song;
  }

  async startPlayback(guildId) {
    const q = this.getQueue(guildId);
    if (!q.songs.length) {
      q.current = null;
      return;
    }

    q.current = q.songs.shift();
    const stream = await play.stream(q.current.url);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true,
    });
    resource.volume.setVolume(q.volume / 100);
    q.player.play(resource);
  }

  next(guildId) {
    const q = this.queues.get(guildId);
    if (!q) return;
    if (q.loop && q.current) q.songs.push({ ...q.current });
    if (!q.songs.length) {
      q.current = null;
      return;
    }
    this.startPlayback(guildId);
  }

  stop(guildId) {
    const q = this.queues.get(guildId);
    if (!q) return;
    q.songs = [];
    q.player.stop(true);
    q.current = null;
  }

  skip(guildId) {
    const q = this.queues.get(guildId);
    if (!q || !q.current) return false;
    q.player.stop(true);
    return true;
  }

  pause(guildId) {
    const q = this.queues.get(guildId);
    if (!q || !q.current) return false;
    if (q.player.state.status === AudioPlayerStatus.Playing) {
      q.player.pause();
      return 'paused';
    }
    q.player.unpause();
    return 'resumed';
  }

  setVolume(guildId, vol) {
    const q = this.queues.get(guildId);
    if (!q || !q.current) return false;
    q.volume = Math.max(0, Math.min(100, vol));
    const subscriber = q.connection?.state?.subscription?.player;
    if (subscriber) {
      const resource = subscriber.state?.resource;
      if (resource?.volume) resource.volume.setVolume(q.volume / 100);
    }
    return q.volume;
  }

  leave(guildId) {
    const q = this.queues.get(guildId);
    if (!q) return;
    this.stop(guildId);
    if (q.connection) q.connection.destroy();
    this.queues.delete(guildId);
  }

  formatDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}

module.exports = MusicManager;
