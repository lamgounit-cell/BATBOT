const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const EMOJIS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐', '🔔'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Play the slot machine'),

  async execute(interaction, client) {
    const reel1 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const reel2 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const reel3 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

    let result, color, winnings = 0;
    if (reel1 === reel2 && reel2 === reel3) {
      const multipliers = { '7️⃣': 10, '💎': 8, '⭐': 5, '🔔': 4, '🍒': 3, '🍇': 3, '🍊': 2, '🍋': 2 };
      winnings = (multipliers[reel1] || 3) * 50;
      result = `JACKPOT! +🪙${winnings}`;
      color = 0x57F287;
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      result = 'Small win! +🪙10';
      winnings = 10;
      color = 0xFEE75C;
    } else {
      result = 'No win. Try again!';
      color = 0xED4245;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🎰 Slots')
      .setDescription(`**${reel1} ${reel2} ${reel3}**`)
      .setFooter({ text: result });

    if (winnings > 0 && client.economy) {
      client.economy.addBalance(interaction.user.id, interaction.guild.id, winnings);
    }

    await interaction.reply({ embeds: [embed] }).catch(() => {});
  },
};
