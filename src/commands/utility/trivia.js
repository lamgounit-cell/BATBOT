const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

const QUESTIONS = [
  { q: 'Who won the FIFA World Cup in 2014?', o: ['Germany', 'Brazil', 'Argentina', 'France'], a: 0, s: 'soccer' },
  { q: 'Which player has the most NBA championships?', o: ['Michael Jordan', 'Bill Russell', 'Kareem Abdul-Jabbar', 'LeBron James'], a: 1, s: 'basketball' },
  { q: 'Who is the all-time top scorer in FIFA World Cup history?', o: ['Ronaldo (Brazil)', 'Miroslav Klose', 'Pelé', 'Just Fontaine'], a: 1, s: 'soccer' },
  { q: 'What team did Lionel Messi play for before joining PSG?', o: ['Real Madrid', 'Barcelona', 'Manchester City', 'Juventus'], a: 1, s: 'soccer' },
  { q: 'How many NBA points did Kobe Bryant score in his career?', o: ['33,643', '38,387', '31,876', '35,289'], a: 0, s: 'basketball' },
  { q: 'Which country has won the most FIFA World Cup titles?', o: ['Argentina', 'Germany', 'Brazil', 'Italy'], a: 2, s: 'soccer' },
  { q: 'Who holds the record for most points in a single NBA game?', o: ['Michael Jordan', 'Wilt Chamberlain', 'Kobe Bryant', 'David Thompson'], a: 1, s: 'basketball' },
  { q: 'Which goalkeeper has the most clean sheets in Premier League history?', o: ['Peter Cech', 'David de Gea', 'Edwin van der Sar', 'Joe Hart'], a: 0, s: 'soccer' },
  { q: 'Who won the Ballon d\'Or in 2023?', o: ['Erling Haaland', 'Lionel Messi', 'Kylian Mbappé', 'Karim Benzema'], a: 1, s: 'soccer' },
  { q: 'Which NBA team has won the most championships?', o: ['Los Angeles Lakers', 'Boston Celtics', 'Chicago Bulls', 'Golden State Warriors'], a: 1, s: 'basketball' },
  { q: 'Who scored the "Hand of God" goal?', o: ['Diego Maradona', 'Pelé', 'Zinedine Zidane', 'Ronaldinho'], a: 0, s: 'soccer' },
  { q: 'What is the maximum points a player can score on a single NBA possession?', o: ['3', '4', '5', '6'], a: 1, s: 'basketball' },
  { q: 'Which club has the most UEFA Champions League titles?', o: ['Barcelona', 'Real Madrid', 'AC Milan', 'Bayern Munich'], a: 1, s: 'soccer' },
  { q: 'Who is the NBA\'s all-time leader in assists?', o: ['Magic Johnson', 'John Stockton', 'Chris Paul', 'Steve Nash'], a: 1, s: 'basketball' },
  { q: 'Which country won the 2022 FIFA World Cup?', o: ['France', 'Argentina', 'Brazil', 'Portugal'], a: 1, s: 'soccer' },
  { q: 'Who has the most triple-doubles in NBA history?', o: ['Oscar Robertson', 'Magic Johnson', 'Russell Westbrook', 'LeBron James'], a: 2, s: 'basketball' },
  { q: 'How many World Cup goals did Pelé score?', o: ['10', '12', '14', '16'], a: 1, s: 'soccer' },
  { q: 'Which player has the most 3-pointers in NBA history?', o: ['Ray Allen', 'Reggie Miller', 'Stephen Curry', 'James Harden'], a: 2, s: 'basketball' },
  { q: 'Who won the Premier League Golden Boot in 2023/24?', o: ['Erling Haaland', 'Harry Kane', 'Mohamed Salah', 'Cole Palmer'], a: 0, s: 'soccer' },
  { q: 'Which NBA player was nicknamed "The Answer"?', o: ['Allen Iverson', 'Kobe Bryant', 'Tim Duncan', 'Vince Carter'], a: 0, s: 'basketball' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Start a hard basketball/soccer trivia')
    .addStringOption(o => o.setName('sport').setDescription('Choose sport').addChoices(
      { name: 'Basketball', value: 'basketball' }, { name: 'Soccer', value: 'soccer' }, { name: 'Mixed', value: 'mixed' }
    )),

  async execute(interaction, client) {
    await interaction.deferReply();

    const sport = interaction.options.getString('sport') || 'mixed';
    const pool = sport === 'mixed' ? QUESTIONS : QUESTIONS.filter(q => q.s === sport);
    if (!pool.length) return interaction.editReply({ content: 'No questions for that sport.' });

    let score = 0;
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 5);

    for (let i = 0; i < shuffled.length; i++) {
      const q = shuffled[i];
      const buttons = q.o.map((opt, idx) => new ButtonBuilder().setCustomId(`triv_${idx}`).setLabel(opt).setStyle(ButtonStyle.Secondary));
      const row = new ActionRowBuilder().addComponents(buttons);

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(`Question ${i + 1}/${shuffled.length} — ${q.s === 'basketball' ? '🏀' : '⚽'} ${sport === 'mixed' ? q.s : sport}`)
        .setDescription(q.q);

      await interaction.editReply({ embeds: [embed], components: [row] });

      try {
        const result = await interaction.channel.awaitMessageComponent({
          filter: iu => iu.user.id === interaction.user.id,
          time: 20000,
          componentType: ComponentType.Button,
        });
        await result.deferUpdate();

        if (parseInt(result.customId.split('_')[1]) === q.a) {
          score++;
          await interaction.editReply({ embeds: [embed.setFooter({ text: '✅ Correct!' })], components: [] });
        } else {
          await interaction.editReply({ embeds: [embed.setFooter({ text: `❌ Wrong! Answer: ${q.o[q.a]}` })], components: [] });
        }
      } catch {
        await interaction.editReply({ embeds: [embed.setFooter({ text: `⏰ Time out! Answer: ${q.o[q.a]}` })], components: [] });
      }
    }

    await new Promise(r => setTimeout(r, 1500));
    const final = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('🏁 Trivia Complete')
      .setDescription(`You scored **${score}/${shuffled.length}**!`);
    await interaction.editReply({ embeds: [final] });
  },
};
