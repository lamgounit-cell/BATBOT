const { PermissionsBitField } = require('discord.js');

function hasPermission(member, permission) {
  if (!member) return false;
  if (member.permissions instanceof PermissionsBitField) {
    return member.permissions.has(permission);
  }
  return false;
}

function isModerator(member) {
  if (!member) return false;
  return hasPermission(member, PermissionsBitField.Flags.KickMembers) ||
         hasPermission(member, PermissionsBitField.Flags.BanMembers) ||
         hasPermission(member, PermissionsBitField.Flags.ModerateMembers);
}

function isAdministrator(member) {
  if (!member) return false;
  return hasPermission(member, PermissionsBitField.Flags.Administrator);
}

function canModerate(moderator, target) {
  if (!moderator || !target) return false;
  return moderator.roles.highest.position > target.roles.highest.position;
}

function getHighestRole(member) {
  return member.roles?.highest || null;
}

module.exports = { hasPermission, isModerator, isAdministrator, canModerate, getHighestRole };
