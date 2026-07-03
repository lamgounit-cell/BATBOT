const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const https = require('https');
const path = require('path');
const fs = require('fs');
const ytDlpExec = require('yt-dlp-exec');

class MusicService {
  constructor(client) {
    this.client = client;
    this.queues = new Map();
    this.panelTimers = new Map();
    client.music = this;
  }

  getQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, { songs: [], player: null, connection: null, current: null, volume: 0.5, paused: false, panelMsg: null, panelChannel: null });
    }
    return this.queues.get(guildId);
  }

  ytArgs(extra = {}) {
    const isWin = process.platform === 'win32';
    const nodePath = isWin ? process.execPath : (process.env.NODE_PATH || process.execPath);
    const a = { 'no-playlist': true, ...extra };
    if (!isWin) a['js-runtimes'] = `node:${nodePath}`;
    if (process.env.COOKIES) {
      const cp = path.join(__dirname, '..', '..', 'cookies.txt');
      try { fs.writeFileSync(cp, process.env.COOKIES); } catch {}
      if (fs.existsSync(cp)) a.cookies = cp;
    }
    return a;
  }

  async ytGetUrl(url) {
    const clients = [
      { 'extractor-args': 'youtube:player_client=ios', format: 'bestaudio/best' },
      { 'extractor-args': 'youtube:player_client=android', format: 'bestaudio/best' },
      { 'extractor-args': 'youtube:player_client=web', 'add-headers': 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36', format: 'bestaudio/best' },
    ];
    for (const args of clients) {
      try {
        const { stdout } = await ytDlpExec(url, { ...this.ytArgs(args), 'get-url': true }, { timeout: 20000 });
        const u = stdout.trim();
        if (u) return u;
      } catch {}
    }
    const u = await this.invidiousUrl(url);
    if (u) return u;
    throw new Error('Could not extract audio URL from YouTube');
  }

  async invidiousUrl(url) {
    const instances = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.jing.rocks'];
    const id = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1];
    if (!id) return null;
    for (const base of instances) {
      try {
        const res = await fetch(`${base}/api/v1/videos/${id}`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) continue;
        const data = await res.json();
        const fmt = data.formatStreams?.find(f => f.encoding?.startsWith('opus') || f.type?.includes('webm'));
        if (fmt?.url) return fmt.url;
        const afmt = data.adaptiveFormats?.find(f => f.encoding?.startsWith('opus') || f.type?.includes('webm'));
        if (afmt?.url) return afmt.url;
      } catch {}
    }
    return null;
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

  async getAudioUrl(url) {
    return this.ytGetUrl(url);
  }

  async ytSearch(query) {
    const clients = [
      { 'extractor-args': 'youtube:player_client=ios' },
      { 'extractor-args': 'youtube:player_client=android' },
    ];
    for (const args of clients) {
      try {
        const { stdout } = await ytDlpExec(`ytsearch1:${query}`, { ...this.ytArgs(args), 'dump-json': true, 'flat-playlist': true }, { timeout: 15000 });
        const info = JSON.parse(stdout.trim());
        return { title: info.title, url: `https://youtu.be/${info.id}`, duration: info.duration_string || '0:00', durationMs: (info.duration || 0) * 1000 };
      } catch {}
    }
    const iv = await this.invidiousSearch(query);
    if (iv) return iv;
    throw new Error('Could not find song');
  }

  async invidiousSearch(query) {
    const instances = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.jing.rocks'];
    for (const base of instances) {
      try {
        const res = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) continue;
        const data = await res.json();
        const v = data[0];
        if (!v) continue;
        return { title: v.title, url: `https://youtu.be/${v.videoId}`, duration: v.lengthSeconds ? `${Math.floor(v.lengthSeconds / 60)}:${(v.lengthSeconds % 60).toString().padStart(2, '0')}` : '0:00', durationMs: (v.lengthSeconds || 0) * 1000 };
      } catch {}
    }
    return null;
  }

  async ytInfo(url) {
    const clients = [
      { 'extractor-args': 'youtube:player_client=ios' },
      { 'extractor-args': 'youtube:player_client=android' },
    ];
    for (const args of clients) {
      try {
        const { stdout } = await ytDlpExec(url, { ...this.ytArgs(args), 'dump-json': true }, { timeout: 15000 });
        const info = JSON.parse(stdout.trim());
        return { title: info.title, url: `https://youtu.be/${info.id}`, duration: info.duration_string || '0:00', durationMs: (info.duration || 0) * 1000 };
      } catch {}
    }
    const id = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1];
    if (id) {
      const iv = await this.invidiousInfo(id);
      if (iv) return iv;
    }
    throw new Error('Could not get video info');
  }

  async invidiousInfo(id) {
    const instances = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.jing.rocks'];
    for (const base of instances) {
      try {
        const res = await fetch(`${base}/api/v1/videos/${id}`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) continue;
        const data = await res.json();
        return { title: data.title, url: `https://youtu.be/${id}`, duration: data.lengthSeconds ? `${Math.floor(data.lengthSeconds / 60)}:${(data.lengthSeconds % 60).toString().padStart(2, '0')}` : '0:00', durationMs: (data.lengthSeconds || 0) * 1000 };
      } catch {}
    }
    return null;
  }

  isSpotify(url) {
    return /^https?:\/\/(open\.spotify\.com|spotify\.link)\//i.test(url);
  }

  async addSong(guildId, query, member) {
    const q = query.trim();
    if (this.isSpotify(q)) {
      const sp = await this.spotifyTrack(q);
      if (!sp) return null;
      const info = await this.ytSearch(`${sp.name} ${sp.artist}`);
      return { ...info, requester: member.user.tag };
    }
    if (/^https?:\/\//i.test(q)) {
      const info = await this.ytInfo(q);
      return { ...info, requester: member.user.tag };
    }
    const info = await this.ytSearch(q);
    return { ...info, requester: member.user.tag };
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
