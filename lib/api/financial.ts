import { getAuthToken, getCurrentLocale, type Pagination } from '../api-client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://al-hafiz-academy.axeviadigital.com'

export type FinancialPreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'custom'

export type FinancialPaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'visa'
  | 'wallet'
  | 'cliq'
  | 'instapay'
  | 'other'
  | 'unknown'

export interface MoneyTotal {
  currency: string
  amount: number
}

export interface FinancialMeta {
  preset?: string
  from?: string
  to?: string
  timezone?: string
  currency_count?: number
  generated_at?: string
  generated_by?: { id: number; name: string }
  filters?: Record<string, unknown>
  omitted_sections?: string[]
}

export interface FinancialFilters {
  preset?: FinancialPreset
  from?: string
  to?: string
  timezone?: string
  student_id?: number
  teacher_id?: number
  subscription_id?: number
  currency?: string
  payment_method?: FinancialPaymentMethod
  bank_account_id?: number
  payment_account_id?: number
  employee_id?: number
  page?: number
  per_page?: number
  sort?: string
  order?: 'asc' | 'desc'
  limit?: number
}

export interface FinancialEnvelope<T> {
  data: T
  meta?: FinancialMeta
  pagination?: Pagination
  message?: string
}

export interface CollectionRateItem {
  currency: string
  rate: number | null
  collected_to_date: number
  billed_to_date: number
}

export interface FinancialSummary {
  cash_revenue: MoneyTotal[]
  refunds: MoneyTotal[]
  net_revenue: MoneyTotal[]
  outstanding: MoneyTotal[]
  collection_rate: CollectionRateItem[]
  teacher_liabilities?: {
    currency: string
    total: number
  }
  links?: Record<string, string>
}

export interface FinancialCashReport {
  cash_revenue: MoneyTotal[]
  refunds: MoneyTotal[]
  net_revenue: MoneyTotal[]
  payments_count: number
  payments_count_by_currency: Array<{ currency: string; count: number }>
  average_payment: MoneyTotal[]
  links?: Record<string, string>
}

export interface FinancialPaymentAccount {
  id: number | null
  name?: string | null
  title: string
  type?: string | null
  bank_name?: string | null
}

export interface FinancialPersonRef {
  id: number | null
  name: string
}

export interface FinancialSubscriptionRef {
  id: number
  subscription_code: string
  start_date: string
  end_date: string
}

export interface FinancialPayment {
  id: number
  amount: number
  currency: string
  payment_date: string
  payment_time?: string | null
  payment_method?: string | null
  payment_account?: FinancialPaymentAccount | null
  student?: FinancialPersonRef
  subscription?: FinancialSubscriptionRef
  received_by?: FinancialPersonRef | null
  notes?: string | null
  payment_receipt_image?: string | null
  created_at?: string
}

export interface FinancialRefund {
  id: number
  amount: number
  currency: string
  refund_date: string
  refund_time?: string | null
  payment_method?: string | null
  payment_account?: FinancialPaymentAccount | null
  student?: FinancialPersonRef
  subscription?: FinancialSubscriptionRef
  partial_payment?: { id: number; amount: number; payment_date: string }
  reason?: string | null
  notes?: string | null
  received_by?: FinancialPersonRef | null
  created_at?: string
}

export interface FinancialCollectionReport {
  period_collected: MoneyTotal[]
  outstanding: MoneyTotal[]
  overdue: MoneyTotal[]
  collection_rate: CollectionRateItem[]
  as_of?: string
  links?: Record<string, string>
}

export interface FinancialOutstandingItem {
  subscription_id: number
  subscription_code: string
  status: string
  start_date: string
  end_date: string
  student?: FinancialPersonRef
  teacher?: FinancialPersonRef
  currency: string
  billed_amount: number
  collected_to_date: number
  remaining_amount: number
  legacy_settled: boolean
  is_overdue: boolean
  days_overdue: number
}

export interface FinancialLiabilitiesReport {
  currency: string
  total: number
  teachers_count: number
  breakdown: {
    session_earnings: number
    rewards: number
    deductions: number
  }
  links?: Record<string, string>
}

export interface FinancialTeacherLiability {
  teacher: { id: number; name: string; name_en?: string }
  currency: string
  session_earnings: number
  rewards: number
  deductions: number
  total: number
  completed_sessions_count: number
  completed_trial_sessions_count: number
}

export interface RevenueByDayPoint {
  date: string
  totals: MoneyTotal[]
}

export interface RevenueByWeekPoint {
  week_start: string
  week_end: string
  iso_week: string
  totals: MoneyTotal[]
}

export interface RevenueByMonthPoint {
  month: string
  totals: MoneyTotal[]
}

export interface AnalyticsBucketItem {
  totals: MoneyTotal[]
  payment_account?: FinancialPaymentAccount
  payment_method?: string
  employee?: FinancialPersonRef
}

export interface TopStudentItem {
  student: FinancialPersonRef
  currency: string
  amount: number
}

export interface TopBankItem {
  payment_account: FinancialPaymentAccount
  currency: string
  amount: number
}

export interface TopCurrencyItem {
  currency: string
  amount: number
}

export interface FinancialCashStudentItem {
  student: FinancialPersonRef
  payments_count?: number
  last_payment_date?: string
  totals: MoneyTotal[]
}

