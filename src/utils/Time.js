const ms = require('ms');

function parseTime(input) {
  if (!input) return null;
  const parsed = ms(input);
  return parsed ? parsed : null;
}

function formatTime(msValue) {
  if (!msValue || msValue < 1000) return 'just now';
  return ms(msValue, { long: true });
}

function formatDate(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function relativeTimestamp(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
}

module.exports = { parseTime, formatTime, formatDate, relativeTimestamp };
