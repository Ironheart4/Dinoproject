// ============================================================================
// api.ts — HTTP Client for DinoProject Backend
// ============================================================================
// PURPOSE: Provides helper functions to communicate with the Express backend API.
// All network requests go through here, making it easy to:
//   1. Add authentication tokens automatically
//   2. Handle errors consistently
//   3. Switch between dev/production URLs via environment variables
//
// USAGE EXAMPLES:
//   import { api, fetchDinos } from './api'
//   
//   // Using the generic api object:
//   const { data } = await api.get('/api/dinosaurs')
//   await api.post('/api/forum/posts', { title: 'Hello', content: '...' })
//   
//   // Using specific helper functions:
//   const dinos = await fetchDinos()
//   const dino = await fetchDino(5)
//
// ENVIRONMENT:
//   - VITE_API_URL: Set in Vercel to your backend URL (e.g., https://dinoproject-api.onrender.com)
//   - Defaults to http://localhost:5000 for local development
// ============================================================================

// BASE URL for API calls - uses environment variable in production
// In development: http://localhost:5000
// In production: https://dinoproject-api.onrender.com (set in Vercel)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Build request headers with optional Bearer token for authentication.
 * @param token - JWT token from Supabase auth (optional)
 * @returns Headers object with Content-Type and Authorization
 */
function getHeaders(token?: string) {
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// ============================================================================
// GENERIC API HELPER
// Similar to axios but using native fetch
// Automatically includes auth token from localStorage if present
// ============================================================================
export const api = {
  /**
   * GET request - fetch data from the server
   * @example const { data } = await api.get('/api/dinosaurs')
   */
  async get(url: string) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${BASE}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error(await res.text())
    return { data: await res.json() }
  },
  
  /**
   * POST request - create new data on the server
   * @example await api.post('/api/forum/posts', { title: 'My Post', content: '...' })
   */
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
  
  /**
   * PUT request - replace/update data on the server (full update)
   * @example await api.put('/api/dinosaurs/5', { name: 'Updated Name', ... })
   */
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
  
  /**
   * PATCH request - partial update on the server
   * @example await api.patch('/api/forum/posts/5/pin')  // Toggle pin status
   */
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
  
  /**
   * DELETE request - remove data from the server
   * @example await api.delete('/api/favorites/5')
   */
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

// ============================================================================
// DINOSAUR API FUNCTIONS
// Specific helpers for dinosaur CRUD operations
// ============================================================================

/**
 * Fetch all dinosaurs from the database
 * @returns Array of dinosaur objects
 * @example const dinos = await fetchDinos()
 */
export async function fetchDinos() {
  const res = await fetch(`${BASE}/api/dinosaurs`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/**
 * Fetch a single dinosaur by ID
 * @param id - Dinosaur ID
 * @returns Single dinosaur object with all details
 * @example const trex = await fetchDino(1)
 */
export async function fetchDino(id: number) {
  const res = await fetch(`${BASE}/api/dinosaurs/${id}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/**
 * Create a new dinosaur (admin only)
 * @param payload - Dinosaur data (name, species, period, diet, etc.)
 */
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
