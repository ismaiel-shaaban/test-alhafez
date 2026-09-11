import { apiRequest, setAuthToken, removeAuthToken } from '../api-client'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  type?: string
  user: {
    id: number
    name: string
    username: string
    email: string
    phone?: string
    is_active?: boolean
    teacher?: {
      id: number
      name: string
      specialization: string
    }
    supervisor?: {
      id: number
      name?: string
    }
  }
  token: string
}

export interface User {
  id: number
  name: string
  username: string
  email: string
  phone?: string
  is_active?: boolean
  teacher?: {
    id: number
    name: string
    specialization: string
  }
  /** When logged in as supervisor; use supervisor.id for /api/supervisors/:id/... if present */
  supervisor?: {
    id: number
    name?: string
  }
}

// Login
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  // API returns: { status: true, message: "...", data: { type: "...", user: {...}, token: "..." } }
  // OR: { type: "...", user: {...}, token: "..." } (if no data wrapper)
  const response = await apiRequest<{ type?: string; user: LoginResponse['user']; token: string }>(
    '/api/login',
    {
      method: 'POST',
      body: credentials,
      requiresAuth: false,
    }
  )
  
  // Save token
  if (response.token) {
    setAuthToken(response.token)
  }
  
  return {
    type: response.type,
    user: response.user,
    token: response.token,
  }
}

// Logout
export const logout = async (): Promise<void> => {
  try {
    await apiRequest('/api/logout', {
      method: 'POST',
    })
  } catch (error) {
    // Even if API call fails, clear local token
    console.error('Logout error:', error)
  } finally {
    removeAuthToken()
  }
}

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  // API returns: { status: true, message: "...", user: {...} }
  // Note: This endpoint returns 'user' at top level, not in 'data'
  // The apiRequest will return the whole response for /api/user
  const response = await apiRequest<{ user: User }>('/api/user')
  // Extract user from response
  if ('user' in response) {
    return response.user
  }
  // Fallback if structure is different
  return response as any
}

