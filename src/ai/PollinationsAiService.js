function cleanLaTeX(text) {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => m.trim())
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => m.trim())
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => m.trim())
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\widehat\{([^}]+)\}/g, '$1_hat')
    .replace(/\\hat\{([^}]+)\}/g, '$1_hat')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\partial/g, 'd')
    .replace(/\\nabla/g, 'nabla')
    .replace(/\\int/g, 'integral')
    .replace(/\\sum/g, 'sum')
    .replace(/\\prod/g, 'product')
    .replace(/\\sim/g, '~')
    .replace(/\\cdot/g, '*')
    .replace(/\\otimes/g, '(x)')
    .replace(/\\oplus/g, '(+)')
    .replace(/\\to/g, '->')
    .replace(/\\mapsto/g, '|->')
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\gamma/g, 'gamma')
    .replace(/\\delta/g, 'delta')
    .replace(/\\epsilon/g, 'epsilon')
    .replace(/\\varepsilon/g, 'epsilon')
    .replace(/\\theta/g, 'theta')
    .replace(/\\lambda/g, 'lambda')
    .replace(/\\mu/g, 'mu')
    .replace(/\\sigma/g, 'sigma')
    .replace(/\\omega/g, 'omega')
    .replace(/\\Omega/g, 'Omega')
    .replace(/\\Delta/g, 'Delta')
    .replace(/\\Gamma/g, 'Gamma')
    .replace(/\\Sigma/g, 'Sigma')
    .replace(/\\Lambda/g, 'Lambda')
    .replace(/\\Phi/g, 'Phi')
    .replace(/\\Psi/g, 'Psi')
    .replace(/\\subset/g, 'subset')
    .replace(/\\supset/g, 'supset')
    .replace(/\\subseteq/g, 'subseteq')
    .replace(/\\supseteq/g, 'supseteq')
    .replace(/\\cup/g, 'U')
    .replace(/\\cap/g, '(cap)')
    .replace(/\\in/g, 'in')
    .replace(/\\notin/g, 'not in')
    .replace(/\\forall/g, 'for all')
    .replace(/\\exists/g, 'there exists')
    .replace(/\\infty/g, 'infinity')
    .replace(/\\prime/g, "'")
    .replace(/\\circ/g, 'o')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\{/g, '{')
    .replace(/\\right\}/g, '}')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\(.)/g, '$1');
}

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
    if (opts.history) {
      for (const m of opts.history) {
        messages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content });
      }
    }
    messages.push({ role: 'user', content: prompt });
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model: 'openai' }),
    });
    if (!res.ok) { const e = await res.text().catch(() => ''); throw new Error(`AI error: ${res.status} ${e}`); }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';
    return cleanLaTeX(raw);
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
    const raw = data.choices?.[0]?.message?.content || '';
    return cleanLaTeX(raw);
  }

  async countTokens(text) {
    return text.length;
  }
}

module.exports = PollinationsAiService;