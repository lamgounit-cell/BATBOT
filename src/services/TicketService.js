const { EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/Embed');
const fs = require('fs');
const path = require('path');

class TicketService {
  constructor(client) { this.client = client; client.tickets = this; }

  async createTicket(interaction, category) {
    const row = this.client.db.get('SELECT ticket_category, ticket_enabled FROM guilds WHERE id = $id', { id: interaction.guild.id });
    if (!row?.ticket_enabled) return interaction.reply({ embeds: [errorEmbed('Tickets not configured. Run `/setup ticket_category` first.')], ephemeral: true });

    const existing = this.client.db.get('SELECT * FROM tickets WHERE guild_id = $guild_id AND user_id = $user_id AND status = "open"', { guild_id: interaction.guild.id, user_id: interaction.user.id });
    if (existing) return interaction.reply({ embeds: [errorEmbed('You already have an open ticket.')], ephemeral: true });

    const cat = interaction.guild.channels.cache.get(row.ticket_category);
    if (!cat) return interaction.reply({ embeds: [errorEmbed('Ticket category not found.')], ephemeral: true });

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      type: ChannelType.GuildText,
      parent: cat.id,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      ],
    });

    this.client.db.run('INSERT INTO tickets (guild_id, channel_id, user_id, category) VALUES ($guild_id, $channel_id, $user_id, $category)',
      { guild_id: interaction.guild.id, channel_id: channel.id, user_id: interaction.user.id, category: category || 'General' });

    const embed = new EmbedBuilder().setColor(0x5865F2).setTitle('Ticket Created')
      .setDescription(`Welcome ${interaction.user}! Support will be with you shortly.\n**Category:** ${category || 'General'}`).setTimestamp();
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger));
    await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row2] });
    await interaction.reply({ embeds: [successEmbed(`Ticket created: ${channel}`)], ephemeral: true });
  }

  async claimTicket(interaction) {
    const ticket = this.client.db.get('SELECT * FROM tickets WHERE channel_id = $channel_id AND status = "open"', { channel_id: interaction.channel.id });
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Not an active ticket.')], ephemeral: true });
    this.client.db.run('UPDATE tickets SET claimer_id = $claimer_id WHERE id = $id', { claimer_id: interaction.user.id, id: ticket.id });
    await interaction.channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    await interaction.reply({ embeds: [successEmbed(`Ticket claimed by ${interaction.user}`)] });
  }

  async closeTicket(interaction) {
    const ticket = this.client.db.get('SELECT * FROM tickets WHERE channel_id = $channel_id AND status = "open"', { channel_id: interaction.channel.id });
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Ticket not open.')], ephemeral: true });
    this.client.db.run('UPDATE tickets SET status = "closed" WHERE id = $id', { id: ticket.id });
    await this.generateTranscript(interaction.channel, ticket);
    await interaction.channel.permissionOverwrites.edit(ticket.user_id, { ViewChannel: false });
    await interaction.reply({ embeds: [successEmbed('Ticket closed.')] });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Reopen').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket_delete').setLabel('Delete').setStyle(ButtonStyle.Danger));
    await interaction.channel.send({ components: [row] });
  }

  async reopenTicket(interaction) {
    const ticket = this.client.db.get('SELECT * FROM tickets WHERE channel_id = $channel_id AND status = "closed"', { channel_id: interaction.channel.id });
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Ticket not closed.')], ephemeral: true });
    this.client.db.run('UPDATE tickets SET status = "open" WHERE id = $id', { id: ticket.id });
    await interaction.channel.permissionOverwrites.edit(ticket.user_id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    await interaction.reply({ embeds: [successEmbed('Ticket reopened.')] });
  }

  async deleteTicket(interaction) {
    this.client.db.run('DELETE FROM tickets WHERE channel_id = $channel_id', { channel_id: interaction.channel.id });
    await interaction.reply({ embeds: [successEmbed('Deleting ticket in 5s...')] });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }

  async generateTranscript(channel, ticket) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const msgs = messages.reverse().map(m => `[${m.author.tag}] ${m.content || '[Embed/Attachment]'}`).join('\n');
      const transcript = `Ticket Transcript - ${channel.name}\nUser: ${ticket.user_id}\nCategory: ${ticket.category}\n\n${msgs}`;
      const dir = path.resolve('./tickets');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${channel.id}.txt`), transcript);
    } catch {}
  }
}

module.exports = TicketService;
