const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const DB_PATH = path.resolve(config.dbPath);

class DatabaseManager {
  constructor() {
    this.db = null;
    this.ready = this.init();
  }

  async init() {
    const SQL = await initSqlJs();
    try {
      const buffer = fs.readFileSync(DB_PATH);
      this.db = new SQL.Database(buffer);
    } catch {
      this.db = new SQL.Database();
    }
    this.db.run('PRAGMA foreign_keys = ON');
    this.createTables();
    this.migrate();
    this.save();
    console.log(`[DB] SQLite ready`);
  }

  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS guilds (
        id TEXT PRIMARY KEY, prefix TEXT DEFAULT '!',
        embed_color INTEGER DEFAULT ${config.embedColor},
        logs_channel TEXT, welcome_channel TEXT,
        welcome_message TEXT DEFAULT 'Welcome {user} to {server}!',
        welcome_enabled INTEGER DEFAULT 0,
        leave_channel TEXT,
        leave_message TEXT DEFAULT '{user} left the server.',
        leave_enabled INTEGER DEFAULT 0,
        verification_role TEXT, verification_enabled INTEGER DEFAULT 0,
        captcha_enabled INTEGER DEFAULT 0,
        mod_role TEXT, admin_role TEXT,
        ticket_category TEXT, ticket_enabled INTEGER DEFAULT 0,
        auto_mod_enabled INTEGER DEFAULT 0,
        leveling_enabled INTEGER DEFAULT 0, economy_enabled INTEGER DEFAULT 0,
        auto_role TEXT
      );
      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT, user_id TEXT, moderator_id TEXT,
        reason TEXT, timestamp TEXT DEFAULT (datetime('now')),
        active INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT, channel_id TEXT, user_id TEXT,
        claimer_id TEXT, category TEXT,
        status TEXT DEFAULT 'open', created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS levels (
        user_id TEXT, guild_id TEXT,
        xp INTEGER DEFAULT 0, level INTEGER DEFAULT 1,
        PRIMARY KEY (user_id, guild_id)
      );
      CREATE TABLE IF NOT EXISTS economy (
        user_id TEXT, guild_id TEXT,
        balance INTEGER DEFAULT 0, bank INTEGER DEFAULT 0,
        daily_last TEXT, PRIMARY KEY (user_id, guild_id)
      );
      CREATE TABLE IF NOT EXISTS giveaways (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT, channel_id TEXT, message_id TEXT,
        prize TEXT, winners INTEGER DEFAULT 1,
        ends_at TEXT, hosted_by TEXT, ended INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS reaction_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT, channel_id TEXT, message_id TEXT,
        emoji TEXT, role_id TEXT
      );
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT, channel_id TEXT,
        message TEXT, remind_at TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS config (
        guild_id TEXT, key TEXT, value TEXT,
        PRIMARY KEY (guild_id, key)
      );
      CREATE TABLE IF NOT EXISTS birthdays (
        user_id TEXT, guild_id TEXT, month INTEGER, day INTEGER,
        PRIMARY KEY (user_id, guild_id)
      );
      CREATE TABLE IF NOT EXISTS voice_afk (
        user_id TEXT, guild_id TEXT, channel_id TEXT,
        afk_since TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, guild_id)
      );
      CREATE TABLE IF NOT EXISTS level_rewards (
        guild_id TEXT, level INTEGER, role_id TEXT,
        PRIMARY KEY (guild_id, level)
      );
    `);
  }

  migrate() {
    const migrations = [
      'ALTER TABLE guilds ADD COLUMN auto_role TEXT',
    ];
    for (const sql of migrations) {
      try { this.db.run(sql); } catch {}
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_PATH, Buffer.from(this.db.export()));
    } catch {}
  }

  _bind(stmt, params) {
    if (!params || Object.keys(params).length === 0) return;
    const named = {};
    for (const [k, v] of Object.entries(params)) {
      named[`${k.startsWith('$') ? '' : '$'}${k}`] = v;
    }
    stmt.bind(named);
  }

  get(sql, params = {}) {
    const stmt = this.db.prepare(sql);
    this._bind(stmt, params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  all(sql, params = {}) {
    const stmt = this.db.prepare(sql);
    this._bind(stmt, params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  run(sql, ...paramSets) {
    const stmt = this.db.prepare(sql);
    for (const params of paramSets) {
      stmt.reset();
      this._bind(stmt, params);
      stmt.step();
    }
    stmt.free();
    this.save();
    return { lastInsertRowid: this.db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] };
  }

  transaction(fn) {
    return (...args) => {
      this.db.run('BEGIN');
      try {
        const result = fn(...args);
        this.db.run('COMMIT');
        this.save();
        return result;
      } catch (e) {
        this.db.run('ROLLBACK');
        throw e;
      }
    };
  }
}

const instance = new DatabaseManager();
module.exports = instance;
