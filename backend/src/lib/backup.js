import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups')
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '7', 10)

/**
 * Create a MongoDB backup using mongodump.
 * Requires mongodump to be installed and accessible in PATH.
 * @returns {{ success: boolean, path?: string, error?: string }}
 */
export function createBackup() {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    return { success: false, error: 'MONGODB_URI not configured' }
  }

  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupPath = path.join(BACKUP_DIR, `venio-backup-${timestamp}`)

    execSync(`mongodump --uri="${mongoUri}" --out="${backupPath}" --quiet`, {
      timeout: 120000,
      stdio: 'pipe',
    })

    // Cleanup old backups (keep MAX_BACKUPS most recent)
    cleanupOldBackups()

    console.log(`[Backup] MongoDB backup created: ${backupPath}`)
    return { success: true, path: backupPath }
  } catch (err) {
    console.error('[Backup] Failed to create MongoDB backup:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Remove oldest backups exceeding MAX_BACKUPS limit
 */
function cleanupOldBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return

    const entries = fs.readdirSync(BACKUP_DIR)
      .filter((name) => name.startsWith('venio-backup-'))
      .map((name) => ({
        name,
        fullPath: path.join(BACKUP_DIR, name),
        stat: fs.statSync(path.join(BACKUP_DIR, name)),
      }))
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)

    // Remove entries beyond the limit
    for (let i = MAX_BACKUPS; i < entries.length; i++) {
      fs.rmSync(entries[i].fullPath, { recursive: true, force: true })
      console.log(`[Backup] Removed old backup: ${entries[i].name}`)
    }
  } catch (err) {
    console.error('[Backup] Error cleaning up old backups:', err.message)
  }
}

/**
 * List available backups
 * @returns {Array<{ name: string, date: Date, sizeMB: number }>}
 */
export function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return []

    return fs.readdirSync(BACKUP_DIR)
      .filter((name) => name.startsWith('venio-backup-'))
      .map((name) => {
        const fullPath = path.join(BACKUP_DIR, name)
        const stat = fs.statSync(fullPath)
        // Calculate total size recursively
        let totalSize = 0
        const calcSize = (dir) => {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const entryPath = path.join(dir, entry.name)
            if (entry.isDirectory()) calcSize(entryPath)
            else totalSize += fs.statSync(entryPath).size
          }
        }
        if (stat.isDirectory()) calcSize(fullPath)
        else totalSize = stat.size

        return {
          name,
          date: stat.mtime,
          sizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        }
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  } catch {
    return []
  }
}
