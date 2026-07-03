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
      if (card) await channel.send({ files: [{ attachment: card, name: 'welcome.png' }] });
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
    const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
    if (this.fontPath) GlobalFonts.registerFromPath(this.fontPath, 'Poppins');
    const hasFont = this.fontPath && GlobalFonts.has('Poppins');
    const font = hasFont ? 'Poppins' : 'sans-serif';

    const W = 800, H = 400;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    if (bgUrl) {
      try { const bg = await loadImage(bgUrl); ctx.drawImage(bg, 0, 0, W, H); } catch { this.drawBg(ctx, W, H, type); }
    } else {
      this.drawBg(ctx, W, H, type);
    }

    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 4;

    const avatarSize = 110;
    const avatarX = 70, avatarY = H / 2 - avatarSize / 2;
    try {
      const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
      ctx.save(); ctx.beginPath(); ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize); ctx.restore();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2); ctx.stroke();
    } catch {}

    ctx.shadowBlur = 4; ctx.shadowOffsetY = 2; ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = type === 'welcome' ? '#43b581' : '#f04747';
    ctx.font = `bold 22px ${font}`; ctx.textAlign = 'left';
    ctx.fillText(type === 'welcome' ? 'WELCOME' : 'GOODBYE', avatarX + avatarSize + 30, avatarY + 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 38px ${font}`; ctx.textAlign = 'left';
    ctx.fillText(member.user.displayName, avatarX + avatarSize + 30, avatarY + 78);
    ctx.font = `500 18px ${font}`; ctx.fillStyle = '#cccccc';
    ctx.fillText(`@${member.user.username}`, avatarX + avatarSize + 30, avatarY + 105);

    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, H - 50, W, 50);
    ctx.fillStyle = '#999999';
    ctx.font = `500 15px ${font}`; ctx.textAlign = 'center';
    ctx.fillText(`Member #${member.guild.memberCount}  •  ${member.guild.name}`, W / 2, H - 18);

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
    ctx.strokeStyle = type === 'welcome' ? '#43b581' : '#f04747';
    ctx.lineWidth = 3; ctx.strokeRect(15, 15, W - 30, H - 30);
  }
}

module.exports = WelcomeService;