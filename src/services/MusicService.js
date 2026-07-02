const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const play = require('play-dl');
const { spawn } = require('child_process');
const https = require('https');
const path = require('path');

class MusicService {
  constructor(client) {
    this.client = client;
    this.queues = new Map();
    this.panelTimers = new Map();
    this.ytdlp = path.join(__dirname, '..', '..', 'yt-dlp.exe');
    client.music = this;
  }

  getQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, { songs: [], player: null, connection: null, current: null, volume: 0.5, paused: false, panelMsg: null, panelChannel: null });
    }
    return this.queues.get(guildId);
  }

  getAudioUrl(url) {
    return new Promise((resolve, reject) => {
      const yt = spawn(this.ytdlp, ['-f', 'bestaudio', '--get-url', '--no-playlist', url], { stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      yt.stdout.on('data', d => out += d.toString());
      yt.stderr.on('data', () => {});
      yt.on('close', code => code === 0 ? resolve(out.trim()) : reject(new Error(`yt-dlp exited with code ${code}`)));
      yt.on('error', reject);
    });
  }

  getAudioStream(url) {
    return new Promise((resolve, reject) => {
      https.get(url, res => {
        if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
        resolve(res);
      }).on('error', reject);
    });
  }

  async play(guildId, song) {
    const queue = this.getQueue(guildId);
    queue.current = song;
    queue.paused = false;

    if (!queue.player) {
      queue.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
      queue.player.on(AudioPlayerStatus.Idle, () => this.next(guildId));
      queue.player.on(AudioPlayerStatus.Paused, () => { queue.paused = true; this.updatePanel(guildId); });
      queue.player.on(AudioPlayerStatus.Playing, () => { queue.paused = false; this.updatePanel(guildId); });
      queue.player.on('error', () => this.next(guildId));
    }

    try {
      const audioUrl = await this.getAudioUrl(song.url);
      const stream = await this.getAudioStream(audioUrl);

      const resource = createAudioResource(stream, { inputType: 'webm/opus', inlineVolume: true });
      resource.volume.setVolume(queue.volume);
      queue.resource = resource;
      queue.startTime = Date.now();
      queue.player.play(resource);
      if (queue.connection?.state.status !== VoiceConnectionStatus.Destroyed) {
        queue.connection.subscribe(queue.player);
      }
      this.startPanelTimer(guildId);
      await this.updatePanel(guildId);
    } catch (e) {
      const fs = require('fs');
      fs.appendFileSync('errors.log', `[${new Date().toISOString()}] [Music] ${e.stack || e.message}\n`);
      await this.next(guildId);
      throw e;
    }
  }

  startPanelTimer(guildId) {
    if (this.panelTimers.has(guildId)) clearInterval(this.panelTimers.get(guildId));
    const timer = setInterval(() => this.updatePanel(guildId), 5000);
    this.panelTimers.set(guildId, timer);
  }

  stopPanelTimer(guildId) {
    if (this.panelTimers.has(guildId)) { clearInterval(this.panelTimers.get(guildId)); this.panelTimers.delete(guildId); }
  }

  async spotifyTrack(url) {
    try {
      const res = await fetch('https://api.song.link/v1-alpha.1/links?url=' + encodeURIComponent(url));
      const data = await res.json();
      const entity = Object.values(data.entitiesByUniqueId || {})[0];
      if (!entity) return null;
      return { name: entity.title, artist: entity.artistName };
    } catch { return null; }
  }

  async addSong(guildId, query, member) {
    const type = play.yt_validate(query);
    if (type === 'search') {
      const results = await play.search(query, { limit: 1 });
      if (!results.length) return null;
      return { title: results[0].title, url: results[0].url, duration: results[0].durationRaw, durationMs: results[0].durationInSec * 1000, requester: member.user.tag };
    }
    if (type === 'video') {
      const info = await play.video_basic_info(query);
      return { title: info.video_details.title, url: info.video_details.url, duration: info.video_details.durationRaw, durationMs: info.video_details.durationInSec * 1000, requester: member.user.tag };
    }
    if (play.sp_validate(query) === 'track') {
      const sp = await this.spotifyTrack(query);
      if (!sp) return null;
      const searchResults = await play.search(`${sp.name} ${sp.artist}`, { limit: 1 });
      if (!searchResults.length) return null;
      return { title: `${sp.name} - ${sp.artist}`, url: searchResults[0].url, duration: searchResults[0].durationRaw, durationMs: searchResults[0].durationInSec * 1000, requester: member.user.tag };
    }
    return null;
  }

  async join(member) {
    const channel = member.voice.channel;
    if (!channel) return null;
    const queue = this.getQueue(channel.guild.id);
    if (queue.connection) return channel;
    queue.connection = joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator });
    queue.panelChannel = channel;
    return channel;
  }

  cleanup(guildId) {
    const queue = this.getQueue(guildId);
    queue.current = null;
    queue.player?.stop();
    queue.connection?.destroy();
    queue.connection = null;
    this.stopPanelTimer(guildId);
    if (queue.panelMsg) { queue.panelMsg.delete().catch(() => {}); queue.panelMsg = null; }
  }

  async next(guildId) {
    const queue = this.getQueue(guildId);
    if (queue.songs.length === 0) {
      this.cleanup(guildId);
      return;
    }
    const song = queue.songs.shift();
    await this.play(guildId, song);
  }

  stop(guildId) {
    const queue = this.getQueue(guildId);
    queue.songs = [];
    this.cleanup(guildId);
  }

  skip(guildId) {
    const queue = this.getQueue(guildId);
    if (!queue.current) return false;
    queue.player?.stop();
    return true;
  }

  togglePause(guildId) {
    const queue = this.getQueue(guildId);
    if (!queue.player) return;
    if (queue.paused) queue.player.unpause();
    else queue.player.pause();
  }

  setVolume(guildId, vol) {
    const queue = this.getQueue(guildId);
    queue.volume = Math.max(0, Math.min(1, vol));
    if (queue.resource) queue.resource.volume.setVolume(queue.volume);
    this.updatePanel(guildId);
  }

  formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  progressBar(current, total, size = 12) {
    if (!total) return '─'.repeat(size);
    const filled = Math.round((current / total) * size);
    return '▬'.repeat(Math.max(0, filled)) + '🔘' + '▬'.repeat(Math.max(0, size - filled));
  }

  elapsed(guildId) {
    const q = this.getQueue(guildId);
    if (!q.current || !q.startTime) return 0;
    return q.paused ? (q.pauseOffset || 0) : Date.now() - q.startTime + (q.pauseOffset || 0);
  }

  async updatePanel(guildId) {
    const queue = this.getQueue(guildId);
    if (!queue.current || !queue.panelChannel) return;

    const elapsed = this.elapsed(guildId);
    const total = queue.current.durationMs || 1;
    const bar = this.progressBar(elapsed, total);
    const elapsedStr = this.formatTime(elapsed);
    const totalStr = queue.current.duration;

    const embed = new EmbedBuilder()
      .setColor(this.client.config.embedColor)
      .setTitle('🎵 Now Playing')
      .setDescription(`**[${queue.current.title}](${queue.current.url})**\n\n\`${bar}\`  **${elapsedStr} / ${totalStr}**\n\nVolume: **${Math.round(queue.volume * 100)}%**  ${queue.paused ? '⏸ Paused' : '▶ Playing'}`)
      .setFooter({ text: `Requested by ${queue.current.requester}` });

    const pauseBtn = new ButtonBuilder().setCustomId('mc_pause').setEmoji(queue.paused ? '▶️' : '⏸️').setStyle(ButtonStyle.Secondary);
    const skipBtn = new ButtonBuilder().setCustomId('mc_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary);
    const stopBtn = new ButtonBuilder().setCustomId('mc_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger);
    const volDown = new ButtonBuilder().setCustomId('mc_voldown').setEmoji('🔉').setStyle(ButtonStyle.Secondary);
    const volUp = new ButtonBuilder().setCustomId('mc_volup').setEmoji('🔊').setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder().addComponents(pauseBtn, skipBtn, stopBtn, volDown, volUp);

    try {
      if (queue.panelMsg) {
        await queue.panelMsg.edit({ embeds: [embed], components: [row] });
      } else {
        queue.panelMsg = await queue.panelChannel.send({ embeds: [embed], components: [row] });
      }
    } catch {}
  }
}

module.exports = MusicService;
