import { apiRequest, PaginatedResponse, Pagination } from '../api-client'
import type { PaymentAccount } from './payment-accounts'

/** Single partial payment record inside a subscription */
export interface SubscriptionPartialPayment {
  id: number
  subscription_id: number
  student_id: number
  amount: number
  payment_date: string
  payment_time?: string | null
  payment_receipt_image?: string | null
  notes?: string | null
  created_by_id?: number
  created_at: string
  updated_at: string
}

/** Subscription object as returned in student.subscriptions */
export interface StudentSubscription {
  id: number
  student_id: number
  subscription_code?: string
  subscription_number?: number
  start_date: string
  end_date: string
  sessions_per_week?: number
  total_sessions?: number
  completed_sessions_count?: number
  remaining_sessions_count?: number
  is_paid: boolean
  payment_receipt_image?: string | null
  status?: string // e.g. 'active', 'paused'
  is_active?: boolean
  is_upcoming?: boolean
  is_expired?: boolean
  notification_sent?: boolean
  notification_sent_at?: string | null
  subscription_price?: string | number
  total_paid?: number
  remaining_amount?: number
  is_fully_paid?: boolean
  is_actually_paid?: boolean
  partial_payments?: SubscriptionPartialPayment[]
  partial_payments_count?: number
  created_at?: string
  updated_at?: string
}

export type StudentJourneyStatus =
  | 'follow-up'
  | 'not-booked'
  | 'booked'
  | 'attended'
  | 'subscribed'
  | 'subscribed-paid'
  | 'subscribed-unpaid'

export interface Student {
  id: number
  type?: 'website' | 'admin' | 'app' // Registration type
  name: string
  email?: string // Optional
  phone: string
  age?: number // Optional
  gender: 'male' | 'female'
  gender_label?: string // Localized gender label (e.g., "ذكر", "أنثى")
  package_id?: number
  teacher_id?: number
  payment_account_id?: number
  payment_account?: PaymentAccount
  hour?: string // Default session time (used if weekly_schedule not provided)
  monthly_sessions?: number
  weekly_sessions?: number
  weekly_days?: string[] // Used if weekly_schedule not provided
  weekly_schedule?: Record<string, string> // Object with day names as keys and times as values (e.g., {"السبت": "17:00", "الثلاثاء": "14:00"})
  session_duration?: number
  hourly_rate?: number
  notes?: string
  trial_session_attendance?: 'not_booked' | 'booked' | 'attended' // Trial session attendance status
  trial_session_attendance_label?: string // Localized label
  trial_session_date?: string
  trial_session_time?: string
  student_journey_status?: StudentJourneyStatus
  student_journey_status_label?: string
  monthly_subscription_price?: number // Monthly subscription price
  country?: string // Student's country
  currency?: string // Currency code (e.g., "EGP", "USD", "SAR")
  package?: {
    id: number
    name: string
    name_en?: string
  }
  teacher?: {
    id: number
    name: string
    name_en?: string
    specialization?: string
  }
  subscriptions?: StudentSubscription[]
  subscriptions_statistics?: {
    total_subscriptions: number
    paid_subscriptions: number
    unpaid_subscriptions: number
    past_months_count?: number
    first_subscription_date?: string
    last_subscription_date?: string
    monthly_sessions?: number
    total_sessions_count?: number
    completed_sessions_count?: number
    remaining_sessions_count?: number
  }
  unpaid_subscriptions_list?: Array<{
    id: number
    subscription_number: number
  }> // List of unpaid subscriptions with their numbers
  past_months_count?: number // Optional, may be returned by API
  paid_months_count?: number // Optional, may be returned by API
  subscription_start_date?: string // Optional, may be returned by API
  past_sessions_count?: number // Optional, number of past sessions to mark as completed
  past_sessions_date?: string // Optional, YYYY-MM-DD — alternative to count for past sessions
  is_paused?: boolean // Whether the student has paused subscriptions
  created_at?: string
  updated_at?: string
}

