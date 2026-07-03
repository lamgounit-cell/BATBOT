const fs = require('fs');
const path = require('path');
const https = require('https');

class WelcomeService {
  constructor(client) {
    this.client = client;
    client.welcome = this;
    this.fontPath = null;
    this.fontReady = this.initFont();
  }

  async initFont() {
    const dir = path.join(__dirname, '..', '..', 'fonts');
    const fp = path.join(dir, 'Poppins-Bold.ttf');
    if (fs.existsSync(fp)) { this.fontPath = fp; return; }
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await this.download('https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf', fp);
      this.fontPath = fp;
    } catch { this.fontPath = null; }
  }

  download(url, dest) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      https.get(url, res => {
        if (res.statusCode >= 300 && res.headers.location) { file.close(); fs.unlinkSync(dest); this.download(res.headers.location, dest).then(resolve, reject); return; }
        if (res.statusCode !== 200) { file.close(); fs.unlinkSync(dest); reject(); return; }
        res.pipe(file); file.on('finish', () => { file.close(); resolve(); });
      }).on('error', () => { file.close(); try { fs.unlinkSync(dest); } catch {} reject(); });
    });
  }

  async handleMemberJoin(member) {
    const row = this.client.db.get('SELECT * FROM guilds WHERE id = $id', { id: member.guild.id });
    if (!row?.welcome_enabled || !row.welcome_channel) return;
    const channel = member.guild.channels.cache.get(row.welcome_channel);
    if (!channel) return;
    await this.fontReady;
    try {
      const card = await this.generateCard(member, 'welcome', row.welcome_image);
      const msg = `Welcome ${member.user} to **${member.guild.name}**!`;
      if (card) await channel.send({ content: msg, files: [{ attachment: card, name: 'welcome.png' }] });
      else await channel.send(msg);
    } catch {}
  }

  async handleMemberLeave(member) {
    const row = this.client.db.get('SELECT * FROM guilds WHERE id = $id', { id: member.guild.id });
    if (!row?.leave_enabled || !row.leave_channel) return;
    const channel = member.guild.channels.cache.get(row.leave_channel);
    if (!channel) return;
    await this.fontReady;
    try {
      const card = await this.generateCard(member, 'leave', row.welcome_image);
      if (card) await channel.send({ files: [{ attachment: card, name: 'leave.png' }] });
    } catch {}
  }

  async generateCard(member, type, bgUrl) {
    let createCanvas, loadImage, GlobalFonts;
    try { ({ createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')); } catch { return null; }
    if (this.fontPath) GlobalFonts.registerFromPath(this.fontPath, 'Poppins');
    const hasFont = this.fontPath && GlobalFonts.has('Poppins');
    const font = hasFont ? 'Poppins' : 'sans-serif';

    const W = 800, H = 420;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    if (bgUrl) {
      try { const bg = await loadImage(bgUrl); ctx.drawImage(bg, 0, 0, W, H); } catch { this.drawBg(ctx, W, H, type); }
    } else {
      this.drawBg(ctx, W, H, type);
    }

    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;

    const cx = W / 2;
    const avatarSize = 130;
    const avatarY = 40;
    try {
      const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
      ctx.save(); ctx.beginPath(); ctx.arc(cx, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
      ctx.drawImage(avatar, cx - avatarSize / 2, avatarY, avatarSize, avatarSize); ctx.restore();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath();
      ctx.arc(cx, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2); ctx.stroke();
    } catch {}

    ctx.shadowBlur = 6; ctx.shadowOffsetY = 3; ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.textAlign = 'center';

    ctx.fillStyle = type === 'welcome' ? '#ff8c00' : '#f04747';
    ctx.font = `bold 20px ${font}`;
    ctx.fillText(type === 'welcome' ? 'WELCOME' : 'GOODBYE', cx, avatarY + avatarSize + 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 44px ${font}`;
    ctx.fillText(`@${member.user.username}`, cx, avatarY + avatarSize + 105);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = `500 18px ${font}`;
    ctx.fillText(member.guild.name, cx, avatarY + avatarSize + 135);

    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, H - 45, W, 45);
    ctx.fillStyle = '#888888';
    ctx.font = `500 14px ${font}`;
    ctx.fillText(`Member #${member.guild.memberCount}`, cx, H - 16);

    return canvas.toBuffer('image/png');
  }

  drawBg(ctx, W, H, type) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    if (type === 'welcome') {
      g.addColorStop(0, '#0a0a23'); g.addColorStop(0.5, '#1a1a3e'); g.addColorStop(1, '#0d0d2b');
    } else {
      g.addColorStop(0, '#1a0a0a'); g.addColorStop(0.5, '#2e1010'); g.addColorStop(1, '#1a0a0a');
    }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = type === 'welcome' ? '#ff8c00' : '#f04747';
    ctx.lineWidth = 3; ctx.strokeRect(15, 15, W - 30, H - 30);
  }
}

module.exports = WelcomeService;