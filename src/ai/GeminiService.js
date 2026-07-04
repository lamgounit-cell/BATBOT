const config = require('../config');

class GeminiService {
  constructor(client) {
    this.client = client;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = config.aiModel;
    this.apiKey = config.geminiKey;
    this.enabled = !!this.apiKey && config.aiEnabled;
    client.ai = this;
    if (!this.apiKey) console.log('[AI] No Gemini API key set — AI features disabled');
    else console.log(`[AI] Gemini initialized (model: ${this.model})`);
  }

  async generate(prompt, opts = {}) {
    if (!this.enabled) throw new Error('AI is not configured. Set GEMINI_API_KEY.');
    const contents = opts.history ? [...opts.history, { role: 'user', parts: [{ text: prompt }] }] : [{ role: 'user', parts: [{ text: prompt }] }];
    const body = { contents, safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }] };
    if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
    const res = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`Gemini API error: ${res.status} ${e}`); }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text;
  }

  async* generateStream(prompt, opts = {}) {
    if (!this.enabled) throw new Error('AI is not configured. Set GEMINI_API_KEY.');
    const contents = opts.history ? [...opts.history, { role: 'user', parts: [{ text: prompt }] }] : [{ role: 'user', parts: [{ text: prompt }] }];
    const body = { contents, safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }] };
    if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
    const res = await fetch(`${this.baseUrl}/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`Gemini API error: ${res.status} ${e}`); }
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
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) yield text;
        } catch {}
      }
    }
  }

  async generateWithImage(prompt, imageUrl, opts = {}) {
    if (!this.enabled) throw new Error('AI is not configured. Set GEMINI_API_KEY.');
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error('Could not fetch image');
    const blob = await imgRes.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const b64 = buffer.toString('base64');
    const mime = blob.type || 'image/png';
    const contents = [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: mime, data: b64 } }] }];
    const body = { contents, safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }] };
    if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
    const res = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`Gemini API error: ${res.status} ${e}`); }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async countTokens(text) {
    if (!this.enabled) return 0;
    const res = await fetch(`${this.baseUrl}/models/${this.model}:countTokens?key=${this.apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.totalTokens || 0;
  }
}

module.exports = GeminiService;