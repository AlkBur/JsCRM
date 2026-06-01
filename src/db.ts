import { Database } from "bun:sqlite";

function getDb(dbPath: string): Database {
  const db = new Database(dbPath);
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  return db;
}

export class DocRepository {
  private db: Database;

  constructor(dbPath: string = "jscrm.db") {
    this.db = getDb(dbPath);
  }

  save(id: string, data: Record<string, any>): void {
    this.db.run(
      `INSERT OR REPLACE INTO documents (id, data) VALUES (?, ?)`,
      [id, JSON.stringify(data)]
    );
  }

  load(id: string): Record<string, any> | null {
    const row = this.db.query(`SELECT data FROM documents WHERE id = ?`).get(id) as { data: string } | null;
    if (!row) return null;
    return JSON.parse(row.data);
  }

  delete(id: string): void {
    this.db.run(`DELETE FROM documents WHERE id = ?`, [id]);
  }

  close(): void {
    this.db.close();
  }
}
