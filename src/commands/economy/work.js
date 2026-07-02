const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn coins'),

  async execute(interaction, client) {
    const result = await client.economy.work(interaction.user.id, interaction.guild.id);
    if (!result.worked) {
      const left = Math.ceil(result.remaining / 60000);
      return interaction.reply({ content: `⏰ You're tired. Come back in **${left} minute(s)**.`, ephemeral: true });
    }
    const jobs = ['programming', 'designing', 'consulting', 'teaching', 'building', 'delivering'];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    await interaction.reply({ embeds: [
      new EmbedBuilder().setColor(0x57F287).setTitle('💼 Work').setDescription(`You worked as a **${job}** and earned **🪙 ${result.earnings}** coins!`),
    ]});
  },
};
