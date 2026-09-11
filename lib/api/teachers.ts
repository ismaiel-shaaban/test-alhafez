import { apiRequest, PaginatedResponse } from '../api-client'

export interface Teacher {
  id: number
  name: string // Localized name based on lang header
  name_ar: string
  name_en?: string
  specialization: string // Localized specialization based on lang header
  specialization_ar: string
  specialization_en?: string
  experience_years: number
  image?: string // Teacher profile image URL
  phone?: string | null
  email?: string | null
  trial_lesson_price?: number // Price for trial lesson
  trial_session_duration?: number // Trial session duration in minutes
  session_link?: string // Session/circle link (e.g. Google Meet)
  supervisor_id?: number
  supervisor?: {
    id: number
    name: string
  }
  created_at?: string
}

export interface CreateTeacherRequest {
  name: string // Required, name in Arabic
  name_en?: string // Optional, name in English
  specialization: string // Required, specialization in Arabic
  specialization_en?: string // Optional, specialization in English
  experience_years: number // Required, min: 0
  image?: File // Optional, teacher profile image (image file: jpeg, png, jpg, gif, max: 5MB)
  phone?: string // Optional, phone number for teacher login
  email?: string // Optional, email address for teacher account
  password?: string // Optional, password for teacher login (min: 6 characters). If provided along with phone or email, a User account will be automatically created/updated for the teacher. Password will be automatically hashed.
  trial_lesson_price?: number // Optional, price for trial lesson
  trial_session_duration?: number // Optional, trial session duration in minutes
  session_link?: string // Optional, session/circle link (e.g. Google Meet)
  supervisor_id?: number // Optional, supervisor ID
}

export type TeacherSalaryStatusFilter = 'pending' | 'paid'
export type TeacherPaymentMethodTypeFilter = 'wallet' | 'insta' | 'bank'

// List teachers
export const listTeachers = async (
  page: number = 1,
  perPage: number = 15,
  search?: string,
  supervisorId?: number,
  withoutSupervisor?: boolean,
  locale?: string,
  month?: string,
  salaryStatus?: TeacherSalaryStatusFilter,
  paymentMethodType?: TeacherPaymentMethodTypeFilter
): Promise<{ teachers: Teacher[]; pagination: any }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('per_page', perPage.toString())
  if (search) params.append('search', search)
  if (supervisorId !== undefined && supervisorId !== null) params.append('supervisor_id', supervisorId.toString())
  if (withoutSupervisor) params.append('without_supervisor', '1')
  if (month) params.append('month', month)
  if (salaryStatus) params.append('salary_status', salaryStatus)
  if (paymentMethodType) params.append('payment_method_type', paymentMethodType)

  // API returns: { status: true, message: "...", data: { teachers: [...], pagination: {...} } }
  return apiRequest<{ teachers: Teacher[]; pagination: any }>(
    `/api/teachers?${params.toString()}`,
    { locale }
  )
}

// Get teacher
export const getTeacher = async (id: number): Promise<Teacher> => {
  return apiRequest<Teacher>(`/api/teachers/${id}`)
}

// Create teacher
export const createTeacher = async (data: CreateTeacherRequest): Promise<Teacher> => {
  // Use FormData if image, phone, email, or password is provided
  // (API supports both JSON and FormData, but FormData is required for file uploads)
  if (data.image || data.phone || data.email || data.password) {
    const formData = new FormData()
    formData.append('name', data.name)
    if (data.name_en) formData.append('name_en', data.name_en)
    formData.append('specialization', data.specialization)
    if (data.specialization_en) formData.append('specialization_en', data.specialization_en)
    formData.append('experience_years', data.experience_years.toString())
    if (data.image) formData.append('image', data.image)
    if (data.phone) formData.append('phone', data.phone)
    if (data.email) formData.append('email', data.email)
    if (data.password) formData.append('password', data.password)
    if (data.trial_lesson_price !== undefined) formData.append('trial_lesson_price', data.trial_lesson_price.toString())
    if (data.trial_session_duration !== undefined) formData.append('trial_session_duration', data.trial_session_duration.toString())
    if (data.session_link !== undefined) formData.append('session_link', data.session_link)
    if (data.supervisor_id !== undefined) formData.append('supervisor_id', data.supervisor_id.toString())
    
    return apiRequest<Teacher>('/api/teachers', {
      method: 'POST',
      body: formData,
    })
  }
  
  // Otherwise, use JSON
  const jsonData: any = { ...data }
  if (jsonData.trial_lesson_price !== undefined) {
    jsonData.trial_lesson_price = jsonData.trial_lesson_price
  }
  if (jsonData.trial_session_duration !== undefined) {
    jsonData.trial_session_duration = jsonData.trial_session_duration
  }
  if (jsonData.session_link !== undefined) {
    jsonData.session_link = jsonData.session_link
  }
  if (jsonData.supervisor_id !== undefined) {
    jsonData.supervisor_id = jsonData.supervisor_id
  }
  return apiRequest<Teacher>('/api/teachers', {
    method: 'POST',
    body: jsonData,
  })
}

// Update teacher
export const updateTeacher = async (
  id: number,
  data: Partial<CreateTeacherRequest>
): Promise<Teacher> => {
  // Use FormData if image, phone, email, or password is provided
  // (API supports both JSON and FormData, but FormData is required for file uploads)
  if (data.image || data.phone || data.email || data.password) {
    const formData = new FormData()
    if (data.name) formData.append('name', data.name)
    if (data.name_en) formData.append('name_en', data.name_en)
    if (data.specialization) formData.append('specialization', data.specialization)
    if (data.specialization_en) formData.append('specialization_en', data.specialization_en)
    if (data.experience_years !== undefined) formData.append('experience_years', data.experience_years.toString())
    if (data.image) formData.append('image', data.image)
    if (data.phone) formData.append('phone', data.phone)
    if (data.email) formData.append('email', data.email)
    if (data.password) formData.append('password', data.password)
    if (data.trial_lesson_price !== undefined) formData.append('trial_lesson_price', data.trial_lesson_price.toString())
    if (data.trial_session_duration !== undefined) formData.append('trial_session_duration', data.trial_session_duration.toString())
    if (data.session_link !== undefined) formData.append('session_link', data.session_link)
    if (data.supervisor_id !== undefined) formData.append('supervisor_id', data.supervisor_id.toString())
    
    return apiRequest<Teacher>(`/api/teachers/${id}`, {
      method: 'POST',
      body: formData,
    })
  }
  
  // Otherwise, use JSON
  const jsonData: any = { ...data }
  if (jsonData.trial_lesson_price !== undefined) {
    jsonData.trial_lesson_price = jsonData.trial_lesson_price
  }
  if (jsonData.trial_session_duration !== undefined) {
    jsonData.trial_session_duration = jsonData.trial_session_duration
  }
  if (jsonData.session_link !== undefined) {
    jsonData.session_link = jsonData.session_link
  }
  if (jsonData.supervisor_id !== undefined) {
    jsonData.supervisor_id = jsonData.supervisor_id
  }
  return apiRequest<Teacher>(`/api/teachers/${id}`, {
    method: 'POST',
    body: jsonData,
  })
}

// Delete teacher
export const deleteTeacher = async (id: number): Promise<void> => {
  return apiRequest(`/api/teachers/${id}`, {
    method: 'DELETE',
  })
}

