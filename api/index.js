const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { neonConfig, Pool } = require('@neondatabase/serverless')
const Groq = require('groq-sdk')
const { google } = require('googleapis')

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'flowly-jwt-secret-change-in-production'
const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'
const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173')
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${FRONTEND_URL}/api/admin/google/callback`
const CALENDAR_OWNER_EMAIL = 'k245620@nu.edu.pk'
const TASK_ASSIGNER_EMAIL = 'wasi@gmail.com'
const ADMIN_EMAILS = new Set(['wasi@gmail.com', 'k245620@nu.edu.pk'])



const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

app.use(cors())
app.use(express.json({ limit: '15mb' }))

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null

function createGoogleClient() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'No token provided' })
  try {
    const decoded = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

async function adminMiddleware(req, res, next) {
  try {
    const result = await pool.query('SELECT email, is_admin, features FROM users WHERE id = $1', [req.userId])
    const user = result.rows[0]
    const email = user?.email?.toLowerCase()
    if (!ADMIN_EMAILS.has(email) && !user?.is_admin && !user?.features?.assign_work_to_jibran) {
      return res.status(403).json({ error: 'Admin feature only' })
    }
    req.userEmail = email
    next()
  } catch {
    res.status(500).json({ error: 'Failed to verify admin access' })
  }
}

function getAdminRole(email) {
  const normalized = email?.toLowerCase()
  if (normalized === CALENDAR_OWNER_EMAIL) return 'owner'
  if (normalized === TASK_ASSIGNER_EMAIL) return 'assigner'
  return 'none'
}

async function getCalendarOwner() {
  const result = await pool.query('SELECT id, email FROM users WHERE lower(email) = lower($1)', [CALENDAR_OWNER_EMAIL])
  return result.rows[0] || null
}

async function requireCalendarOwner() {
  const owner = await getCalendarOwner()
  if (!owner) throw new Error('Calendar owner account has not signed up yet')
  return owner
}

async function getGoogleConnection(userId) {
  const result = await pool.query('SELECT * FROM google_calendar_connections WHERE user_id = $1', [userId])
  return result.rows[0] || null
}

async function getAuthorizedGoogleClient(userId) {
  const oauth2Client = createGoogleClient()
  if (!oauth2Client) throw new Error('Google Calendar credentials are not configured')
  const connection = await getGoogleConnection(userId)
  if (!connection?.refresh_token && !connection?.access_token) throw new Error('Google Calendar is not connected')
  oauth2Client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    scope: connection.scope,
    token_type: connection.token_type,
    expiry_date: connection.expiry_date ? Number(connection.expiry_date) : undefined,
  })
  oauth2Client.on('tokens', async (tokens) => {
    await pool.query(
      `UPDATE google_calendar_connections SET access_token = COALESCE($2, access_token), refresh_token = COALESCE($3, refresh_token), expiry_date = COALESCE($4, expiry_date), updated_at = NOW() WHERE user_id = $1`,
      [userId, tokens.access_token || null, tokens.refresh_token || null, tokens.expiry_date || null]
    )
  })
  return { oauth2Client, connection }
}

function requireGroq(req, res, next) {
  if (!groq) return res.status(500).json({ error: 'Receipt scanning is not configured' })
  next()
}

// ─── Auth Routes ───────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' })
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const hash = await bcrypt.hash(password, 10)
    const normalizedEmail = email.toLowerCase()
    const isAdminUser = ADMIN_EMAILS.has(normalizedEmail)
    const adminFeatures = normalizedEmail === CALENDAR_OWNER_EMAIL
      ? { google_calendar: true, manage_availability: true }
      : normalizedEmail === TASK_ASSIGNER_EMAIL
        ? { assign_work_to_jibran: true }
        : {}
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, is_admin, features) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, currency, is_admin, features, created_at`,
      [email, hash, name, isAdminUser, JSON.stringify(adminFeatures)]
    )
    const user = result.rows[0]

    const defaults = [
      { name: 'Food & Dining', icon: '🍽️', color: '#10b981' },
      { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
      { name: 'Shopping', icon: '🛍️', color: '#8b5cf6' },
      { name: 'Bills & Utilities', icon: '📄', color: '#f59e0b' },
      { name: 'Entertainment', icon: '🎬', color: '#ef4444' },
      { name: 'Healthcare', icon: '🏥', color: '#ec4899' },
      { name: 'Education', icon: '📚', color: '#14b8a6' },
      { name: 'Groceries', icon: '🛒', color: '#22c55e' },
      { name: 'Rent', icon: '🏠', color: '#f97316' },
      { name: 'Other', icon: '📌', color: '#6b7280' },
    ]
    for (const cat of defaults) {
      await pool.query(
        'INSERT INTO categories (user_id, name, icon, color) VALUES ($1, $2, $3, $4)',
        [user.id, cat.name, cat.icon, cat.color]
      )
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, user })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: 'Signup failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const result = await pool.query(
      'SELECT id, email, name, currency, is_admin, features, password_hash, created_at FROM users WHERE email = $1',
      [email]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, currency: user.currency, is_admin: user.is_admin, features: user.features || {}, created_at: user.created_at },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, currency, is_admin, features, created_at FROM users WHERE id = $1', [req.userId])
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// ─── People Routes ─────────────────────────────────────────────────────────

