const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/articles.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      title TEXT,
      snippet TEXT,
      source_domain TEXT,
      fetched_at TEXT,
      full_text TEXT,
      headline TEXT,
      summary TEXT,
      industry TEXT,
      novelty_score REAL,
      impact_score REAL,
      topic_tags TEXT,
      cluster_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clusters (
      id TEXT PRIMARY KEY,
      title TEXT,
      score REAL,
      article_ids TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT,
      finished_at TEXT,
      articles_found INTEGER,
      articles_processed INTEGER,
      errors INTEGER,
      log_file TEXT
    );
  `);
}

function upsertRawArticle(article) {
  const stmt = getDb().prepare(`
    INSERT OR IGNORE INTO articles (url, title, snippet, source_domain, fetched_at)
    VALUES (@url, @title, @snippet, @source_domain, @fetched_at)
  `);
  return stmt.run(article);
}

function getUnsummarized() {
  return getDb().prepare(`
    SELECT * FROM articles WHERE headline IS NULL AND full_text IS NOT NULL
  `).all();
}

function getUnfetched() {
  return getDb().prepare(`
    SELECT * FROM articles WHERE full_text IS NULL
  `).all();
}

function updateFullText(id, full_text) {
  getDb().prepare(`UPDATE articles SET full_text = ? WHERE id = ?`).run(full_text, id);
}

function updateSummary(id, data) {
  getDb().prepare(`
    UPDATE articles SET
      headline = @headline,
      summary = @summary,
      industry = @industry,
      novelty_score = @novelty_score,
      impact_score = @impact_score,
      topic_tags = @topic_tags
    WHERE id = @id
  `).run({ ...data, id });
}

function updateClusterId(id, cluster_id) {
  getDb().prepare(`UPDATE articles SET cluster_id = ? WHERE id = ?`).run(cluster_id, id);
}

function getAllSummarized() {
  return getDb().prepare(`
    SELECT * FROM articles WHERE headline IS NOT NULL
    ORDER BY (novelty_score * 0.6 + impact_score * 0.4) DESC
  `).all();
}

function saveClusters(clusters) {
  const insert = getDb().prepare(`
    INSERT OR REPLACE INTO clusters (id, title, score, article_ids, created_at)
    VALUES (@id, @title, @score, @article_ids, datetime('now'))
  `);
  const insertMany = getDb().transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  insertMany(clusters);
}

function getClusters() {
  return getDb().prepare(`SELECT * FROM clusters ORDER BY score DESC`).all();
}

function getArticlesByIds(ids) {
  const placeholders = ids.map(() => '?').join(',');
  return getDb().prepare(`SELECT * FROM articles WHERE id IN (${placeholders})`).all(...ids);
}

function logPipelineRun(data) {
  getDb().prepare(`
    INSERT INTO pipeline_runs (started_at, finished_at, articles_found, articles_processed, errors, log_file)
    VALUES (@started_at, @finished_at, @articles_found, @articles_processed, @errors, @log_file)
  `).run(data);
}

function getLastRun() {
  return getDb().prepare(`SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 1`).get();
}

function getTotalArticles() {
  return getDb().prepare(`SELECT COUNT(*) as count FROM articles WHERE headline IS NOT NULL`).get().count;
}

module.exports = {
  getDb,
  upsertRawArticle,
  getUnsummarized,
  getUnfetched,
  updateFullText,
  updateSummary,
  updateClusterId,
  getAllSummarized,
  saveClusters,
  getClusters,
  getArticlesByIds,
  logPipelineRun,
  getLastRun,
  getTotalArticles,
};