export const STUDENT_JOURNEY_STATUS_OPTIONS: { value: StudentJourneyStatus; label: string }[] = [
  { value: 'follow-up', label: 'متابعة' },
  { value: 'not-booked', label: 'غير محجوز' },
  { value: 'booked', label: 'محجوز' },
  { value: 'attended', label: 'حضر' },
  { value: 'subscribed', label: 'مشترك' },
]

export const WEBSITE_STUDENT_JOURNEY_STATUS_FILTER_OPTIONS: { value: StudentJourneyStatus; label: string }[] =
  STUDENT_JOURNEY_STATUS_OPTIONS

export const SUBSCRIBED_PAYMENT_JOURNEY_STATUS_OPTIONS: { value: StudentJourneyStatus; label: string }[] = [
  { value: 'subscribed-paid', label: 'اشترك ودفع' },
  { value: 'subscribed-unpaid', label: 'اشترك ولم يدفع' },
]

export const STUDENTS_JOURNEY_STATUS_FILTER_OPTIONS: { value: StudentJourneyStatus; label: string }[] = [
  ...STUDENT_JOURNEY_STATUS_OPTIONS,
  ...SUBSCRIBED_PAYMENT_JOURNEY_STATUS_OPTIONS,
]

export interface StudentFilters {
  type?: 'website' | 'admin' | 'app' // Filter by registration type
  package_id?: number
  gender?: 'male' | 'female'
  teacher_id?: number
  search?: string // Search term
  unpaid_months_count?: number // Number of unpaid months
  incomplete_sessions_count?: number // Number of incomplete sessions
  subscription_days_remaining?: number // Days remaining until subscription ends
  payment_status?: 'all_paid' | 'has_unpaid' // Payment status filter
  trial_session_attendance?: 'not_booked' | 'booked' | 'attended' // Filter by trial session attendance
  student_journey_status?: StudentJourneyStatus
  is_paused?: boolean // Filter by paused status
  has_consecutive_absences?: boolean // Filter students with consecutive absences
  subscription_added_date?: string // YYYY-MM-DD — filter by subscription added on a specific day
  subscription_added_from?: string // YYYY-MM-DD — filter from date (inclusive)
  subscription_added_to?: string // YYYY-MM-DD — filter to date (inclusive)
  subscription_added_month?: string // YYYY-MM — filter by subscription added month
  per_page?: number
  page?: number
}

export interface CreateStudentRequest {
  name: string
  email?: string // Optional, unique
  phone: string
  age?: number // Optional, 1-120
  gender: 'male' | 'female'
  package_id?: number
  teacher_id?: number
  payment_account_id?: number
  hour?: string // Default session time (format: HH:mm) - used if weekly_schedule not provided
  monthly_sessions?: number
  weekly_sessions?: number
  weekly_days?: Array<string | { day: string; session_duration?: number }> // e.g. ["friday"] or [{ day: "sunday", session_duration: 90 }, { day: "tuesday" }]
  weekly_schedule?: Record<string, string | { time: string; session_duration?: number }> // e.g. { "sunday": { time: "10:00", session_duration: 60 }, "friday": "17:00" }. Takes precedence over hour and weekly_days.
  session_duration?: number
  hourly_rate?: number
  notes?: string
  password?: string // Optional, min: 6 characters. Password will be automatically hashed.
  trial_session_attendance?: 'not_booked' | 'booked' | 'attended' // Trial session attendance status
  trial_session_date?: string // Optional, YYYY-MM-DD format. Required when trial_session_attendance is 'booked'
  trial_session_time?: string // Optional, HH:mm format. Required when trial_session_attendance is 'booked'
  monthly_subscription_price?: number // Monthly subscription price (numeric, min: 0)
  country?: string // Student's country
  currency?: string // Currency code (e.g., "EGP", "USD", "SAR")
  past_months_count?: number // Optional, integer, min: 0, max: 120. Number of past months to create subscriptions for.
  paid_months_count?: number // Optional, integer, min: 0, max: 120. Number of paid months.
  subscription_start_date?: string // Optional, YYYY-MM-DD format. Required if past_months_count is provided. Used to calculate past subscriptions.
  past_sessions_count?: number // Optional, integer, min: 0. Number of past sessions to mark as completed.
  past_sessions_date?: string // Optional, YYYY-MM-DD. Alternative to past_sessions_count — calculate from date.
  paid_subscriptions_count?: number // Optional, integer, min: 0. Number of paid subscriptions (for update only)
}

