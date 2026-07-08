const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure bot settings')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand(s => s.setName('logs').setDescription('Set log channel').addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true)))
    .addSubcommand(s => s.setName('welcome').setDescription('Set welcome channel').addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true)).addStringOption(o => o.setName('message').setDescription('Welcome message')))
    .addSubcommand(s => s.setName('leave').setDescription('Set leave channel').addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true)).addStringOption(o => o.setName('message').setDescription('Leave message')))
    .addSubcommand(s => s.setName('ticket_category').setDescription('Set ticket category').addChannelOption(o => o.setName('category').setDescription('Category').setRequired(true)))
    .addSubcommand(s => s.setName('verify').setDescription('Setup verification').addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)).addStringOption(o => o.setName('type').setDescription('Type').addChoices({ name: 'Button', value: 'button' }, { name: 'Captcha', value: 'captcha' })))
    .addSubcommand(s => s.setName('automod').setDescription('Toggle automod').addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable').setRequired(true)))
    .addSubcommand(s => s.setName('leveling').setDescription('Toggle leveling').addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable').setRequired(true)))
    .addSubcommand(s => s.setName('auto_role').setDescription('Set auto-role for new members').addRoleOption(o => o.setName('role').setDescription('Role to assign').setRequired(true)))
    .addSubcommand(s => s.setName('caps').setDescription('Toggle excessive caps filter').addBooleanOption(o => o.setName('enabled').setDescription('Allow caps?').setRequired(true)))
    .addSubcommand(s => s.setName('welcome_image').setDescription('Set welcome card background image URL').addStringOption(o => o.setName('url').setDescription('Image URL (leave empty to remove)').setRequired(false)))
    .addSubcommand(s => s.setName('levelreward_add').setDescription('Add a role reward for reaching a level').addIntegerOption(o => o.setName('level').setDescription('Level').setRequired(true)).addRoleOption(o => o.setName('role').setDescription('Role to assign').setRequired(true)))
    .addSubcommand(s => s.setName('levelreward_remove').setDescription('Remove a level reward').addIntegerOption(o => o.setName('level').setDescription('Level').setRequired(true))),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ embeds: [errorEmbed('Admin only.')], ephemeral: true });

    const sub = interaction.options.getSubcommand();
    if (sub === 'logs') {
      const ch = interaction.options.getChannel('channel');
      client.db.run('INSERT INTO guilds (id, logs_channel) VALUES ($id, $channel) ON CONFLICT(id) DO UPDATE SET logs_channel = $channel2', { id: interaction.guild.id, channel: ch.id, channel2: ch.id });
      return interaction.reply({ embeds: [successEmbed(`Logs → ${ch}`)], ephemeral: true });
    }
    if (sub === 'welcome') {
      const ch = interaction.options.getChannel('channel');
      const msg = interaction.options.getString('message') || 'Welcome {user} to {server}!';
      client.db.run('INSERT INTO guilds (id, welcome_channel, welcome_message, welcome_enabled) VALUES ($id, $ch, $msg, 1) ON CONFLICT(id) DO UPDATE SET welcome_channel = $ch2, welcome_message = $msg2, welcome_enabled = 1',
        { id: interaction.guild.id, ch: ch.id, msg, ch2: ch.id, msg2: msg });
      return interaction.reply({ embeds: [successEmbed(`Welcome → ${ch}`)], ephemeral: true });
    }
    if (sub === 'leave') {
      const ch = interaction.options.getChannel('channel');
      const msg = interaction.options.getString('message') || '{user} left.';
      client.db.run('INSERT INTO guilds (id, leave_channel, leave_message, leave_enabled) VALUES ($id, $ch, $msg, 1) ON CONFLICT(id) DO UPDATE SET leave_channel = $ch2, leave_message = $msg2, leave_enabled = 1',
        { id: interaction.guild.id, ch: ch.id, msg, ch2: ch.id, msg2: msg });
      return interaction.reply({ embeds: [successEmbed(`Leave → ${ch}`)], ephemeral: true });
    }
    if (sub === 'ticket_category') {
      const cat = interaction.options.getChannel('category');
      client.db.run('INSERT INTO guilds (id, ticket_category, ticket_enabled) VALUES ($id, $cat, 1) ON CONFLICT(id) DO UPDATE SET ticket_category = $cat2, ticket_enabled = 1',
        { id: interaction.guild.id, cat: cat.id, cat2: cat.id });
      return interaction.reply({ embeds: [successEmbed(`Tickets → ${cat}`)], ephemeral: true });
    }
    if (sub === 'verify') {
      const role = interaction.options.getRole('role');
      const type = interaction.options.getString('type');
      client.db.run('INSERT INTO guilds (id, verification_role, verification_enabled, captcha_enabled) VALUES ($id, $role, 1, $captcha) ON CONFLICT(id) DO UPDATE SET verification_role = $role2, verification_enabled = 1, captcha_enabled = $captcha2',
        { id: interaction.guild.id, role: role.id, captcha: type === 'captcha' ? 1 : 0, role2: role.id, captcha2: type === 'captcha' ? 1 : 0 });
      return interaction.reply({ embeds: [successEmbed(`Verification → ${role}`)], ephemeral: true });
    }
    if (sub === 'automod') {
      const en = interaction.options.getBoolean('enabled');
      client.db.run('INSERT INTO guilds (id, auto_mod_enabled) VALUES ($id, $en) ON CONFLICT(id) DO UPDATE SET auto_mod_enabled = $en2',
        { id: interaction.guild.id, en: en ? 1 : 0, en2: en ? 1 : 0 });
      return interaction.reply({ embeds: [successEmbed(`Auto-mod ${en ? 'ON' : 'OFF'}`)], ephemeral: true });
    }
    if (sub === 'leveling') {
      const en = interaction.options.getBoolean('enabled');
      client.db.run('INSERT INTO guilds (id, leveling_enabled) VALUES ($id, $en) ON CONFLICT(id) DO UPDATE SET leveling_enabled = $en2',
        { id: interaction.guild.id, en: en ? 1 : 0, en2: en ? 1 : 0 });
      return interaction.reply({ embeds: [successEmbed(`Leveling ${en ? 'ON' : 'OFF'}`)], ephemeral: true });
    }
    if (sub === 'auto_role') {
      const role = interaction.options.getRole('role');
      client.db.run('INSERT INTO guilds (id, auto_role) VALUES ($id, $rid) ON CONFLICT(id) DO UPDATE SET auto_role = $rid2',
        { id: interaction.guild.id, rid: role.id, rid2: role.id });
      return interaction.reply({ embeds: [successEmbed(`Auto-role set to ${role}`)], ephemeral: true });
    }
    if (sub === 'caps') {
      const en = interaction.options.getBoolean('enabled');
      client.db.run('INSERT OR REPLACE INTO config (guild_id, key, value) VALUES ($gid, $key, $val)',
        { gid: interaction.guild.id, key: 'excessive_caps', val: en ? 'true' : 'false' });
      return interaction.reply({ embeds: [successEmbed(`Caps filter ${en ? 'ON' : 'OFF'}`)], ephemeral: true });
    }
    if (sub === 'welcome_image') {
      const url = interaction.options.getString('url');
      client.db.run('INSERT INTO guilds (id) VALUES ($id) ON CONFLICT(id) DO UPDATE SET welcome_image = $url',
        { id: interaction.guild.id, url: url || null });
      return interaction.reply({ embeds: [successEmbed(url ? `Welcome background set` : `Welcome background removed`)], ephemeral: true });
    }
    if (sub === 'levelreward_add') {
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');
      if (level < 1) return interaction.reply({ embeds: [errorEmbed('Level must be 1 or higher.')], ephemeral: true });
      client.db.run('INSERT OR REPLACE INTO level_rewards (guild_id, level, role_id) VALUES ($gid, $lvl, $rid)',
        { gid: interaction.guild.id, lvl: level, rid: role.id });
      return interaction.reply({ embeds: [successEmbed(`Level **${level}** → ${role}`)], ephemeral: true });
    }
    if (sub === 'levelreward_remove') {
      const level = interaction.options.getInteger('level');
      client.db.run('DELETE FROM level_rewards WHERE guild_id = $gid AND level = $lvl',
        { gid: interaction.guild.id, lvl: level });
      return interaction.reply({ embeds: [successEmbed(`Removed reward for level **${level}**`)], ephemeral: true });
    }
  },
};
