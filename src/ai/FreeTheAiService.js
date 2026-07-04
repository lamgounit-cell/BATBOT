const config = require('../config');

class FreeTheAiService {
  constructor(client) {
    this.client = client;
    this.baseUrl = 'https://api.freetheai.xyz/v1';
    this.model = config.aiModel;
    this.apiKey = config.freeTheAiKey;
    this.enabled = !!this.apiKey && config.aiEnabled;
    client.ai = this;
    if (!this.apiKey) console.log('[AI] No FreeTheAi API key set — AI features disabled');
    else console.log(`[AI] FreeTheAi initialized (model: ${this.model})`);
  }

  async generate(prompt, opts = {}) {
    if (!this.enabled) throw new Error('AI is not configured. Set FREETHEAI_API_KEY.');
    const messages = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    if (opts.history) messages.push(...opts.history);
    messages.push({ role: 'user', content: prompt });
    const body = { model: this.model, messages };
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.text().catch(() => ''); throw new Error(`AI API error: ${res.status} ${e}`); }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async* generateStream(prompt, opts = {}) {
    if (!this.enabled) throw new Error('AI is not configured. Set FREETHEAI_API_KEY.');
    const messages = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    if (opts.history) messages.push(...opts.history);
    messages.push({ role: 'user', content: prompt });
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages, stream: true }),
    });
    if (!res.ok) { const e = await res.text().catch(() => ''); throw new Error(`AI API error: ${res.status} ${e}`); }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n');
      buffer = parts.pop() || '';
      for (const line of parts) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (!json || json === '[DONE]') continue;
        try {
          const data = JSON.parse(json);
          const text = data.choices?.[0]?.delta?.content || '';
          if (text) yield text;
        } catch {}
      }
    }
  }

  async generateWithImage(prompt, imageUrl, opts = {}) {
    if (!this.enabled) throw new Error('AI is not configured. Set FREETHEAI_API_KEY.');
    const content = [{ type: 'text', text: prompt }];
    if (imageUrl) content.push({ type: 'image_url', image_url: { url: imageUrl } });
    const messages = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content });
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages }),
    });
    if (!res.ok) { const e = await res.text().catch(() => ''); throw new Error(`AI vision error: ${res.status} - ${e}`); }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async countTokens(text) {
    return text.length;
  }
}

module.exports = FreeTheAiService;