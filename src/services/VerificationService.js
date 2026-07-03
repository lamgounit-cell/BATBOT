const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const CAPTCHA_CATEGORIES = {
  fruits: { items: ['🍎','🍊','🍋','🍇','🍉','🍌','🍓','🍒','🍑','🥝','🍍','🥭'], label: 'fruits' },
  animals: { items: ['🐶','🐱','🐼','🐨','🐯','🦁','🐸','🐵','🐰','🦊','🐻','🐷'], label: 'animals' },
  vehicles: { items: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🛴','🚲','🛵'], label: 'vehicles' },
  food: { items: ['🍕','🌮','🍔','🌭','🥪','🥗','🍝','🍜','🍣','🥨','🧁','🍩'], label: 'food' },
  sports: { items: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🥊','🥋','⛸️','🏓'], label: 'sports equipment' },
  nature: { items: ['🌲','🌳','🌴','🌵','🌾','🌿','🍀','🍁','🍄','🌻','🌺','🌸'], label: 'nature items' },
};

class VerificationService {
  constructor(client) {
    this.client = client;
    client.verification = this;
    this.captchaStates = new Map();
  }

  generateEmojiCaptcha() {
    const catNames = Object.keys(CAPTCHA_CATEGORIES);
    const chosen = catNames[Math.floor(Math.random() * catNames.length)];
    const category = CAPTCHA_CATEGORIES[chosen];

    const shuffledTargets = [...category.items].sort(() => Math.random() - 0.5);
    const targetItems = shuffledTargets.slice(0, 4);

    const others = catNames.filter(n => n !== chosen).flatMap(n => CAPTCHA_CATEGORIES[n].items);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, 5);

    const allItems = [...targetItems, ...distractors].sort(() => Math.random() - 0.5);

    const answer = [];
    allItems.forEach((item, idx) => {
      if (targetItems.includes(item)) answer.push(idx);
    });

    return { grid: allItems, answer, prompt: `Select all **${category.label}**` };
  }

  buildCaptchaGrid(grid, selected = new Set(), disabled = false) {
    const rows = [];
    for (let r = 0; r < 3; r++) {
      const row = new ActionRowBuilder();
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`captcha_t_${idx}`)
            .setLabel(grid[idx])
            .setStyle(selected.has(idx) ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(disabled)
        );
      }
      rows.push(row);
    }
    rows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('captcha_submit')
          .setLabel('Submit')
          .setStyle(ButtonStyle.Success)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('captcha_reset')
          .setLabel('Reset')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(disabled)
      )
    );
    return rows;
  }

  async sendPanel(channel, guildId) {
    const row = this.client.db.get('SELECT * FROM guilds WHERE id = $id', { id: guildId });
    if (!row?.verification_enabled || !row.verification_role) return;
    const embed = new EmbedBuilder().setColor(0x57F287).setTitle('✅ Verification')
      .setDescription('Click below to verify and gain access.').setFooter({ text: 'Verify to access the server' });
    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verify_me').setLabel('Verify').setStyle(ButtonStyle.Success).setEmoji('✅')
    );
    await channel.send({ embeds: [embed], components: [button] });
  }

  async handleJoin(member, config) {
    if (!config?.verification_enabled || !config.verification_role) return;
    const role = member.guild.roles.cache.get(config.verification_role);
    if (!role) return;
    if (member.roles.cache.has(role.id)) return;
    try {
      const dm = await member.createDM();
      const captcha = this.generateEmojiCaptcha();
      const embed = new EmbedBuilder().setColor(0xFEE75C).setTitle('🔢 Welcome! Verify to access the server')
        .setDescription(`${captcha.prompt}\nClick the matching emojis, then press **Submit**.`)
        .setFooter({ text: 'You have 60 seconds' });
      const rows = this.buildCaptchaGrid(captcha.grid);
      const msg = await dm.send({ embeds: [embed], components: rows });
      this.captchaStates.set(msg.id, {
        userId: member.id,
        guildId: member.guild.id,
        grid: captcha.grid,
        answer: captcha.answer,
        prompt: captcha.prompt,
        roleId: config.verification_role,
        autoRoleId: config.auto_role || null,
        selected: new Set(),
        expiresAt: Date.now() + 120000,
      });
      setTimeout(() => {
        const state = this.captchaStates.get(msg.id);
        if (state && !state.resolved) {
          state.resolved = true;
          state.expired = true;
          msg.edit({ components: this.buildCaptchaGrid(captcha.grid, state.selected, true) }).catch(() => {});
        }
      }, 120000);
    } catch {}
  }

  async verifyMember(interaction) {
    const row = this.client.db.get('SELECT * FROM guilds WHERE id = $id', { id: interaction.guild.id });
    if (!row?.verification_role) return interaction.reply({ content: 'Verification not configured.', ephemeral: true });
    const role = interaction.guild.roles.cache.get(row.verification_role);
    if (!role) return interaction.reply({ content: 'Verification role not found.', ephemeral: true });
    if (interaction.member.roles.cache.has(role.id)) return interaction.reply({ content: 'Already verified.', ephemeral: true });

    if (row.captcha_enabled) {
      const captcha = this.generateEmojiCaptcha();
      const embed = new EmbedBuilder().setColor(0xFEE75C).setTitle('🔢 Captcha')
        .setDescription(`${captcha.prompt}\nClick the matching emojis, then press **Submit**.`)
        .setFooter({ text: 'You have 60 seconds' });
      const rows = this.buildCaptchaGrid(captcha.grid);
      await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
      const msg = await interaction.fetchReply();
      this.captchaStates.set(msg.id, {
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        grid: captcha.grid,
        answer: captcha.answer,
        prompt: captcha.prompt,
        roleId: row.verification_role,
        autoRoleId: null,
        selected: new Set(),
        expiresAt: Date.now() + 120000,
      });
      setTimeout(() => {
        const state = this.captchaStates.get(msg.id);
        if (state && !state.resolved) {
          state.resolved = true;
          state.expired = true;
          interaction.editReply({ components: this.buildCaptchaGrid(captcha.grid, state.selected, true) }).catch(() => {});
        }
      }, 120000);
      return;
    }
    await interaction.member.roles.add(role);
    await interaction.reply({ content: '✅ Verified!', ephemeral: true });
  }

  async handleCaptchaButton(interaction) {
    const msgId = interaction.message.id;
    const state = this.captchaStates.get(msgId);
    if (!state) {
      console.log(`[CAPTCHA] No state for msg ${msgId} (user ${interaction.user.tag})`);
      return interaction.reply({ content: 'This captcha session was lost (bot restart). Click **Verify** to start a new one.', ephemeral: true });
    }
    if (state.resolved && state.expired) {
      return interaction.reply({ content: 'Time expired. Click **Verify** to try again.', ephemeral: true });
    }
    if (state.resolved) {
      return interaction.reply({ content: 'Already verified!', ephemeral: true });
    }
    if (state.userId !== interaction.user.id) {
      return interaction.reply({ content: 'This captcha is not for you.', ephemeral: true });
    }
    if (Date.now() > state.expiresAt) {
      state.resolved = true;
      state.expired = true;
      await interaction.update({ components: this.buildCaptchaGrid(state.grid, state.selected, true) });
      return interaction.followUp({ content: '⏰ Time expired. Click **Verify** to try again.', ephemeral: true });
    }

    const customId = interaction.customId;

    if (customId === 'captcha_submit') {
      const correct = state.answer.length === state.selected.size &&
        state.answer.every(i => state.selected.has(i));
      if (correct) {
        state.resolved = true;
        console.log(`[CAPTCHA] User ${interaction.user.tag} passed captcha in guild ${state.guildId}`);
        const guild = this.client.guilds.cache.get(state.guildId);
        if (guild) {
          const member = await guild.members.fetch(state.userId).catch(() => null);
          if (member) {
            const role = guild.roles.cache.get(state.roleId);
            if (role) await member.roles.add(role).catch(() => {});
            if (state.autoRoleId) {
              const ar = guild.roles.cache.get(state.autoRoleId);
              if (ar) await member.roles.add(ar).catch(() => {});
            }
          }
        }
        await interaction.update({
          embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setColor(0x57F287).setDescription('✅ Verified! You now have access.')],
          components: this.buildCaptchaGrid(state.grid, state.selected, true),
        });
        this.captchaStates.delete(msgId);
      } else {
        const newCaptcha = this.generateEmojiCaptcha();
        const embed = EmbedBuilder.from(interaction.message.embeds[0])
          .setDescription(`${newCaptcha.prompt}\nWrong selection. Try again!\nClick the matching emojis, then press **Submit**.`);
        const rows = this.buildCaptchaGrid(newCaptcha.grid);
        await interaction.update({ embeds: [embed], components: rows });
        this.captchaStates.set(msgId, {
          ...state,
          grid: newCaptcha.grid,
          answer: newCaptcha.answer,
          prompt: newCaptcha.prompt,
          selected: new Set(),
          expiresAt: Date.now() + 60000,
        });
      }
      return;
    }

    if (customId === 'captcha_reset') {
      state.selected.clear();
      await interaction.update({ components: this.buildCaptchaGrid(state.grid, state.selected) });
      return;
    }

    if (customId.startsWith('captcha_t_')) {
      const idx = parseInt(customId.split('_')[2], 10);
      if (state.selected.has(idx)) state.selected.delete(idx);
      else state.selected.add(idx);
      await interaction.update({ components: this.buildCaptchaGrid(state.grid, state.selected) });
    }
  }
}

module.exports = VerificationService;