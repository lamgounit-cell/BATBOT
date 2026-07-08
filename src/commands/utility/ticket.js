const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Send the ticket creation panel')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand(s => s.setName('panel').setDescription('Send the ticket creation panel in this channel')),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'Only admins can use this.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('🎫 Support Ticket')
      .setDescription('Need help? Select a category below to create a ticket. Our team will assist you as soon as possible.')
      .setFooter({ text: 'Select a category to get started' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_category')
      .setPlaceholder('Select a category...')
      .addOptions([
        { label: 'General Support', value: 'general', description: 'General questions and help', emoji: '❓' },
        { label: 'Report a User', value: 'report', description: 'Report a rule violation', emoji: '🚨' },
        { label: 'Appeal', value: 'appeal', description: 'Appeal a punishment', emoji: '⚖️' },
        { label: 'Partnership', value: 'partnership', description: 'Partnership inquiries', emoji: '🤝' },
        { label: 'Other', value: 'other', description: 'Something else', emoji: '📝' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Panel sent!', ephemeral: true });
  },
};
