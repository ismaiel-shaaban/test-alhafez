import { apiRequest, Pagination } from '../api-client'

export interface PaymentReceipt {
  id: number
  student_id: number
  amount: number
  payment_date: string
  receipt_image: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  status_label?: string
  rejection_reason?: string
  approved_by?: number
  approved_at?: string
  rejected_by?: number
  rejected_at?: string
  student?: {
    id: number
    name: string
    phone?: string
  }
  created_at?: string
  updated_at?: string
}

export interface PaymentReceiptsResponse {
  receipts: PaymentReceipt[]
  pagination: Pagination
}

// Get all payment receipts
export const getPaymentReceipts = async (
  filters: {
    student_id?: number
    status?: 'pending' | 'approved' | 'rejected'
    date_from?: string
    date_to?: string
    per_page?: number
    page?: number
  } = {},
  locale?: string
): Promise<PaymentReceiptsResponse> => {
  const params = new URLSearchParams()
  if (filters.student_id) params.append('student_id', filters.student_id.toString())
  if (filters.status) params.append('status', filters.status)
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)
  if (filters.per_page) params.append('per_page', filters.per_page.toString())
  if (filters.page) params.append('page', filters.page.toString())
  
  return apiRequest<PaymentReceiptsResponse>(
    `/api/payment-receipts${params.toString() ? `?${params.toString()}` : ''}`,
    { locale }
  )
}

// Approve payment receipt
export const approvePaymentReceipt = async (
  id: number,
  locale?: string
): Promise<PaymentReceipt> => {
  return apiRequest<PaymentReceipt>(`/api/payment-receipts/${id}/approve`, {
    method: 'POST',
    locale,
  })
}

// Reject payment receipt
export const rejectPaymentReceipt = async (
  id: number,
  rejection_reason?: string,
  locale?: string
): Promise<PaymentReceipt> => {
  return apiRequest<PaymentReceipt>(`/api/payment-receipts/${id}/reject`, {
    method: 'POST',
    body: { rejection_reason },
    locale,
  })
}

// Delete payment receipt
export const deletePaymentReceipt = async (
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest(`/api/payment-receipts/${id}`, {
    method: 'DELETE',
    locale,
  })
}

