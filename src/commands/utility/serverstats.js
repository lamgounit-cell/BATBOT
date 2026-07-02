const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Show server statistics'),

  async execute(interaction, client) {
    const guild = interaction.guild;
    await guild.members.fetch();

    const total = guild.memberCount;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const humans = total - bots;
    const online = guild.members.cache.filter(m => m.presence?.status === 'online').size;
    const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
    const categories = guild.channels.cache.filter(c => c.type === 4).size;
    const rolesCount = guild.roles.cache.size;
    const emojis = guild.emojis.cache.size;

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle(`📊 ${guild.name} Statistics`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: '👥 Members', value: `Total: ${total}\nHumans: ${humans}\nBots: ${bots}\nOnline: ${online}`, inline: true },
        { name: '📁 Channels', value: `Text: ${textChannels}\nVoice: ${voiceChannels}\nCategories: ${categories}`, inline: true },
        { name: '🎭 Roles', value: `${rolesCount}`, inline: true },
        { name: '😀 Emojis', value: `${emojis}`, inline: true },
        { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
