const { EmbedBuilder } = require('discord.js');
const COLORS = { create: 0x57F287, delete: 0xED4245, update: 0xFEE75C, join: 0x57F287, leave: 0xED4245, boost: 0xEB459E, timeout: 0xFEE75C, kick: 0xED4245, ban: 0xED4245, unban: 0x57F287, command: 0x5865F2, error: 0xED4245, warn: 0xFEE75C, alert: 0xED4245, ticket: 0x5865F2, security: 0xED4245 };
const ICONS = { create: '✅', delete: '🗑️', update: '🔄', join: '📥', leave: '📤', boost: '💎', timeout: '⏰', kick: '👢', ban: '🔨', unban: '🔓', command: '💻', error: '❌', warn: '⚠️', alert: '🚨', ticket: '🎫', security: '🛡️' };

class LoggingService {
  constructor(client) {
    this.client = client;
    client.logger = this;
    this.logBuffer = [];
    console.log('[LOGGER] Initialized');
  }

  pushLog(type, title, guildId, fields = []) {
    this.logBuffer.unshift({ type, title, guildId, fields, time: new Date().toISOString() });
    if (this.logBuffer.length > 200) this.logBuffer.pop();
  }

  getLogs(guildId, limit = 50) {
    return this.logBuffer.filter(l => l.guildId === guildId).slice(0, limit);
  }

  async send(guild, data) {
    if (!guild) return;
    this.pushLog(data.type, data.title, guild.id, data.fields);

    const row = this.client.db.get('SELECT logs_channel FROM guilds WHERE id = $id', { id: guild.id });
    if (!row?.logs_channel) return;
    const channel = guild.channels.cache.get(row.logs_channel);
    if (!channel) return;

    const embed = new EmbedBuilder().setColor(COLORS[data.type] || 0x5865F2)
      .setTitle(`${ICONS[data.type] || '📋'} ${data.title || data.type}`)
      .setTimestamp().setFooter({ text: `ID: ${data.id || 'N/A'}` });
    if (data.description) embed.setDescription(data.description);
    if (data.fields) embed.addFields(data.fields);
    if (data.user) embed.setAuthor({ name: data.user.tag || data.user, iconURL: data.user.displayAvatarURL?.() });
    if (data.thumbnail) embed.setThumbnail(data.thumbnail);
    if (data.image) embed.setImage(data.image);
    try { await channel.send({ embeds: [embed] }); } catch {}
  }

