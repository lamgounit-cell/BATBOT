class EconomyService {
  constructor(client) {
    this.client = client;
    client.economy = this;
    this.dailyCooldowns = new Map();
    this.workCooldowns = new Map();
  }

  getBalance(userId, guildId) {
    const row = this.client.db.get('SELECT * FROM economy WHERE user_id = $user_id AND guild_id = $guild_id', { user_id: userId, guild_id: guildId });
    return { balance: row?.balance || 0, bank: row?.bank || 0 };
  }

  addBalance(userId, guildId, amount) {
    const current = this.getBalance(userId, guildId);
    this.client.db.run(
      'INSERT INTO economy (user_id, guild_id, balance, bank) VALUES ($user_id, $guild_id, $balance, 0) ON CONFLICT(user_id, guild_id) DO UPDATE SET balance = $balance2',
      { user_id: userId, guild_id: guildId, balance: current.balance + amount, balance2: current.balance + amount }
    );
    return current.balance + amount;
  }

  removeBalance(userId, guildId, amount) {
    const current = this.getBalance(userId, guildId);
    if (current.balance < amount) return false;
    this.client.db.run('UPDATE economy SET balance = $balance WHERE user_id = $user_id AND guild_id = $guild_id', { balance: current.balance - amount, user_id: userId, guild_id: guildId });
    return true;
  }

  transfer(senderId, guildId, receiverId, amount) {
    if (!this.removeBalance(senderId, guildId, amount)) return false;
    this.addBalance(receiverId, guildId, amount);
    return true;
  }

  async daily(userId, guildId) {
    const key = `${guildId}:${userId}`;
    const now = Date.now();
    const last = this.dailyCooldowns.get(key);
    if (last && now - last < 86400000) return { claimed: false, remaining: 86400000 - (now - last) };
    this.dailyCooldowns.set(key, now);
    const reward = Math.floor(Math.random() * 200) + 100;
    this.addBalance(userId, guildId, reward);
    return { claimed: true, reward };
  }

  async work(userId, guildId) {
    const key = `work:${guildId}:${userId}`;
    const now = Date.now();
    const last = this.workCooldowns.get(key);
    if (last && now - last < 3600000) return { worked: false, remaining: 3600000 - (now - last) };
    this.workCooldowns.set(key, now);
    const earnings = Math.floor(Math.random() * 80) + 20;
    this.addBalance(userId, guildId, earnings);
    return { worked: true, earnings };
  }
}

module.exports = EconomyService;
