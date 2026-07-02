class WelcomeService {
  constructor(client) { this.client = client; client.welcome = this; }

  async handleMemberJoin(member) {
    const row = this.client.db.get('SELECT * FROM guilds WHERE id = $id', { id: member.guild.id });
    if (!row?.welcome_enabled || !row.welcome_channel) return;
    const channel = member.guild.channels.cache.get(row.welcome_channel);
    if (!channel) return;
    const message = (row.welcome_message || 'Welcome {user} to {server}!')
      .replace('{user}', member.user).replace('{server}', member.guild.name).replace('{count}', member.guild.memberCount);
    try {
      const card = await this.generateCard(member, 'welcome');
      if (card) await channel.send({ content: message, files: [{ attachment: card, name: 'welcome.png' }] });
      else await channel.send(message);
    } catch {}
  }

  async handleMemberLeave(member) {
    const row = this.client.db.get('SELECT * FROM guilds WHERE id = $id', { id: member.guild.id });
    if (!row?.leave_enabled || !row.leave_channel) return;
    const channel = member.guild.channels.cache.get(row.leave_channel);
    if (!channel) return;
    const message = (row.leave_message || '{user} left the server.')
      .replace('{user}', member.user.username).replace('{server}', member.guild.name).replace('{count}', member.guild.memberCount);
    try { await channel.send(message); } catch {}
  }

  async generateCard(member, type) {
    try {
      const { createCanvas, loadImage } = require('canvas');
      const width = 800, height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#1a1a2e'); gradient.addColorStop(0.5, '#16213e'); gradient.addColorStop(1, '#0f3460');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#e94560'; ctx.lineWidth = 4; ctx.strokeRect(10, 10, width - 20, height - 20);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(type === 'welcome' ? 'WELCOME' : 'GOODBYE', width / 2, 60);
      ctx.font = '28px sans-serif'; ctx.fillStyle = '#e94560';
      ctx.fillText(member.user.username, width / 2, 180);
      ctx.font = '20px sans-serif'; ctx.fillStyle = '#aaaaaa';
      ctx.fillText(`Member #${member.guild.memberCount}`, width / 2, 220);
      ctx.font = '18px sans-serif'; ctx.fillStyle = '#888888';
      ctx.fillText(member.guild.name, width / 2, 260);
      try {
        const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
        const size = 120, x = (width - size) / 2, y = 85;
        ctx.save(); ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
        ctx.drawImage(avatar, x, y, size, size); ctx.restore();
        ctx.strokeStyle = '#e94560'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.stroke();
      } catch {}
      return canvas.toBuffer();
    } catch { return null; }
  }
}

module.exports = WelcomeService;
