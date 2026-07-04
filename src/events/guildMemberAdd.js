module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    if (client.welcome) await client.welcome.handleMemberJoin(member);
    if (client.logger) client.logger.logMemberJoin(member);
    const row = client.db.get('SELECT * FROM guilds WHERE id = $id', { id: member.guild.id });
    if (client.verification) await client.verification.handleJoin(member, row);

    if (row?.auto_role && !row?.captcha_enabled) {
      const role = member.guild.roles.cache.get(row.auto_role);
      if (role) try { await member.roles.add(role); } catch {}
    }

    if (!client.security) return;

    const result = client.security.handleJoin(member);

    if (result.raid?.raid && result.raid.count >= 10) {
      try {
        await member.kick(`[ANTI_RAID] Mass join detected (${result.raid.count} joins)`);
      } catch {}
    }

    for (const alt of result.alt) {
      if (alt.type === 'FRESH_ACCOUNT' && alt.severity === 'high') {
        try {
          await member.timeout(3600000, `[ANTI_ALT] Account age: ${alt.age} days`);
        } catch {}
      }
    }
  },
};
