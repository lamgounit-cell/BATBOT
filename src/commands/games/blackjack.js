const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class Deck {
  constructor() {
    this.cards = [];
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    for (const suit of suits) {
      for (const value of values) {
        this.cards.push({ value, suit, score: this.getScore(value) });
      }
    }
    this.shuffle();
  }
  getScore(v) { return ['J', 'Q', 'K'].includes(v) ? 10 : v === 'A' ? 11 : parseInt(v); }
  shuffle() { for (let i = this.cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]; } }
  draw() { return this.cards.pop(); }
}

function calcHand(hand) {
  let score = hand.reduce((s, c) => s + c.score, 0);
  let aces = hand.filter(c => c.value === 'A').length;
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play a game of blackjack'),

  async execute(interaction, client) {
    const deck = new Deck();
    const player = [deck.draw(), deck.draw()];
    const dealer = [deck.draw(), deck.draw()];

    const gameKey = `bj:${interaction.user.id}`;
    client.games = client.games || new Map();
    client.games.set(gameKey, { deck, player, dealer });

    const render = (p, d, reveal) => {
      const pScore = calcHand(p);
      const dScore = reveal ? calcHand(d) : d[0].score;
      return new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle('🃏 Blackjack')
        .addFields(
          { name: `Your Hand (${pScore})`, value: p.map(c => `${c.value}${c.suit}`).join(' '), inline: false },
          { name: `Dealer ${reveal ? `(${dScore})` : ''}`, value: reveal ? d.map(c => `${c.value}${c.suit}`).join(' ') : `${d[0].value}${d[0].suit} ❓`, inline: false },
        )
        .setFooter({ text: reveal ? (pScore > 21 ? 'Bust!' : pScore > dScore || dScore > 21 ? 'You win!' : pScore === dScore ? 'Push' : 'Dealer wins') : 'Hit or Stand?' });
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [render(player, dealer, false)], components: [row] });
  },
};
