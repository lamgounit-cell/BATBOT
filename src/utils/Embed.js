const { EmbedBuilder } = require('discord.js');
const config = require('../config');

function createEmbed(options = {}) {
  return new EmbedBuilder()
    .setColor(options.color || config.embedColor)
    .setTimestamp(options.timestamp || new Date());
}

function successEmbed(description, title) {
  return createEmbed({ color: 0x57F287 })
    .setTitle(title || 'Success')
    .setDescription(description);
}

function errorEmbed(description, title) {
  return createEmbed({ color: 0xED4245 })
    .setTitle(title || 'Error')
    .setDescription(description);
}

function warningEmbed(description, title) {
  return createEmbed({ color: 0xFEE75C })
    .setTitle(title || 'Warning')
    .setDescription(description);
}

function infoEmbed(description, title) {
  return createEmbed({ color: 0x5865F2 })
    .setTitle(title || 'Information')
    .setDescription(description);
}

function logEmbed(action, options = {}) {
  const colorMap = {
    create: 0x57F287, delete: 0xED4245, update: 0xFEE75C,
    join: 0x57F287, leave: 0xED4245, warn: 0xFEE75C,
    ban: 0xED4245, unban: 0x57F287, kick: 0xED4245,
    timeout: 0xFEE75C, boost: 0xEB459E, alert: 0xED4245,
  };
  return createEmbed({ color: colorMap[action] || config.embedColor })
    .setTimestamp();
}

module.exports = { createEmbed, successEmbed, errorEmbed, warningEmbed, infoEmbed, logEmbed };