// List students
export const listStudents = async (
  filters: StudentFilters = {},
  locale?: string
): Promise<{ students: Student[]; pagination: any }> => {
  const params = new URLSearchParams()
  
  if (filters.type) params.append('type', filters.type)
  if (filters.package_id) params.append('package_id', filters.package_id.toString())
  if (filters.gender) params.append('gender', filters.gender)
  if (filters.teacher_id) params.append('teacher_id', filters.teacher_id.toString())
  if (filters.search) params.append('search', filters.search)
  if (filters.unpaid_months_count !== undefined) params.append('unpaid_months_count', filters.unpaid_months_count.toString())
  if (filters.incomplete_sessions_count !== undefined) params.append('incomplete_sessions_count', filters.incomplete_sessions_count.toString())
  if (filters.subscription_days_remaining !== undefined) params.append('subscription_days_remaining', filters.subscription_days_remaining.toString())
  if (filters.payment_status) params.append('payment_status', filters.payment_status)
  if (filters.trial_session_attendance) params.append('trial_session_attendance', filters.trial_session_attendance)
  if (filters.student_journey_status) params.append('student_journey_status', filters.student_journey_status)
  if (filters.is_paused !== undefined) params.append('is_paused', filters.is_paused.toString())
  if (filters.has_consecutive_absences !== undefined) {
    params.append('has_consecutive_absences', filters.has_consecutive_absences.toString())
  }
  if (filters.subscription_added_date) {
    params.append('subscription_added_date', filters.subscription_added_date)
  }
  if (filters.subscription_added_from) {
    params.append('subscription_added_from', filters.subscription_added_from)
  }
  if (filters.subscription_added_to) {
    params.append('subscription_added_to', filters.subscription_added_to)
  }
  if (filters.subscription_added_month) {
    params.append('subscription_added_month', filters.subscription_added_month)
  }
  if (filters.per_page) params.append('per_page', filters.per_page.toString())
  if (filters.page) params.append('page', filters.page.toString())

  const query = params.toString()
  // API returns: { status: true, message: "...", data: { students: [...], pagination: {...} } }
  return apiRequest<{ students: Student[]; pagination: any }>(
    `/api/students${query ? `?${query}` : ''}`,
    { locale }
  )
}

// Get student
export const getStudent = async (id: number, locale?: string): Promise<Student> => {
  return apiRequest<Student>(`/api/students/${id}`, { locale })
}

// Create student
export const createStudent = async (data: CreateStudentRequest): Promise<Student> => {
  return apiRequest<Student>('/api/students', {
    method: 'POST',
    body: data,
  })
}

// Update student
export const updateStudent = async (
  id: number,
  data: Partial<CreateStudentRequest>
): Promise<Student> => {
  return apiRequest<Student>(`/api/students/${id}`, {
    method: 'POST',
    body: data,
  })
}

// Delete student
export const deleteStudent = async (id: number): Promise<void> => {
  return apiRequest(`/api/students/${id}`, {
    method: 'DELETE',
  })
}

// Force delete student (permanent, bypasses soft delete / constraints)
export const forceDeleteStudent = async (id: number): Promise<void> => {
  return apiRequest(`/api/students/${id}/force-delete`, {
    method: 'DELETE',
  })
}

// List trashed (soft-deleted) students
export const listTrashedStudents = async (
  filters?: { page?: number; per_page?: number; search?: string },
  locale?: string
): Promise<{ students: Student[]; pagination?: any }> => {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.per_page) params.append('per_page', filters.per_page.toString())
  if (filters?.search) params.append('search', filters.search)
  const query = params.toString()
  return apiRequest<{ students: Student[]; pagination?: any }>(
    `/api/students/trashed${query ? `?${query}` : ''}`,
    { locale }
  )
}