app.get('/api/people', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM people WHERE user_id = $1 ORDER BY name', [req.userId])
  res.json(result.rows)
})

app.post('/api/people', authMiddleware, async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Name required' })
  const result = await pool.query(
    'INSERT INTO people (user_id, name) VALUES ($1, $2) RETURNING *',
    [req.userId, name]
  )
  res.json(result.rows[0])
})

app.delete('/api/people/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM people WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
  res.json({ success: true })
})

// ─── Categories Routes ─────────────────────────────────────────────────────

app.get('/api/categories', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY name', [req.userId])
  res.json(result.rows)
})

// ─── Transactions Routes ───────────────────────────────────────────────────

app.get('/api/transactions', authMiddleware, async (req, res) => {
  const result = await pool.query(
    `SELECT t.*,
            row_to_json(p) AS person,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', ti.id,
                  'description', ti.description,
                  'amount', ti.amount,
                  'category_id', ti.category_id,
                  'category', CASE WHEN c.id IS NOT NULL THEN
                    json_build_object('id', c.id, 'name', c.name, 'icon', c.icon, 'color', c.color)
                  ELSE NULL END
                )
              ) FILTER (WHERE ti.id IS NOT NULL),
              '[]'
            ) AS items
     FROM transactions t
     LEFT JOIN people p ON p.id = t.person_id
     LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
     LEFT JOIN categories c ON c.id = ti.category_id
     WHERE t.user_id = $1
     GROUP BY t.id, p.id
     ORDER BY t.date DESC, t.created_at DESC`,
    [req.userId]
  )
  res.json(result.rows)
})

