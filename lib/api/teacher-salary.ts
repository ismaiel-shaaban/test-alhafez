import { apiRequest, Pagination } from '../api-client'

export interface TeacherSalaryStudent {
  id: number
  name: string
  email: string
  phone: string
  sessions_count: number
  total_hours: number
  hourly_rate: number
  total_amount: number
}

export interface TeacherSalarySummary {
  total_students: number
  total_sessions: number
  total_trial_sessions?: number
  total_hours: number
  total_trial_amount?: number
  total_amount: number
  total_rewards?: number
  total_deductions?: number
  final_amount?: number
}

export interface TeacherPayment {
  id: number
  teacher_id: number
  month: string // YYYY-MM
  total_amount: number
  is_paid: boolean
  payment_proof_image?: string
  files?: string[]
  payment_method_id?: number
  payment_method?: TeacherPaymentMethod
  paid_at?: string
  notes?: string
  created_at?: string
  teacher?: {
    id: number
    name: string
    name_en?: string
  }
}

export interface TeacherSalaryRewardDeduction {
  id: number
  title: string
  description?: string
  amount: number
  notes?: string
}

export interface TeacherSalaryResponse {
  teacher: {
    id: number
    name: string
    name_en?: string
    specialization?: string
  }
  month: string // YYYY-MM
  students: TeacherSalaryStudent[]
  summary: TeacherSalarySummary
  rewards?: TeacherSalaryRewardDeduction[]
  deductions?: TeacherSalaryRewardDeduction[]
  payment: TeacherPayment | null
}

export interface TeacherPaymentMethod {
  id: number
  type: 'wallet' | 'insta' | 'instapay' // API returns 'insta', but we support both for compatibility
  type_label?: string
  name: string
  phone?: string
}

export interface MarkPaymentRequest {
  month: string // YYYY-MM, required
  payment_proof_images: File[] // Required, at least one proof file (jpeg, png, jpg, gif, max: 5MB each)
  payment_method_id?: number // Optional, ID of the teacher's payment method
  notes?: string // Optional
}

export function getPaymentProofUrls(payment: {
  files?: string[]
  payment_proof_image?: string
}): string[] {
  if (payment.files?.length) {
    return payment.files.filter(Boolean)
  }
  if (payment.payment_proof_image) {
    return [payment.payment_proof_image]
  }
  return []
}

// Get teacher salary calculation
export const getTeacherSalary = async (
  teacherId: number,
  month: string, // YYYY-MM
  locale?: string
): Promise<TeacherSalaryResponse> => {
  return apiRequest<TeacherSalaryResponse>(
    `/api/teachers/${teacherId}/salary?month=${month}`,
    { locale }
  )
}

// Get teacher payment methods
export const getTeacherPaymentMethods = async (
  teacherId: number,
  locale?: string
): Promise<TeacherPaymentMethod[]> => {
  const response = await apiRequest<{ payment_methods: TeacherPaymentMethod[] }>(
    `/api/teachers/${teacherId}/payment-methods`,
    { locale }
  )
  return response.payment_methods || []
}

// Mark payment as paid
export const markPaymentAsPaid = async (
  teacherId: number,
  data: MarkPaymentRequest
): Promise<TeacherPayment> => {
  // Use FormData for multipart/form-data (payment proof files)
  const formData = new FormData()
  formData.append('month', data.month)
  data.payment_proof_images.forEach((file) => {
    formData.append('files[]', file)
  })
  if (data.payment_method_id) formData.append('payment_method_id', data.payment_method_id.toString())
  if (data.notes) formData.append('notes', data.notes)
  
  return apiRequest<TeacherPayment>(`/api/teachers/${teacherId}/salary/pay`, {
    method: 'POST',
    body: formData,
  })
}

// Get teacher payments history
export const getTeacherPayments = async (
  teacherId: number,
  page: number = 1,
  perPage: number = 15,
  locale?: string
): Promise<{ payments: TeacherPayment[]; pagination: Pagination }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('per_page', perPage.toString())

  return apiRequest<{ payments: TeacherPayment[]; pagination: Pagination }>(
    `/api/teachers/${teacherId}/payments?${params.toString()}`,
    { locale }
  )
}

// Add proof files to an existing payment
export const addTeacherPaymentFiles = async (
  teacherId: number,
  paymentId: number,
  files: File[]
): Promise<TeacherPayment> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files[]', file)
  })

  return apiRequest<TeacherPayment>(
    `/api/dashboard/teachers/${teacherId}/payments/${paymentId}/files`,
    {
      method: 'POST',
      body: formData,
    }
  )
}

// Delete a proof file from an existing payment (fileIndex starts at 0)
export const deleteTeacherPaymentFile = async (
  teacherId: number,
  paymentId: number,
  fileIndex: number
): Promise<TeacherPayment> => {
  return apiRequest<TeacherPayment>(
    `/api/dashboard/teachers/${teacherId}/payments/${paymentId}/files/${fileIndex}`,
    {
      method: 'DELETE',
    }
  )
}