export interface FinancialCashStudentsReport {
  payment_account: FinancialPaymentAccount
  students: FinancialCashStudentItem[]
}

function buildFinancialQuery(filters: FinancialFilters = {}): string {
  const params = new URLSearchParams()
  if (filters.preset) params.append('preset', filters.preset)
  if (filters.from) params.append('from', filters.from)
  if (filters.to) params.append('to', filters.to)
  if (filters.timezone) params.append('timezone', filters.timezone)
  if (filters.student_id != null) params.append('student_id', String(filters.student_id))
  if (filters.teacher_id != null) params.append('teacher_id', String(filters.teacher_id))
  if (filters.subscription_id != null) params.append('subscription_id', String(filters.subscription_id))
  if (filters.currency) params.append('currency', filters.currency)
  if (filters.payment_method) params.append('payment_method', filters.payment_method)
  const bankId = filters.bank_account_id ?? filters.payment_account_id
  if (bankId != null) params.append('bank_account_id', String(bankId))
  if (filters.employee_id != null) params.append('employee_id', String(filters.employee_id))
  if (filters.page != null) params.append('page', String(filters.page))
  if (filters.per_page != null) params.append('per_page', String(filters.per_page))
  if (filters.sort) params.append('sort', filters.sort)
  if (filters.order) params.append('order', filters.order)
  if (filters.limit != null) params.append('limit', String(filters.limit))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

async function financialRequest<T>(
  path: string,
  filters: FinancialFilters = {}
): Promise<FinancialEnvelope<T>> {
  const endpoint = `/api/financial${path}${buildFinancialQuery(filters)}`
  const url = `${API_BASE_URL}${endpoint.replace('/api/', '/api/dashboard/')}`

  const token = getAuthToken()
  const headers: HeadersInit = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    lang: getCurrentLocale(),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(url, { method: 'GET', headers })

  if (response.status === 401) {
    throw new Error('Unauthorized')
  }

  const json = await response.json().catch(() => ({}))

  if (!response.ok || json.status === false) {
    throw new Error(json.message || `HTTP error! status: ${response.status}`)
  }

  return {
    data: json.data as T,
    meta: json.meta,
    pagination: json.pagination,
    message: json.message,
  }
}

export const getFinancialHealth = () =>
  financialRequest<{ status?: boolean; message?: string }>('/health')

export const getFinancialSummary = (filters?: FinancialFilters) =>
  financialRequest<FinancialSummary>('/summary', filters)

export const getFinancialCash = (filters?: FinancialFilters) =>
  financialRequest<FinancialCashReport>('/cash', filters)

export const getFinancialCashPayments = (filters?: FinancialFilters) =>
  financialRequest<FinancialPayment[]>('/cash/payments', filters)

export const getFinancialCashStudents = (filters?: FinancialFilters) =>
  financialRequest<FinancialCashStudentsReport>('/cash/students', filters)

export const getFinancialCashRefunds = (filters?: FinancialFilters) =>
  financialRequest<FinancialRefund[]>('/cash/refunds', filters)

export const getFinancialCollection = (filters?: FinancialFilters) =>
  financialRequest<FinancialCollectionReport>('/collection', filters)

export const getFinancialOutstanding = (filters?: FinancialFilters) =>
  financialRequest<FinancialOutstandingItem[]>('/collection/outstanding', filters)

export const getFinancialOverdue = (filters?: FinancialFilters) =>
  financialRequest<FinancialOutstandingItem[]>('/collection/overdue', filters)

export const getFinancialLiabilities = (filters?: FinancialFilters) =>
  financialRequest<FinancialLiabilitiesReport>('/liabilities', filters)

export const getFinancialTeacherLiabilities = (filters?: FinancialFilters) =>
  financialRequest<FinancialTeacherLiability[]>('/liabilities/teachers', filters)

export const getRevenueByDay = (filters?: FinancialFilters) =>
  financialRequest<{ series: RevenueByDayPoint[] }>('/analytics/revenue-by-day', filters)

export const getRevenueByWeek = (filters?: FinancialFilters) =>
  financialRequest<{ series: RevenueByWeekPoint[] }>('/analytics/revenue-by-week', filters)

export const getRevenueByMonth = (filters?: FinancialFilters) =>
  financialRequest<{ series: RevenueByMonthPoint[] }>('/analytics/revenue-by-month', filters)

export const getRevenueByCurrency = (filters?: FinancialFilters) =>
  financialRequest<{ totals: MoneyTotal[] }>('/analytics/revenue-by-currency', filters)

export const getRevenueByBank = (filters?: FinancialFilters) =>
  financialRequest<{ items: AnalyticsBucketItem[] }>('/analytics/revenue-by-bank', filters)

export const getRevenueByPaymentMethod = (filters?: FinancialFilters) =>
  financialRequest<{ items: AnalyticsBucketItem[] }>('/analytics/revenue-by-payment-method', filters)

export const getTopStudents = (filters?: FinancialFilters) =>
  financialRequest<{ items: TopStudentItem[]; limit: number }>('/analytics/top-students', filters)

export const getTopBanks = (filters?: FinancialFilters) =>
  financialRequest<{ items: TopBankItem[]; limit: number }>('/analytics/top-banks', filters)

export const getTopCurrencies = (filters?: FinancialFilters) =>
  financialRequest<{ items: TopCurrencyItem[]; limit: number }>('/analytics/top-currencies', filters)
