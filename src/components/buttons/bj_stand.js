const { EmbedBuilder } = require('discord.js');

function calcHand(hand) {
  let score = hand.reduce((s, c) => s + c.score, 0);
  let aces = hand.filter(c => c.value === 'A').length;
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

module.exports = {
  customId: 'bj_stand',
  async execute(interaction, client) {
    const game = client.games?.get(`bj:${interaction.user.id}`);
    if (!game) return interaction.reply({ content: 'No active game.', ephemeral: true });

    while (calcHand(game.dealer) < 17) game.dealer.push(game.deck.draw());

    const pScore = calcHand(game.player);
    const dScore = calcHand(game.dealer);
    let result, color;
    if (dScore > 21 || pScore > dScore) { result = 'You win! 🎉'; color = 0x57F287; }
    else if (pScore === dScore) { result = 'Push! 🤝'; color = 0xFEE75C; }
    else { result = 'Dealer wins. 😔'; color = 0xED4245; }

    client.games.delete(`bj:${interaction.user.id}`);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🃏 Blackjack - ${result}`)
      .addFields(
        { name: `Your Hand (${pScore})`, value: game.player.map(c => `${c.value}${c.suit}`).join(' '), inline: false },
        { name: `Dealer (${dScore})`, value: game.dealer.map(c => `${c.value}${c.suit}`).join(' '), inline: false },
      );

    await interaction.update({ embeds: [embed], components: [] });
  },
};
