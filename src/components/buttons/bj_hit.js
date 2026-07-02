const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

function calcHand(hand) {
  let score = hand.reduce((s, c) => s + c.score, 0);
  let aces = hand.filter(c => c.value === 'A').length;
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

module.exports = {
  customId: 'bj_hit',
  async execute(interaction, client) {
    const game = client.games?.get(`bj:${interaction.user.id}`);
    if (!game) return interaction.reply({ content: 'No active game. Start a new one with `/blackjack`.', ephemeral: true });

    game.player.push(game.deck.draw());
    const score = calcHand(game.player);

    if (score > 21) {
      client.games.delete(`bj:${interaction.user.id}`);
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('🃏 Blackjack - Bust!')
        .addFields(
          { name: 'Your Hand', value: game.player.map(c => `${c.value}${c.suit}`).join(' '), inline: false },
          { name: `Your Score`, value: `${score}`, inline: false },
        );
      return interaction.update({ embeds: [embed], components: [] });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Secondary),
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🃏 Blackjack')
      .addFields(
        { name: `Your Hand (${score})`, value: game.player.map(c => `${c.value}${c.suit}`).join(' '), inline: false },
        { name: 'Dealer', value: `${game.dealer[0].value}${game.dealer[0].suit} ❓`, inline: false },
      );

    await interaction.update({ embeds: [embed], components: [row] });
  },
};
