// api.ts — Simple network helper for communicating with the backend API
// Notes:
// - In development this uses http://localhost:5000
// - In production, set `VITE_API_URL` in Vercel to your Render URL
// - All requests include a JSON content type and optional Bearer token when present
// BASE URL for API calls - uses environment variable in production
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getHeaders(token?: string) {
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Simple api helper for axios-like syntax
export const api = {
  async get(url: string) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${BASE}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error(await res.text())
    return { data: await res.json() }
  },
  async post(url: string, data: any, config?: { headers?: Record<string, string> }) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${BASE}${url}`, {
      method: 'POST',
      headers: { ...getHeaders(token || undefined), ...config?.headers },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err: any = new Error(await res.text())
      err.response = { data: { error: err.message } }
      throw err
    }
    return { data: await res.json() }
  },
  async put(url: string, data: any) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${BASE}${url}`, {
      method: 'PUT',
      headers: getHeaders(token || undefined),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(await res.text())
    return { data: await res.json() }
  },
  async patch(url: string, data?: any) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${BASE}${url}`, {
      method: 'PATCH',
      headers: getHeaders(token || undefined),
      body: data ? JSON.stringify(data) : undefined,
    })
    if (!res.ok) throw new Error(await res.text())
    return { data: await res.json() }
  },
  async delete(url: string) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${BASE}${url}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error(await res.text())
    return { data: await res.json() }
  },
}

// Dinosaurs
export async function fetchDinos() {
  const res = await fetch(`${BASE}/api/dinosaurs`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchDino(id: number) {
  const res = await fetch(`${BASE}/api/dinosaurs/${id}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function createDino(payload: any) {
  const res = await fetch(`${BASE}/api/dinosaurs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateDino(id: number, payload: any) {
  const res = await fetch(`${BASE}/api/dinosaurs/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deleteDino(id: number) {
  const res = await fetch(`${BASE}/api/dinosaurs/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Quizzes
export async function fetchQuizzes() {
  const res = await fetch(`${BASE}/api/quizzes`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function createQuiz(payload: any, token: string) {
  const res = await fetch(`${BASE}/api/quizzes`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deleteQuiz(id: number, token: string) {
  const res = await fetch(`${BASE}/api/quizzes/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Subscriptions
export async function fetchSubscription(token: string) {
  const res = await fetch(`${BASE}/api/subscription`, {
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateSubscription(plan: 'free' | 'premium', token: string) {
  const res = await fetch(`${BASE}/api/subscription`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ plan }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function cancelSubscription(token: string) {
  const res = await fetch(`${BASE}/api/subscription`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Favorites
export async function fetchFavorites(token: string) {
  const res = await fetch(`${BASE}/api/favorites`, {
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function addFavorite(dinosaurId: number, token: string) {
  const res = await fetch(`${BASE}/api/favorites`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ dinosaurId }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function removeFavorite(dinosaurId: number, token: string) {
  const res = await fetch(`${BASE}/api/favorites/${dinosaurId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Scores
export async function fetchScores(token: string) {
  const res = await fetch(`${BASE}/api/scores`, {
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function saveScore(quizId: number, score: number, token: string) {
  const res = await fetch(`${BASE}/api/scores`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ quizId, score }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
