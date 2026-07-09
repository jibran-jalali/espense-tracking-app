import pkg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env') })

const { Pool } = pkg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const sql = readFileSync(join(__dirname, '..', 'neon-schema.sql'), 'utf8')

async function migrate() {
  try {
    console.log('Running migration...')
    await pool.query(sql)
    console.log('Migration completed successfully!')
  } catch (err) {
    console.error('Migration failed:', err.message)
  } finally {
    await pool.end()
  }
}

migrate()