app.post('/api/transactions', authMiddleware, async (req, res) => {
  const { person_id, merchant, date, total_amount, currency, notes, items } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const txResult = await client.query(
      `INSERT INTO transactions (user_id, person_id, merchant, date, total_amount, currency, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, person_id || null, merchant || '', date || new Date().toISOString().split('T')[0],
       total_amount || 0, currency || 'PKR', notes || '']
    )
    const transaction = txResult.rows[0]

    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          'INSERT INTO transaction_items (transaction_id, category_id, description, amount) VALUES ($1, $2, $3, $4)',
          [transaction.id, item.category_id, item.description || '', item.amount || 0]
        )
      }
    }
    await client.query('COMMIT')
    res.json(transaction)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Transaction insert error:', err)
    res.status(500).json({ error: 'Failed to create transaction' })
  } finally {
    client.release()
  }
})

app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
  res.json({ success: true })
})

// ─── Admin: Assign Work / Google Calendar ──────────────────────────────────

app.get('/api/admin/google/status', authMiddleware, adminMiddleware, async (req, res) => {
  const owner = await getCalendarOwner()
  const connection = owner ? await getGoogleConnection(owner.id) : null
  const role = getAdminRole(req.userEmail)
  res.json({
    connected: Boolean(connection?.refresh_token || connection?.access_token),
    connected_email: connection?.connected_email || null,
    calendar_id: connection?.calendar_id || 'primary',
    owner_email: CALENDAR_OWNER_EMAIL,
    role,
    can_sync_calendar: role === 'owner',
    can_manage_availability: role === 'owner',
    can_assign_tasks: role === 'assigner',
    google_configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  })
})

app.get('/api/admin/google/auth-url', authMiddleware, adminMiddleware, async (req, res) => {
  if (getAdminRole(req.userEmail) !== 'owner') return res.status(403).json({ error: 'Only k245620@nu.edu.pk can sync Google Calendar' })
  const oauth2Client = createGoogleClient()
  if (!oauth2Client) return res.status(500).json({ error: 'Google Calendar credentials are not configured' })
  const state = jwt.sign({ userId: req.userId, purpose: 'google-calendar' }, JWT_SECRET, { expiresIn: '10m' })
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state,
  })
  res.json({ url })
})

app.get('/api/admin/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    if (!code || !state) return res.redirect(`${FRONTEND_URL}/assign-work-to-jibran?calendar=missing_code`)
    const decoded = jwt.verify(String(state), JWT_SECRET)
    if (decoded.purpose !== 'google-calendar') throw new Error('Invalid OAuth state')
    const oauth2Client = createGoogleClient()
    if (!oauth2Client) throw new Error('Google Calendar credentials are not configured')
    const { tokens } = await oauth2Client.getToken(String(code))
    oauth2Client.setCredentials(tokens)
    let connectedEmail = null
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
      const profile = await oauth2.userinfo.get()
      connectedEmail = profile.data.email || null
    } catch {}
    await pool.query(
      `INSERT INTO google_calendar_connections (user_id, access_token, refresh_token, scope, token_type, expiry_date, connected_email, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, google_calendar_connections.refresh_token),
         scope = EXCLUDED.scope,
         token_type = EXCLUDED.token_type,
         expiry_date = EXCLUDED.expiry_date,
         connected_email = EXCLUDED.connected_email,
         updated_at = NOW()`,
      [decoded.userId, tokens.access_token || null, tokens.refresh_token || null, tokens.scope || null, tokens.token_type || null, tokens.expiry_date || null, connectedEmail]
    )
    res.redirect(`${FRONTEND_URL}/assign-work-to-jibran?calendar=connected`)
  } catch (error) {
    console.error('Google callback error:', error)
    res.redirect(`${FRONTEND_URL}/assign-work-to-jibran?calendar=error`)
  }
})

app.get('/api/admin/google/available-times', authMiddleware, adminMiddleware, async (req, res) => {
  const owner = await getCalendarOwner()
  if (!owner) return res.json({ connected: false, slots: [], owner_missing: true })

  const date = req.query.date ? new Date(String(req.query.date)) : new Date()
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999)
  const availability = await pool.query(
    `SELECT id, start_time, end_time FROM availability_slots WHERE owner_user_id = $1 AND start_time >= $2 AND start_time <= $3 ORDER BY start_time`,
    [owner.id, dayStart.toISOString(), dayEnd.toISOString()]
  )
  const slots = availability.rows.map((slot) => ({ id: slot.id, start: new Date(slot.start_time).toISOString(), end: new Date(slot.end_time).toISOString(), available: true }))
  try {
    if (slots.length === 0) return res.json({ connected: true, slots })
    const { oauth2Client, connection } = await getAuthorizedGoogleClient(owner.id)
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const calendarId = connection.calendar_id || 'primary'
    const busy = await calendar.freebusy.query({ requestBody: { timeMin: dayStart.toISOString(), timeMax: dayEnd.toISOString(), items: [{ id: calendarId }] } })
    const busyTimes = busy.data.calendars?.[calendarId]?.busy || []
    const checkedSlots = slots.map((slot) => ({
      ...slot,
      available: !busyTimes.some((busySlot) => new Date(slot.start) < new Date(busySlot.end || '') && new Date(slot.end) > new Date(busySlot.start || '')),
    }))
    res.json({ connected: true, slots: checkedSlots })
  } catch {
    res.json({ connected: false, slots })
  }
})

app.post('/api/admin/availability', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (getAdminRole(req.userEmail) !== 'owner') return res.status(403).json({ error: 'Only k245620@nu.edu.pk can add availability' })
    const { start_time, end_time } = req.body
    if (!start_time || !end_time) return res.status(400).json({ error: 'Start and end time are required' })
    const start = new Date(start_time)
    const end = new Date(end_time)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return res.status(400).json({ error: 'Invalid availability time range' })
    const owner = await requireCalendarOwner()
    const result = await pool.query(
      `INSERT INTO availability_slots (owner_user_id, start_time, end_time) VALUES ($1, $2, $3) RETURNING id, start_time, end_time`,
      [owner.id, start.toISOString(), end.toISOString()]
    )
    res.json({ slot: result.rows[0] })
  } catch (error) {
    console.error('Create availability error:', error)
    res.status(500).json({ error: error.message || 'Failed to add availability' })
  }
})

app.delete('/api/admin/availability/:id', authMiddleware, adminMiddleware, async (req, res) => {
  if (getAdminRole(req.userEmail) !== 'owner') return res.status(403).json({ error: 'Only k245620@nu.edu.pk can remove availability' })
  const owner = await requireCalendarOwner()
  await pool.query('DELETE FROM availability_slots WHERE id = $1 AND owner_user_id = $2', [req.params.id, owner.id])
  res.json({ success: true })
})

app.post('/api/admin/tasks', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (getAdminRole(req.userEmail) !== 'assigner') return res.status(403).json({ error: 'Only wasi@gmail.com can assign tasks' })
    const { assignee = 'Jibran', title, notes = '', start_time, end_time } = req.body
    if (!title || !start_time || !end_time) return res.status(400).json({ error: 'Title, start time, and end time are required' })
    const owner = await requireCalendarOwner()
    const matchingSlot = await pool.query(
      `SELECT id FROM availability_slots WHERE owner_user_id = $1 AND start_time <= $2 AND end_time >= $3 LIMIT 1`,
      [owner.id, start_time, end_time]
    )
    if (matchingSlot.rows.length === 0) return res.status(400).json({ error: 'Choose one of the available times from k245620@nu.edu.pk' })
    const { oauth2Client, connection } = await getAuthorizedGoogleClient(owner.id)
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const event = await calendar.events.insert({
      calendarId: connection.calendar_id || 'primary',
      requestBody: {
        summary: `${title} - ${assignee}`,
        description: notes,
        start: { dateTime: new Date(start_time).toISOString() },
        end: { dateTime: new Date(end_time).toISOString() },
      },
    })
    const result = await pool.query(
      `INSERT INTO assigned_tasks (user_id, assignee, title, notes, start_time, end_time, google_event_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, assignee, title, notes, start_time, end_time, event.data.id || null]
    )
    res.json({ task: result.rows[0], event: event.data })
  } catch (error) {
    console.error('Create admin task error:', error)
    res.status(500).json({ error: error.message || 'Failed to create calendar task' })
  }
})

