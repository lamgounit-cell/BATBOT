const { readdirSync } = require('fs');
const { join } = require('path');

class EventHandler {
  constructor(client) {
    this.client = client;
  }

  load() {
    const eventsPath = join(__dirname, '..', 'events');
    const files = readdirSync(eventsPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const event = require(join(eventsPath, file));
      const eventName = event.name || file.replace('.js', '');

      if (event.once) {
        this.client.once(eventName, (...args) => event.execute(...args, this.client));
      } else {
        this.client.on(eventName, (...args) => event.execute(...args, this.client));
      }

      console.log(`[EVENT] Loaded: ${eventName}`);
    }

    console.log(`[HANDLER] Loaded ${files.length} events`);
  }
}

module.exports = EventHandler;
