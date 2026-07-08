const { ActivityType } = require('discord.js');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`[READY] Logged in as ${client.user.tag} (ID: ${client.user.id})`);

    const statuses = [
      { name: 'over the server', type: ActivityType.Watching },
      { name: 'for intruders', type: ActivityType.Watching },
      { name: 'with security', type: ActivityType.Playing },
      { name: '/help', type: ActivityType.Listening },
    ];

    let i = 0;
    setInterval(() => {
      client.user.setActivity(statuses[i].name, { type: statuses[i].type });
      i = (i + 1) % statuses.length;
    }, 30000);

    const commands = [...client.commands.values()].map(c => c.data.toJSON());
    try {
      await client.application.commands.set(commands);
      console.log(`[HANDLER] Registered ${commands.length} global slash commands`);
      // Clear stale guild-level commands to remove duplicates
      for (const guild of client.guilds.cache.values()) {
        await guild.commands.set([]);
      }
      console.log(`[HANDLER] Cleared guild-level commands for ${client.guilds.cache.size} guilds`);
    } catch (err) {
      console.error('[HANDLER] Failed to register commands:', err.message);
    }

    console.log(`[READY] Bot is fully operational`);
  },
};
