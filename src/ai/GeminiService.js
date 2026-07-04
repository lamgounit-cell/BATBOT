const config = require('../config');

class GeminiService {
  constructor(client) {
    this.client = client;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1';
    this.model = config.aiModel;
    this.apiKey = config.geminiKey;
    this.enabled = !!this.apiKey && config.aiEnabled;
    client.ai = this;
    if (!this.apiKey) console.log('[AI] No Gemini API key set — AI features disabled');
    else console.log(`[AI] Gemini initialized (model: ${this.model})`);
  }

  buildContents(prompt, opts = {}) {
    const contents = [];
    if (opts.system) contents.push({ role: 'user', parts: [{ text: `[System] ${opts.system}` }] });
    if (opts.history) contents.push(...opts.history);
    contents.push({ role: 'user', parts: [{ text: prompt }] });
    return contents;
  }

  async generate(prompt, opts = {}) {
    if (!this.enabled) throw new Error('AI is not configured. Set GEMINI_API_KEY.');
    const body = { contents: this.buildContents(prompt, opts), safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }] };
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
    const body = { contents: this.buildContents(prompt, opts), safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }] };
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
    const parts = [{ text: prompt }, { inlineData: { mimeType: mime, data: b64 } }];
    if (opts.system) parts.unshift({ text: `[System] ${opts.system}` });
    const body = { contents: [{ role: 'user', parts }], safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }] };
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${this.apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let errText;
      try { errText = await res.text(); } catch { errText = '(unable to read)'; }
      throw new Error(`Gemini vision error: ${res.status} (model: gemini-1.5-pro, api: v1) - ${errText}`);
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) {
      const finish = data.candidates?.[0]?.finishReason;
      throw new Error(`Gemini returned no text (finishReason: ${finish || 'unknown'})`);
    }
    return text;
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