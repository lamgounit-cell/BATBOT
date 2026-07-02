const AntiRaid = require('../security/AntiRaid');
const AntiSpam = require('../security/AntiSpam');
const AntiNuker = require('../security/AntiNuker');
const AntiAlt = require('../security/AntiAlt');
const AntiToken = require('../security/AntiToken');
const { logEmbed } = require('../utils/Embed');

class SecurityService {
  constructor(client) {
    this.client = client;
    this.antiRaid = new AntiRaid(client);
    this.antiSpam = new AntiSpam(client);
    this.antiNuker = new AntiNuker(client);
    this.antiAlt = new AntiAlt(client);
    this.antiToken = new AntiToken(client);
    client.security = this;
  }

  handleJoin(member) { return { raid: this.antiRaid.checkJoin(member), alt: this.antiAlt.check(member) }; }
  handleMessage(message) { return message.author.bot ? [] : this.antiSpam.check(message); }
  handleNukerAction(guild, actionType, executor) {
    const report = this.antiNuker.track(guild.id, actionType, executor);
    if (report.detected) { this.antiNuker.handleNuker(guild, report); this.triggerSecurityAlert(guild, `Mass ${actionType}`, report); }
    return report;
  }
  handleWebhookCreate(webhook) { return this.antiToken.checkWebhook(webhook); }

  async triggerRaidAlert(guild, count) {
    await this.antiRaid.activateLockdown(guild);
    const embed = logEmbed('alert').setTitle('🚨 Raid Detected').setDescription(`**${count}** joins in a short period`).addFields({ name: 'Action', value: 'Lockdown activated' });
    const logChan = await this.getLogChannel(guild);
    if (logChan) await logChan.send({ embeds: [embed] }).catch(() => {});
  }

  async triggerSecurityAlert(guild, title, data) {
    const embed = logEmbed('alert').setTitle(`🛡️ ${title}`).addFields({ name: 'Details', value: `\`\`\`json\n${JSON.stringify(data, null, 2)}\`\`\`` });
    const logChan = await this.getLogChannel(guild);
    if (logChan) await logChan.send({ embeds: [embed] }).catch(() => {});
  }

  async getLogChannel(guild) {
    const row = this.client.db.get('SELECT logs_channel FROM guilds WHERE id = $id', { id: guild.id });
    return row?.logs_channel ? guild.channels.cache.get(row.logs_channel) || null : null;
  }
}

module.exports = SecurityService;
