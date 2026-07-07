function cleanLaTeX(text) {
  let s = text;
  // LaTeX math delimiters
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => m.trim());
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => m.trim());
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => m.trim());
  // Font/style commands (consume braces)
  s = s.replace(/\\mathbf\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathrm\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathit\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathcal\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathbb\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathsf\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathtt\{([^}]*)\}/g, '$1');
  s = s.replace(/\\textbf\{([^}]*)\}/g, '$1');
  s = s.replace(/\\textit\{([^}]*)\}/g, '$1');
  s = s.replace(/\\text\{([^}]*)\}/g, '$1');
  // Accents
  s = s.replace(/\\widehat\{([^}]*)\}/g, '$1_hat');
  s = s.replace(/\\hat\{([^}]*)\}/g, '$1_hat');
  s = s.replace(/\\tilde\{([^}]*)\}/g, '$1_tilde');
  s = s.replace(/\\bar\{([^}]*)\}/g, '$1_bar');
  s = s.replace(/\\dot\{([^}]*)\}/g, '$1_dot');
  s = s.replace(/\\ddot\{([^}]*)\}/g, '$1_ddot');
  // Fractions
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  // sqrt
  s = s.replace(/\\sqrt(\[([^\]]*)\])?\{([^}]*)\}/g, (_, __, root, content) => root ? `${root}_root(${content})` : `sqrt(${content})`);
  // Operators with braces
  s = s.replace(/\\operatorname\{([^}]*)\}/g, '$1');
  // Named operators
  s = s.replace(/\\lim/g, 'lim');
  s = s.replace(/\\log/g, 'log');
  s = s.replace(/\\ln/g, 'ln');
  s = s.replace(/\\sin/g, 'sin');
  s = s.replace(/\\cos/g, 'cos');
  s = s.replace(/\\tan/g, 'tan');
  s = s.replace(/\\max/g, 'max');
  s = s.replace(/\\min/g, 'min');
  s = s.replace(/\\sup/g, 'sup');
  s = s.replace(/\\inf/g, 'inf');
  s = s.replace(/\\det/g, 'det');
  s = s.replace(/\\arg/g, 'arg');
  // Greek / letters
  const greeks = {
    alpha: 'alpha', beta: 'beta', gamma: 'gamma', delta: 'delta',
    epsilon: 'epsilon', varepsilon: 'epsilon', zeta: 'zeta',
    eta: 'eta', theta: 'theta', vartheta: 'theta',
    iota: 'iota', kappa: 'kappa', lambda: 'lambda',
    mu: 'mu', nu: 'nu', xi: 'xi', omicron: 'omicron',
    pi: 'pi', varpi: 'pi', rho: 'rho', varrho: 'rho',
    sigma: 'sigma', varsigma: 'sigma', tau: 'tau',
    upsilon: 'upsilon', phi: 'phi', varphi: 'phi',
    chi: 'chi', psi: 'psi', omega: 'omega',
    Gamma: 'Gamma', Delta: 'Delta', Theta: 'Theta',
    Lambda: 'Lambda', Xi: 'Xi', Pi: 'Pi',
    Sigma: 'Sigma', Phi: 'Phi', Psi: 'Psi', Omega: 'Omega',
  };
  for (const [cmd, rep] of Object.entries(greeks)) {
    s = s.replace(new RegExp(`\\\\${cmd}(?![a-zA-Z])`, 'g'), rep);
  }
  // Brackets and delimiters
  s = s.replace(/\\langle/g, '<');
  s = s.replace(/\\rangle/g, '>');
  s = s.replace(/\\lbrace/g, '{');
  s = s.replace(/\\rbrace/g, '}');
  s = s.replace(/\\lvert/g, '|');
  s = s.replace(/\\rvert/g, '|');
  s = s.replace(/\\lVert/g, '||');
  s = s.replace(/\\rVert/g, '||');
  s = s.replace(/\\|/g, '||');
  s = s.replace(/\\left\(/g, '(');
  s = s.replace(/\\right\)/g, ')');
  s = s.replace(/\\left\[/g, '[');
  s = s.replace(/\\right\]/g, ']');
  s = s.replace(/\\left\{/g, '{');
  s = s.replace(/\\right\}/g, '}');
  s = s.replace(/\\left\./g, '');
  s = s.replace(/\\right\./g, '');
  // Relations and operators
  const syms = {
    sim: '~', approx: '~=', simeq: '~=', equiv: '==',
    neq: '!=', ne: '!=', le: '<=', ge: '>=', ll: '<<', gg: '>>',
    subset: 'subset', supset: 'supset', subseteq: '<=', supseteq: '>=',
    in: 'in', notin: 'not in', ni: 'contains',
    forall: 'for all', exists: 'there exists', nexists: 'no exists',
    to: '->', gets: '<-', mapsto: '|->', implies: '=>',
    implies: '=>',iff: '<=>',
    cup: 'U', cap: '(intersect)', setminus: '\\',
    wedge: '^', vee: 'v', oplus: '(+)', otimes: '(x)',
    partial: 'd', nabla: 'nabla', infty: 'infinity',
    int: 'integral', iint: 'double integral', iiint: 'triple integral',
    sum: 'sum', prod: 'product', coprod: 'coproduct',
    emptyset: '{}', varnothing: '{}',
    circ: 'o', bullet: '*', cdot: '*', times: 'x',
    prime: "'", dagger: '+', ddagger: '++',
    triangle: 'triangle', triangleright: '>', triangleleft: '<',
  };
  for (const [cmd, rep] of Object.entries(syms)) {
    s = s.replace(new RegExp(`\\\\${cmd}(?![a-zA-Z])`, 'g'), rep);
  }
  // superscript / subscript
  s = s.replace(/\^\{(.+?)\}/g, '^$1');
  s = s.replace(/\^([a-zA-Z0-9])/g, '^$1');
  s = s.replace(/_\{(.+?)\}/g, '_$1');
  s = s.replace(/_([a-zA-Z0-9])/g, '_$1');
  // Clean up stray backslashes
  s = s.replace(/\\(.)/g, '$1');
  // Collapse multiple spaces
  s = s.replace(/  +/g, ' ');
  return s.trim();
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