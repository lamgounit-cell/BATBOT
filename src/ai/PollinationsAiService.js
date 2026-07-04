class PollinationsAiService {
  constructor(client) {
    this.client = client;
    this.enabled = true;
    client.ai = this;
    console.log('[AI] Pollinations.ai initialized (free, no API key needed)');
  }

  async generate(prompt, opts = {}) {
    const messages = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    if (opts.history) messages.push(...opts.history);
    messages.push({ role: 'user', content: prompt });
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model: 'openai' }),
    });
    if (!res.ok) { const e = await res.text().catch(() => ''); throw new Error(`AI error: ${res.status} ${e}`); }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async generateWithImage(prompt, imageUrl, opts = {}) {
    const messages = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageUrl } }] });
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model: 'openai' }),
    });
    if (!res.ok) { const e = await res.text().catch(() => ''); throw new Error(`AI vision error: ${res.status} ${e}`); }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async countTokens(text) {
    return text.length;
  }
}

module.exports = PollinationsAiService;