// Restore trashed student
export const restoreTrashedStudent = async (id: number): Promise<Student> => {
  return apiRequest<Student>(`/api/students/trashed/${id}/restore`, {
    method: 'POST',
  })
}

// Update subscription payment status
export const updateSubscriptionPaymentStatus = async (
  subscriptionId: number,
  isPaid: boolean
): Promise<any> => {
  return apiRequest(`/api/student-subscriptions/${subscriptionId}`, {
    method: 'POST',
    body: { is_paid: isPaid },
  })
}

// Pause subscription (legacy, no dates)
export const pauseSubscription = async (
  subscriptionId: number,
  locale?: string
): Promise<any> => {
  return apiRequest(`/api/student-subscriptions/${subscriptionId}/pause`, {
    method: 'POST',
    locale,
  })
}

export interface PauseSubscriptionTemporaryRequest {
  pause_from: string // YYYY-MM-DD
  pause_to: string // YYYY-MM-DD
  resume_date: string // YYYY-MM-DD
}

// Pause subscription temporarily with date range
export const pauseSubscriptionTemporary = async (
  subscriptionId: number,
  body: PauseSubscriptionTemporaryRequest,
  locale?: string
): Promise<any> => {
  return apiRequest(`/api/student-subscriptions/${subscriptionId}/pause-temporary`, {
    method: 'POST',
    body,
    locale,
  })
}

// Resume subscription
export const resumeSubscription = async (
  subscriptionId: number,
  resumeDate?: string,
  locale?: string
): Promise<any> => {
  return apiRequest(`/api/student-subscriptions/${subscriptionId}/resume`, {
    method: 'POST',
    body: resumeDate ? { resume_date: resumeDate } : {},
    locale,
  })
}

// Create partial payment for a subscription
export const createSubscriptionPartialPayment = async (
  formData: FormData,
  locale?: string
): Promise<any> => {
  return apiRequest('/api/subscription-partial-payments', {
    method: 'POST',
    body: formData,
    locale,
  })
}

/** GET /api/dashboard/students/{id}/audit-logs */
export interface StudentAuditLogActor {
  type: string
  type_label?: string
  id: number | null
  name: string | null
  phone: string | null
}

export interface StudentAuditLogAction {
  key: string
  label: string
}

export interface StudentAuditLogRequestDetails {
  endpoint: string
  method: string
  status_code: number
  performed_at: string
}

export interface StudentAuditLogActorDetails {
  type: string
  name: string
  phone?: string | null
  id: number | null
}

export interface StudentAuditLogChange {
  field: string
  label: string
  before: unknown
  after: unknown
  field_key?: string
  field_label?: string
  before_display?: string
  after_display?: string
  old_value?: string
  new_value?: string
  before_raw?: unknown
  after_raw?: unknown
}

export interface StudentAuditLog {
  id: number
  created_at: string
  path: string
  http_method: string
  response_status: number
  actor: StudentAuditLogActor
  changes: StudentAuditLogChange[]
  action?: StudentAuditLogAction
  request_details?: StudentAuditLogRequestDetails
  actor_details?: StudentAuditLogActorDetails
  changes_count?: number
}

export interface StudentAuditLogsData {
  student: { id: number; name: string; phone?: string | null }
  logs: StudentAuditLog[]
  pagination?: Pagination
}

export interface StudentAuditLogsFilters {
  page?: number
  per_page?: number
}

export const getStudentAuditLogs = async (
  studentId: number,
  options: StudentAuditLogsFilters & { locale?: string } = {}
): Promise<StudentAuditLogsData> => {
  const { page, per_page, locale } = options
  const params = new URLSearchParams()
  if (page != null && page > 0) params.append('page', String(page))
  if (per_page != null && per_page > 0) params.append('per_page', String(per_page))
  const query = params.toString()
  return apiRequest<StudentAuditLogsData>(
    `/api/students/${studentId}/audit-logs${query ? `?${query}` : ''}`,
    { locale }
  )
}

