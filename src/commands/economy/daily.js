const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),

  async execute(interaction, client) {
    const result = await client.economy.daily(interaction.user.id, interaction.guild.id);
    if (!result.claimed) {
      const left = Math.ceil(result.remaining / 3600000);
      return interaction.reply({ content: `⏰ Daily already claimed. Try again in **${left} hour(s)**.`, ephemeral: true });
    }
    await interaction.reply({ embeds: [
      new EmbedBuilder().setColor(0x57F287).setTitle('🎁 Daily Reward').setDescription(`You received **🪙 ${result.reward}** coins!`),
    ]});
  },
};
