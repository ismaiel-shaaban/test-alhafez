// API Client Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://al-hafiz-academy.axeviadigital.com'

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
}

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
}

// Get current locale from context or localStorage
export const getCurrentLocale = (): string => {
  if (typeof window === 'undefined') return 'ar'
  return localStorage.getItem('locale') || 'ar'
}

// API Request wrapper
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  requiresAuth?: boolean
  locale?: string
}

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = true,
    locale,
  } = options

  // Add /dashboard after /api/ for endpoints that start with /api/ (except login)
  const processedEndpoint = endpoint.startsWith('/api/') 
    ? endpoint.replace('/api/', '/api/dashboard/')
    : endpoint
  
  const url = `${API_BASE_URL}${processedEndpoint}`
  
  // Check if body is FormData (for file uploads)
  const isFormData = body instanceof FormData
  
  const requestHeaders: HeadersInit = {
    'Accept': 'application/json',
    'lang': locale || getCurrentLocale(),
    ...headers,
  }

  // Only set Content-Type for JSON, not for FormData (browser will set it automatically with boundary)
  if (!isFormData) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  // Add auth token if required
  if (requiresAuth) {
    const token = getAuthToken()
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (body && method !== 'GET') {
    config.body = isFormData ? body : JSON.stringify(body)
  }

  try {
    const response = await fetch(url, config)

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      removeAuthToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
      throw new Error('Unauthorized')
    }

    // Handle 422 Validation errors
    if (response.status === 422) {
      const errorData = await response.json()
      // API error format: { status: false, number: "E001", message: "..." }
      throw new Error(errorData.message || 'Validation error')
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      // API error format: { status: false, number: "E401", message: "..." }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json()
      
      // API wraps most responses in { status, message, data } format
      // But /api/user returns { status, message, user } - user at top level
      if (responseData && typeof responseData === 'object') {
        // Check if it's the /api/user endpoint format (has 'user' at top level, no 'data')
        if ('user' in responseData && !('data' in responseData)) {
          // Return the whole object so getCurrentUser can extract 'user'
          return responseData as T
        }
        
        // Extract the data field if it exists (most endpoints)
        if ('data' in responseData) {
          return responseData.data as T
        }
        
        // For responses without data wrapper (like logout success: { status, number, message })
        if ('status' in responseData && !('data' in responseData) && !('user' in responseData)) {
          return responseData as T
        }
      }
      
      return responseData as T
    }

    return {} as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Network error occurred')
  }
}

// Pagination object (new format from API)
export interface Pagination {
  total: number
  per_page: number
  current_page: number
  total_pages: number
}

// Paginated response type (new format: { students: [...], pagination: {...} })
export interface PaginatedResponse<T> {
  [key: string]: T[] | Pagination | undefined
  pagination: Pagination
}

