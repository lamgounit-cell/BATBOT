const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { errorEmbed } = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway').setDescription('Start a giveaway')
    .addStringOption(o => o.setName('prize').setDescription('Prize').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('e.g. 10m, 1h, 1d').setRequired(true))
    .addIntegerOption(o => o.setName('winners').setDescription('Winner count').setMinValue(1).setMaxValue(10)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return interaction.reply({ embeds: [errorEmbed('Need Manage Messages permission.')], ephemeral: true });

    const prize = interaction.options.getString('prize');
    const duration = interaction.options.getString('duration');
    const winners = interaction.options.getInteger('winners') || 1;
    const ms = require('ms');
    const endMs = ms(duration);
    if (!endMs) return interaction.reply({ embeds: [errorEmbed('Invalid duration.')], ephemeral: true });

    const endsAt = new Date(Date.now() + endMs);
    const embed = new EmbedBuilder().setColor(0xEB459E).setTitle('🎉 Giveaway').setDescription(`**${prize}**`)
      .addFields({ name: 'Ends', value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true }, { name: 'Winners', value: `${winners}`, inline: true }, { name: 'Host', value: interaction.user.tag, inline: true })
      .setFooter({ text: 'Click to enter!' }).setTimestamp(endsAt);
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('giveaway_enter').setLabel('🎉 Enter').setStyle(ButtonStyle.Primary));
    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    client.db.run('INSERT INTO giveaways (guild_id, channel_id, message_id, prize, winners, ends_at, hosted_by) VALUES ($guild_id, $channel_id, $message_id, $prize, $winners, $ends_at, $hosted_by)',
      { guild_id: interaction.guild.id, channel_id: interaction.channel.id, message_id: msg.id, prize, winners, ends_at: endsAt.toISOString(), hosted_by: interaction.user.id });

    setTimeout(async () => {
      try {
        const entries = client.giveawayEntries?.get(msg.id) || [];
        if (entries.length === 0) return interaction.channel.send(`❌ Giveaway **${prize}** ended with no entries.`).catch(() => {});
        const shuffled = [...entries].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, Math.min(winners, shuffled.length));
        await interaction.channel.send(`🎉 **Winner(s):** ${picked.map(id => `<@${id}>`).join(', ')} won **${prize}**!`);
        client.db.run('UPDATE giveaways SET ended = 1 WHERE message_id = $message_id', { message_id: msg.id });
      } catch {}
    }, endMs);
  },
};
