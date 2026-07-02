class AntiAlt {
  constructor(client) {
    this.client = client;
    this.MIN_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  }

  check(member) {
    const results = [];
    const now = Date.now();
    const accountAge = now - member.user.createdTimestamp;

    if (accountAge < this.MIN_ACCOUNT_AGE_MS) {
      const days = Math.floor(accountAge / 86400000);
      results.push({
        type: 'FRESH_ACCOUNT',
        severity: 'high',
        age: days,
        threshold: 7,
      });
    }

    if (!member.user.avatar) {
      results.push({ type: 'NO_AVATAR', severity: 'low' });
    }

    const name = member.user.username.toLowerCase();
    const suspicious = [
      /\d{4,}$/, /\b(?:bot|spam|scam|hack)\b/,
      /^[a-zA-Z0-9]{15,}$/, /[^\x20-\x7E]/,
    ];
    for (const pattern of suspicious) {
      if (pattern.test(name)) {
        results.push({ type: 'SUSPICIOUS_USERNAME', severity: 'medium', pattern: pattern.source });
        break;
      }
    }

    return results;
  }
}

module.exports = AntiAlt;
