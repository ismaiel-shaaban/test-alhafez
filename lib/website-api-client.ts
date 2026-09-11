// Website API Client Configuration (Public endpoints, no auth required)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://al-hafiz-academy.axeviadigital.com'

// Get current locale
export const getCurrentLocale = (): string => {
  if (typeof window === 'undefined') return 'ar'
  return localStorage.getItem('locale') || 'ar'
}

// Website API Request wrapper (no authentication required)
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  locale?: string
}

export const websiteApiRequest = async <T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const {
    method = 'GET',
    body,
    headers = {},
    locale,
  } = options

  const url = `${API_BASE_URL}${endpoint}`
  
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

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (body && method !== 'GET') {
    config.body = isFormData ? body : JSON.stringify(body)
  }

  try {
    const response = await fetch(url, config)

    // Handle 422 Validation errors
    if (response.status === 422) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Validation error')
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json()
      
      // API wraps responses in { status, message, data } format
      if (responseData && typeof responseData === 'object') {
        // Extract the data field if it exists
        if ('data' in responseData) {
          return responseData.data as T
        }
        
        // For responses without data wrapper
        if ('status' in responseData && !('data' in responseData)) {
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

// Pagination object
export interface Pagination {
  total: number
  per_page: number
  current_page: number
  total_pages: number
}

