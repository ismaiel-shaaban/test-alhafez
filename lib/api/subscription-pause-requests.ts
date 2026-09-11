import { apiRequest, Pagination } from '../api-client'

export interface SubscriptionPauseRequest {
  id: number
  teacher: {
    id: number
    name: string
  }
  student: {
    id: number
    name: string
  }
  subscription: {
    id: number
    subscription_code: string
  }
  pause_from: string
  pause_to: string
  reason?: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_by?: {
    id: number
    name: string
  }
  approved_at?: string
  rejected_by?: {
    id: number
    name: string
  }
  rejected_at?: string
  rejection_reason?: string
}

export interface SubscriptionPauseRequestsResponse {
  requests: SubscriptionPauseRequest[]
  pagination: Pagination
}

export interface SubscriptionPauseRequestFilters {
  type?: 'pause' | 'resume'
  status?: 'pending' | 'approved' | 'rejected'
  teacher_id?: number
  student_id?: number
  subscription_id?: number
  date_from?: string
  date_to?: string
  per_page?: number
  page?: number
}

export const getSubscriptionPauseRequests = async (
  filters?: SubscriptionPauseRequestFilters,
  locale?: string
): Promise<SubscriptionPauseRequestsResponse> => {
  const params = new URLSearchParams()
  
  if (filters?.type) params.append('type', filters.type)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.teacher_id) params.append('teacher_id', filters.teacher_id.toString())
  if (filters?.student_id) params.append('student_id', filters.student_id.toString())
  if (filters?.subscription_id) params.append('subscription_id', filters.subscription_id.toString())
  if (filters?.date_from) params.append('date_from', filters.date_from)
  if (filters?.date_to) params.append('date_to', filters.date_to)
  if (filters?.per_page) params.append('per_page', filters.per_page.toString())
  if (filters?.page) params.append('page', filters.page.toString())

  const queryString = params.toString()
  const url = `/api/subscription-pause-requests${queryString ? `?${queryString}` : ''}`
  
  return apiRequest<SubscriptionPauseRequestsResponse>(url, { locale })
}

export const approveSubscriptionPauseRequest = async (
  pauseRequestId: number,
  locale?: string
): Promise<SubscriptionPauseRequest> => {
  return apiRequest<SubscriptionPauseRequest>(
    `/api/subscription-pause-requests/${pauseRequestId}/approve`,
    {
      method: 'POST',
      locale,
    }
  )
}

export const rejectSubscriptionPauseRequest = async (
  pauseRequestId: number,
  rejectionReason?: string,
  locale?: string
): Promise<SubscriptionPauseRequest> => {
  return apiRequest<SubscriptionPauseRequest>(
    `/api/subscription-pause-requests/${pauseRequestId}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason || undefined }),
      locale,
    }
  )
}

// Delete subscription pause request
export const deleteSubscriptionPauseRequest = async (
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest(`/api/subscription-pause-requests/${id}`, {
    method: 'DELETE',
    locale,
  })
}

