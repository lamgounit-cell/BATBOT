const { readdirSync, statSync } = require('fs');
const { join } = require('path');

class CommandHandler {
  constructor(client) {
    this.client = client;
    client.commands = new Map();
    client.cooldowns = new Map();
  }

  load() {
    const commandsPath = join(__dirname, '..', 'commands');
    const categories = readdirSync(commandsPath);

    for (const category of categories) {
      const categoryPath = join(commandsPath, category);
      if (!statSync(categoryPath).isDirectory()) continue;

      const files = readdirSync(categoryPath).filter(f => f.endsWith('.js'));
      for (const file of files) {
        const command = require(join(categoryPath, file));
        if (!command.data || !command.execute) {
          console.warn(`[WARN] Command ${file} is missing data or execute`);
          continue;
        }
        command.category = category;
        command.filePath = join(categoryPath, file);
        this.client.commands.set(command.data.name, command);
      }
    }

    console.log(`[HANDLER] Loaded ${this.client.commands.size} commands`);
    return this.client.commands;
  }

  async registerSlashCommands() {
    const commands = [...this.client.commands.values()].map(c => c.data.toJSON());
    try {
      await this.client.application.commands.set(commands);
      console.log(`[HANDLER] Registered ${commands.length} global slash commands`);
    } catch (err) {
      console.error('[HANDLER] Failed to register commands:', err.message);
    }
  }
}

module.exports = CommandHandler;
