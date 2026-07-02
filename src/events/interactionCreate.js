const { errorEmbed } = require('../utils/Embed');
const fs = require('fs');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        const now = Date.now();
        const cooldowns = client.cooldowns;
        if (!cooldowns.has(command.data.name)) {
          cooldowns.set(command.data.name, new Map());
        }

        const timestamps = cooldowns.get(command.data.name);
        const coolTime = command.cooldown || 3;
        if (timestamps.has(interaction.user.id)) {
          const expTime = timestamps.get(interaction.user.id) + (coolTime * 1000);
          if (now < expTime) {
            const left = ((expTime - now) / 1000).toFixed(1);
            return interaction.reply({
              embeds: [errorEmbed(`Please wait **${left}s** before using \`/${command.data.name}\` again.`)],
              ephemeral: true,
            });
          }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), coolTime * 1000);

        await command.execute(interaction, client);
      } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('captcha_')) {
          if (client.verification) await client.verification.handleCaptchaButton(interaction);
          return;
        }
        const button = client.buttons.get(interaction.customId);
        if (button) await button.execute(interaction, client);
      } else if (interaction.isStringSelectMenu()) {
        const menu = client.selectMenus.get(interaction.customId);
        if (menu) await menu.execute(interaction, client);
      } else if (interaction.isModalSubmit()) {
        const modal = client.modals.get(interaction.customId);
        if (modal) await modal.execute(interaction, client);
      }
    } catch (err) {
      console.error(`[INTERACTION] Error:`, err);
      try { fs.appendFileSync('errors.log', `[${new Date().toISOString()}] ${err.stack}\n`); } catch {}
      const reply = interaction.deferred || interaction.replied
        ? interaction.followUp.bind(interaction)
        : interaction.reply.bind(interaction);
      reply({
        embeds: [errorEmbed('An unexpected error occurred. Please try again.')],
        ephemeral: true,
      }).catch(() => {});
    }
  },
};
