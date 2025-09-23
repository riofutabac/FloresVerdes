import * as SQLite from 'expo-sqlite';

export class SQLiteManager {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    this.db = await SQLite.openDatabaseAsync('flores_verdes.db');
    await this.createTables();
  }

  private async createTables() {
    if (!this.db) return;

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS evaluaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        operario TEXT NOT NULL,
        variedad TEXT NOT NULL,
        lote TEXT NOT NULL,
        calidad INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        observaciones TEXT,
        tiene_defectos BOOLEAN DEFAULT FALSE,
        fecha_creacion TEXT NOT NULL,
        synced BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
        data TEXT, -- JSON data
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        retry_count INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_evaluaciones_synced ON evaluaciones(synced);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
    `);
  }

  async insertEvaluacion(evaluacion: any) {
    if (!this.db) throw new Error('Database not initialized');

    const uuid = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const result = await this.db.runAsync(
      `INSERT INTO evaluaciones (uuid, operario, variedad, lote, calidad, cantidad, observaciones, tiene_defectos, fecha_creacion, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        evaluacion.operario,
        evaluacion.variedad,
        evaluacion.lote,
        evaluacion.calidad,
        evaluacion.cantidad,
        evaluacion.observaciones || '',
        evaluacion.tieneDefectos ? 1 : 0,
        new Date().toISOString(),
        0
      ]
    );

    // Add to sync queue
    await this.addToSyncQueue('evaluaciones', uuid, 'INSERT', evaluacion);

    return result;
  }

  async getEvaluaciones() {
    if (!this.db) throw new Error('Database not initialized');

    return await this.db.getAllAsync('SELECT * FROM evaluaciones ORDER BY created_at DESC');
  }

  async addToSyncQueue(tableName: string, recordId: string, operation: string, data: any) {
    if (!this.db) return;

    await this.db.runAsync(
      'INSERT INTO sync_queue (table_name, record_id, operation, data) VALUES (?, ?, ?, ?)',
      [tableName, recordId, operation, JSON.stringify(data)]
    );
  }

  async getPendingSyncItems() {
    if (!this.db) return [];

    return await this.db.getAllAsync(
      'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50'
    );
  }

  async removeSyncItem(id: number) {
    if (!this.db) return;

    await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  async markAsSynced(tableName: string, recordId: string) {
    if (!this.db) return;

    await this.db.runAsync(
      `UPDATE ${tableName} SET synced = 1 WHERE uuid = ?`,
      [recordId]
    );
  }
}

export const sqliteManager = new SQLiteManager();