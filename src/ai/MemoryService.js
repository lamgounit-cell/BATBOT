const config = require('../config');

class MemoryService {
  constructor(client) {
    this.client = client;
    this.maxHistory = config.aiMaxHistory;
    client.memory = this;
  }

  getHistory(userId) {
    return this.client.db.all(
      'SELECT * FROM ai_memory WHERE user_id = $uid ORDER BY created_at ASC',
      { uid: userId }
    );
  }

  addEntry(userId, role, content) {
    this.client.db.run(
      'INSERT INTO ai_memory (user_id, role, content) VALUES ($uid, $role, $content)',
      { uid: userId, role, content }
    );
    this.trim(userId);
  }

  trim(userId) {
    const count = this.client.db.get(
      'SELECT COUNT(*) as cnt FROM ai_memory WHERE user_id = $uid',
      { uid: userId }
    );
    if (count && count.cnt > this.maxHistory) {
      const excess = count.cnt - this.maxHistory;
      this.client.db.run(
        'DELETE FROM ai_memory WHERE rowid IN (SELECT rowid FROM ai_memory WHERE user_id = $uid ORDER BY created_at ASC LIMIT $limit)',
        { uid: userId, limit: excess }
      );
    }
  }

  clear(userId) {
    this.client.db.run('DELETE FROM ai_memory WHERE user_id = $uid', { uid: userId });
  }

  buildContext(userId, systemPrompt) {
    const history = this.getHistory(userId);
    const contents = [];
    for (const entry of history) {
      contents.push({ role: entry.role, parts: [{ text: entry.content }] });
    }
    return { history: contents, system: systemPrompt };
  }
}

module.exports = MemoryService;