const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../logs');

class PipelineLogger {
  constructor() {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    this.filename = path.join(LOGS_DIR, `run-${ts}.json`);
    this.entries = [];
    this.startTime = new Date().toISOString();
    this.stats = { articlesFound: 0, articlesProcessed: 0, errors: 0 };
  }

  log(level, message, meta = {}) {
    const entry = { ts: new Date().toISOString(), level, message, ...meta };
    this.entries.push(entry);
    const prefix = level === 'error' ? '[ERR]' : level === 'warn' ? '[WRN]' : '[INF]';
    console.log(`${prefix} ${message}`, Object.keys(meta).length ? meta : '');
  }

  info(message, meta = {}) { this.log('info', message, meta); }
  warn(message, meta = {}) { this.log('warn', message, meta); }
  error(message, meta = {}) { this.log('error', message, meta); this.stats.errors++; }

  flush() {
    const report = {
      startTime: this.startTime,
      endTime: new Date().toISOString(),
      stats: this.stats,
      entries: this.entries,
    };
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    fs.writeFileSync(this.filename, JSON.stringify(report, null, 2));
    return this.filename;
  }
}

// Simple console logger for server-level logs
const serverLog = {
  info: (msg, ...args) => console.log(`[INF] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WRN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERR] ${msg}`, ...args),
};

module.exports = { PipelineLogger, serverLog };