// ─── OCR Route ─────────────────────────────────────────────────────────────

app.post('/api/ocr', requireGroq, async (req, res) => {
  try {
    const { image } = req.body
    if (!image) return res.status(400).json({ error: 'No image provided' })

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png'

    const completion = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this receipt and extract JSON (ONLY valid JSON, no markdown):

{
  "merchant": "store name",
  "date": "YYYY-MM-DD",
  "total_amount": 0.00,
  "items": [
    { "description": "item", "amount": 0.00, "category": "best category" }
  ]
}

Date default: ${new Date().toISOString().split('T')[0]}
Categories: Food & Dining, Transportation, Shopping, Bills & Utilities, Entertainment, Healthcare, Education, Groceries, Rent, Other
Amounts in PKR. Split multi-item receipts with separate categories.`,
          },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
        ],
      }],
      temperature: 0.1,
      max_tokens: 1024,
    })

    const content = completion.choices[0]?.message?.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ error: 'No JSON in AI response', raw: content })

    res.json(JSON.parse(jsonMatch[0]))
  } catch (error) {
    console.error('OCR Error:', error)
    res.status(500).json({ error: error.message || 'OCR processing failed' })
  }
})

// Export for Vercel
module.exports = app

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`Flowly API running on port ${PORT}`)
  })
}
