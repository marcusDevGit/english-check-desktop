import { app } from 'electron'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import * as schema from './schema'

export type AppDatabase = BetterSQLite3Database<typeof schema>

let sqliteInstance: Database.Database | null = null
let dbInstance: AppDatabase | null = null

function resolveMigrationsFolder(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'migrations')
  }
  return join(app.getAppPath(), 'src/main/database/migrations')
}

/**
 * Opens SQLite in Electron userData, enables WAL mode, and runs bundled Drizzle migrations.
 */
export function initDatabase(): AppDatabase {
  if (dbInstance) {
    return dbInstance
  }

  const userDataDir = app.getPath('userData')
  mkdirSync(userDataDir, { recursive: true })

  const dbPath = join(userDataDir, 'english-checks.db')
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: resolveMigrationsFolder() })

  sqliteInstance = sqlite
  dbInstance = db
  return db
}

export function getDb(): AppDatabase {
  if (!dbInstance) {
    throw new Error('Database has not been initialized yet.')
  }
  return dbInstance
}

export function closeDatabase(): void {
  if (sqliteInstance) {
    sqliteInstance.close()
    sqliteInstance = null
    dbInstance = null
  }
}