  logMessageDelete(message) {
    return this.send(message.guild, { type: 'delete', title: 'Message Deleted', id: message.id, fields: [
      { name: 'Author', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
      { name: 'Channel', value: `${message.channel.name} (<#${message.channel.id}>)`, inline: true },
      { name: 'Content', value: message.content?.slice(0, 1000) || '*No content*', inline: false },
    ], user: message.author });
  }

  logMessageEdit(before, after) {
    return this.send(after.guild, { type: 'update', title: 'Message Edited', id: before.id, fields: [
      { name: 'Author', value: `${before.author.tag} (<@${before.author.id}>)`, inline: true },
      { name: 'Channel', value: `${before.channel.name} (<#${before.channel.id}>)`, inline: true },
      { name: 'Before', value: before.content?.slice(0, 500) || '*No content*', inline: false },
      { name: 'After', value: after.content?.slice(0, 500) || '*No content*', inline: false },
    ], user: before.author });
  }

  logMemberJoin(member) {
    return this.send(member.guild, { type: 'join', title: 'Member Joined', id: member.id, fields: [
      { name: 'User', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
      { name: 'Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Account Age', value: `${Math.floor((Date.now() - member.user.createdTimestamp) / 86400000)} days`, inline: true },
    ], user: member.user, thumbnail: member.user.displayAvatarURL() });
  }

  logMemberLeave(member) {
    return this.send(member.guild, { type: 'leave', title: 'Member Left', id: member.id, fields: [
      { name: 'User', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
      { name: 'Joined At', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown', inline: true },
      { name: 'Roles', value: member.roles.cache.size > 1 ? member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ').slice(0, 500) : 'None', inline: false },
    ], user: member.user, thumbnail: member.user.displayAvatarURL() });
  }

  logBan(guild, user, executor, reason) {
    return this.send(guild, { type: 'ban', title: 'Member Banned', id: user.id, fields: [
      { name: 'User', value: `${user.tag} (<@${user.id}>)`, inline: true },
      { name: 'Moderator', value: `${executor.tag} (<@${executor.id}>)`, inline: true },
      { name: 'Reason', value: reason || 'No reason', inline: false },
    ], user });
  }

  logUnban(guild, user) {
    return this.send(guild, { type: 'unban', title: 'Member Unbanned', id: user.id, fields: [
      { name: 'User', value: `${user.tag} (<@${user.id}>)`, inline: true },
    ], user });
  }

  logTimeout(member, executor, duration, reason) {
    return this.send(member.guild, { type: 'timeout', title: 'Member Timed Out', id: member.id, fields: [
      { name: 'User', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
      { name: 'Moderator', value: `${executor.tag} (<@${executor.id}>)`, inline: true },
      { name: 'Duration', value: `${duration} minutes`, inline: true },
      { name: 'Reason', value: reason || 'No reason', inline: false },
    ], user: member.user });
  }

  logRoleCreate(role) { return this.send(role.guild, { type: 'create', title: 'Role Created', id: role.id, fields: [{ name: 'Name', value: role.name, inline: true }, { name: 'Color', value: role.hexColor, inline: true }, { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true }] }); }
  logRoleDelete(role) { return this.send(role.guild, { type: 'delete', title: 'Role Deleted', id: role.id, fields: [{ name: 'Name', value: role.name, inline: true }] }); }
  logChannelCreate(channel) { return this.send(channel.guild, { type: 'create', title: 'Channel Created', id: channel.id, fields: [{ name: 'Name', value: channel.name, inline: true }, { name: 'Type', value: channel.type.toString(), inline: true }, { name: 'Category', value: channel.parent?.name || 'None', inline: true }] }); }
  logChannelDelete(channel) { return this.send(channel.guild, { type: 'delete', title: 'Channel Deleted', id: channel.id, fields: [{ name: 'Name', value: channel.name, inline: true }, { name: 'Type', value: channel.type.toString(), inline: true }] }); }

  logVoiceStateUpdate(oldState, newState) {
    const guild = newState.guild;
    const member = newState.member || oldState.member;
    if (!member) return;
    if (!oldState.channelId && newState.channelId)
      return this.send(guild, { type: 'join', title: 'Voice Channel Joined', id: member.id, fields: [{ name: 'User', value: `${member.user.tag}`, inline: true }, { name: 'Channel', value: `<#${newState.channelId}>`, inline: true }], user: member.user });
    if (oldState.channelId && !newState.channelId)
      return this.send(guild, { type: 'leave', title: 'Voice Channel Left', id: member.id, fields: [{ name: 'User', value: `${member.user.tag}`, inline: true }, { name: 'Channel', value: `<#${oldState.channelId}>`, inline: true }], user: member.user });
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId)
      return this.send(guild, { type: 'update', title: 'Voice Channel Moved', id: member.id, fields: [{ name: 'User', value: `${member.user.tag}`, inline: true }, { name: 'From', value: `<#${oldState.channelId}>`, inline: true }, { name: 'To', value: `<#${newState.channelId}>`, inline: true }], user: member.user });
  }

  logBoost(member) { return this.send(member.guild, { type: 'boost', title: 'Server Boosted', id: member.id, fields: [{ name: 'User', value: `${member.user.tag}`, inline: true }], user: member.user, thumbnail: member.user.displayAvatarURL() }); }
  logCommand(interaction) { return this.send(interaction.guild, { type: 'command', title: 'Command Used', id: interaction.id, fields: [{ name: 'User', value: `${interaction.user.tag}`, inline: true }, { name: 'Command', value: `/${interaction.commandName}`, inline: true }], user: interaction.user }); }
  logNicknameUpdate(member, oldNick, newNick) { return this.send(member.guild, { type: 'update', title: 'Nickname Changed', id: member.id, fields: [{ name: 'User', value: `${member.user.tag}`, inline: true }, { name: 'Before', value: oldNick || member.user.username, inline: true }, { name: 'After', value: newNick || member.user.username, inline: true }], user: member.user }); }
  logAvatarUpdate(user) { const guild = user.client?.guilds?.cache?.first(); return guild ? this.send(guild, { type: 'update', title: 'Avatar Changed', id: user.id, fields: [{ name: 'User', value: `${user.tag}`, inline: true }], user, thumbnail: user.displayAvatarURL({ size: 256 }) }) : null; }
  logUsernameUpdate(user, oldTag, newTag) { const guild = user.client?.guilds?.cache?.first(); return guild ? this.send(guild, { type: 'update', title: 'Username Changed', id: user.id, fields: [{ name: 'User', value: `<@${user.id}>`, inline: true }, { name: 'Before', value: oldTag, inline: true }, { name: 'After', value: newTag, inline: true }], user }) : null; }
  logSecurityAlert(guild, title, description, fields = []) { return this.send(guild, { type: 'security', title, id: guild.id, description, fields }); }
}

module.exports = LoggingService;
