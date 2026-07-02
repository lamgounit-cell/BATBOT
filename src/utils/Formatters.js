function formatNumber(num) {
  return num?.toLocaleString() || '0';
}

function truncate(str, len = 100) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

function escapeMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/[_*~`|>\\]/g, '\\$&');
}

function pluralize(count, singular, plural) {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural || singular + 's'}`;
}

module.exports = { formatNumber, truncate, escapeMarkdown, pluralize };
