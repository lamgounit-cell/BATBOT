const { readdirSync, statSync } = require('fs');
const { join } = require('path');

class ComponentHandler {
  constructor(client) {
    this.client = client;
    client.buttons = new Map();
    client.selectMenus = new Map();
    client.modals = new Map();
  }

  load() {
    const basePath = join(__dirname, '..', 'components');
    const types = ['buttons', 'selectMenus', 'modals'];

    for (const type of types) {
      const typePath = join(basePath, type);
      if (!statSync(typePath, { throwIfNoEntry: false })) continue;
      const files = readdirSync(typePath).filter(f => f.endsWith('.js'));
      const mapName = type === 'selectMenus' ? 'selectMenus' : type;

      for (const file of files) {
        const component = require(join(typePath, file));
        const name = file.replace('.js', '');
        this.client[mapName].set(name, component);
      }

      console.log(`[HANDLER] Loaded ${files.length} ${type}`);
    }
  }
}

module.exports = ComponentHandler;
