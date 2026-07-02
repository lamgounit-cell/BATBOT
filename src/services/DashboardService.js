const express = require('express');
const path = require('path');
const fs = require('fs');

class DashboardService {
  constructor(client, app) {
    this.client = client;
    this.app = app || express();
    this.PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin';
    this.start();
    client.dashboard = this;
  }

  start() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '..', 'webserver', 'public')));

    // Login endpoint (no auth required)
    this.app.post('/api/login', (req, res) => {
      if (req.body.password === this.PASSWORD) return res.json({ token: this.PASSWORD });
      res.status(401).json({ error: 'Wrong password' });
    });

    // Auth middleware (protects all other /api routes)
    this.app.use('/api', (req, res, next) => {
      const token = req.headers.authorization;
      if (token !== `Bearer ${this.PASSWORD}`) return res.status(401).json({ error: 'Unauthorized' });
      next();
    });

    // Bot info
    this.app.get('/api/bot', (req, res) => {
      const u = this.client.user;
      res.json({ username: u.username, tag: u.tag, avatar: u.displayAvatarURL({ size: 256 }), id: u.id });
    });

    // Stats
    this.app.get('/api/stats', (req, res) => {
      const guilds = this.client.guilds.cache;
      const totalMembers = guilds.reduce((a, g) => a + g.memberCount, 0);
      res.json({
        servers: guilds.size,
        members: totalMembers,
        users: this.client.users.cache.size,
        commands: this.client.commands.size,
        uptime: Math.floor((Date.now() - this.client.readyTimestamp) / 1000),
        ping: this.client.ws.ping,
      });
    });

    // Guilds list
    this.app.get('/api/guilds', (req, res) => {
      res.json(this.client.guilds.cache.map(g => ({
        id: g.id, name: g.name, icon: g.iconURL(), memberCount: g.memberCount,
        ownerId: g.ownerId,
      })));
    });

    // Helpers to resolve names from IDs
    const userTag = (guild, id) => {
      if (!id) return 'Unknown';
      const m = guild.members.cache.get(id);
      if (m) return m.user.tag;
      const u = this.client.users.cache.get(id);
      return u ? u.tag : id;
    };
    const channelName = (guild, id) => {
      if (!id) return '';
      const ch = guild.channels.cache.get(id);
      return ch ? `#${ch.name} (${id})` : `#deleted-channel (${id})`;
    };
    const roleName = (guild, id) => {
      if (!id) return '';
      const r = guild.roles.cache.get(id);
      return r ? `@${r.name} (${id})` : `@deleted-role (${id})`;
    };

    // Guild config
    this.app.get('/api/guild/:id', async (req, res) => {
      const guild = this.client.guilds.cache.get(req.params.id);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });
      const config = this.client.db.get('SELECT * FROM guilds WHERE id = $id', { id: guild.id }) || {};
      const warnings = this.client.db.all('SELECT * FROM warnings WHERE guild_id = $guild_id ORDER BY timestamp DESC LIMIT 50', { guild_id: guild.id });
      const levels = this.client.db.all('SELECT * FROM levels WHERE guild_id = $guild_id ORDER BY level DESC, xp DESC LIMIT 10', { guild_id: guild.id });
      const economy = this.client.db.all('SELECT * FROM economy WHERE guild_id = $guild_id ORDER BY balance DESC LIMIT 10', { guild_id: guild.id });
      const tickets = this.client.db.all('SELECT * FROM tickets WHERE guild_id = $guild_id ORDER BY created_at DESC LIMIT 20', { guild_id: guild.id });

      // Resolve names
      let ownerName = guild.ownerId;
      try {
        const owner = await guild.fetchOwner();
        ownerName = owner.user.tag;
      } catch {}

      const names = {};
      for (const id of [...new Set([...warnings.map(w => w.user_id), ...warnings.map(w => w.moderator_id), ...levels.map(l => l.user_id), ...economy.map(e => e.user_id), ...tickets.map(t => t.user_id)].filter(Boolean))]) {
        names[id] = userTag(guild, id);
      }

      res.json({
        guild: { id: guild.id, name: guild.name, icon: guild.iconURL(), memberCount: guild.memberCount, ownerId: guild.ownerId, ownerName },
        config: {
          ...config,
          _channelNames: {
            logs_channel: channelName(guild, config.logs_channel),
            welcome_channel: channelName(guild, config.welcome_channel),
            leave_channel: channelName(guild, config.leave_channel),
            ticket_category: channelName(guild, config.ticket_category),
          },
          _roleNames: {
            verification_role: roleName(guild, config.verification_role),
          },
        },
        warnings: warnings.map(w => ({ ...w, userName: names[w.user_id] || w.user_id, modName: names[w.moderator_id] || w.moderator_id })),
        levels: levels.map(l => ({ ...l, userName: names[l.user_id] || l.user_id })),
        economy: economy.map(e => ({ ...e, userName: names[e.user_id] || e.user_id })),
        tickets: tickets.map(t => ({ ...t, userName: names[t.user_id] || t.user_id })),
      });
    });

    // Update guild config
    this.app.put('/api/guild/:id/config', (req, res) => {
      const guild = this.client.guilds.cache.get(req.params.id);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });
      const allowed = ['logs_channel', 'welcome_channel', 'welcome_message', 'leave_channel', 'leave_message',
        'verification_role', 'ticket_category', 'auto_mod_enabled', 'leveling_enabled', 'welcome_enabled', 'leave_enabled',
        'verification_enabled', 'captcha_enabled', 'ticket_enabled', 'prefix', 'mod_role', 'admin_role', 'auto_role'];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields' });
      const sets = Object.keys(updates).map(k => `${k} = $${k}`).join(', ');
      const params = { id: guild.id };
      for (const [k, v] of Object.entries(updates)) params[k] = v;
      try {
        this.client.db.run(`INSERT INTO guilds (id) VALUES ($id) ON CONFLICT(id) DO UPDATE SET ${sets}`, params);
        res.json({ success: true, updated: Object.keys(updates) });
      } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // Recent logs
    this.app.get('/api/guild/:id/logs', (req, res) => {
      const guild = this.client.guilds.cache.get(req.params.id);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });
      const logs = this.client.logger?.getLogs(guild.id) || [];
      res.json({ logs });
    });

    // Clear warnings
    this.app.delete('/api/guild/:id/warnings/:userId', (req, res) => {
      this.client.moderation.clearWarnings(req.params.id, req.params.userId);
      res.json({ success: true });
    });
  }
}

module.exports = DashboardService;
