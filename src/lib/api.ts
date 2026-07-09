const API_BASE = '/api'

let token: string | null = localStorage.getItem('flowly_token')

export function setAuthToken(newToken: string | null) {
  token = newToken
  if (newToken) {
    localStorage.setItem('flowly_token', newToken)
  } else {
    localStorage.removeItem('flowly_token')
  }
}

export function getAuthToken() {
  return token
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  const text = await res.text()
  let data: any = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { error: text.trim().startsWith('<!DOCTYPE') ? 'API route not available. Restart the backend or redeploy the latest API.' : text }
    }
  }

  if (res.status === 401 && path === '/auth/me') {
    setAuthToken(null)
    throw new Error(data?.error || 'Session expired')
  }

  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
  return data
}

// Auth
export const authApi = {
  signup: (email: string, password: string, name: string) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) }),

  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request('/auth/me'),
}

// People
export const peopleApi = {
  list: () => request('/people'),
  add: (name: string) => request('/people', { method: 'POST', body: JSON.stringify({ name }) }),
  remove: (id: string) => request(`/people/${id}`, { method: 'DELETE' }),
}

// Categories
export const categoriesApi = {
  list: () => request('/categories'),
}

// Transactions
export const transactionsApi = {
  list: () => request('/transactions'),
  add: (data: {
    person_id?: string
    merchant?: string
    date: string
    total_amount: number
    currency?: string
    notes?: string
    items: { category_id: string; description: string; amount: number }[]
  }) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),

  remove: (id: string) => request(`/transactions/${id}`, { method: 'DELETE' }),
}

// Admin / Google Calendar
export const adminApi = {
  googleStatus: () => request('/admin/google/status'),
  googleAuthUrl: () => request('/admin/google/auth-url'),
  availableTimes: (date: string) => request(`/admin/google/available-times?date=${encodeURIComponent(date)}`),
  addAvailability: (data: { start_time: string; end_time: string }) =>
    request('/admin/availability', { method: 'POST', body: JSON.stringify(data) }),
  removeAvailability: (id: string) => request(`/admin/availability/${id}`, { method: 'DELETE' }),
  createTask: (data: {
    assignee?: string
    title: string
    notes?: string
    start_time: string
    end_time: string
  }) => request('/admin/tasks', { method: 'POST', body: JSON.stringify(data) }),
}
