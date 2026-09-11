import { apiRequest, Pagination } from '../api-client'

// Expense interfaces
export interface Expense {
  id: number
  month: string // YYYY-MM
  amount: number
  description: string
  created_at?: string
  updated_at?: string
}

export interface ExpensesResponse {
  expenses: Expense[]
  pagination: Pagination
}

export interface CreateExpenseRequest {
  month: string // YYYY-MM
  amount: number
  description: string
}

export interface UpdateExpenseRequest {
  month?: string // YYYY-MM
  amount?: number
  description?: string
}

// Income interfaces
export interface Income {
  id: number
  month: string // YYYY-MM
  amount: number
  description: string
  created_at?: string
  updated_at?: string
}

export interface IncomesResponse {
  incomes: Income[]
  pagination: Pagination
}

export interface CreateIncomeRequest {
  month: string // YYYY-MM
  amount: number
  description: string
}

export interface UpdateIncomeRequest {
  month?: string // YYYY-MM
  amount?: number
  description?: string
}

// Profit interface
export interface Profit {
  total_income: number
  total_expense: number
  net_profit: number
  income_count: number
  expense_count: number
  filters?: any[]
}

// Expenses API
export const getExpenses = async (
  params?: {
    month?: string
    month_from?: string
    month_to?: string
    page?: number
    per_page?: number
  },
  locale?: string
): Promise<ExpensesResponse> => {
  const queryParams = new URLSearchParams()
  if (params?.month) queryParams.append('month', params.month)
  if (params?.month_from) queryParams.append('month_from', params.month_from)
  if (params?.month_to) queryParams.append('month_to', params.month_to)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString())

  const endpoint = `/api/expenses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  return apiRequest<ExpensesResponse>(endpoint, { locale })
}

export const getExpense = async (
  id: number,
  locale?: string
): Promise<Expense> => {
  return apiRequest<Expense>(`/api/expenses/${id}`, { locale })
}

export const createExpense = async (
  data: CreateExpenseRequest,
  locale?: string
): Promise<Expense> => {
  return apiRequest<Expense>('/api/expenses', {
    method: 'POST',
    body: data,
    locale,
  })
}

export const updateExpense = async (
  id: number,
  data: UpdateExpenseRequest,
  locale?: string
): Promise<Expense> => {
  return apiRequest<Expense>(`/api/expenses/${id}`, {
    method: 'PUT',
    body: data,
    locale,
  })
}

export const deleteExpense = async (
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest<void>(`/api/expenses/${id}`, {
    method: 'DELETE',
    locale,
  })
}

// Incomes API
export const getIncomes = async (
  params?: {
    month?: string
    month_from?: string
    month_to?: string
    page?: number
    per_page?: number
  },
  locale?: string
): Promise<IncomesResponse> => {
  const queryParams = new URLSearchParams()
  if (params?.month) queryParams.append('month', params.month)
  if (params?.month_from) queryParams.append('month_from', params.month_from)
  if (params?.month_to) queryParams.append('month_to', params.month_to)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString())

  const endpoint = `/api/incomes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  return apiRequest<IncomesResponse>(endpoint, { locale })
}

export const getIncome = async (
  id: number,
  locale?: string
): Promise<Income> => {
  return apiRequest<Income>(`/api/incomes/${id}`, { locale })
}

export const createIncome = async (
  data: CreateIncomeRequest,
  locale?: string
): Promise<Income> => {
  return apiRequest<Income>('/api/incomes', {
    method: 'POST',
    body: data,
    locale,
  })
}

export const updateIncome = async (
  id: number,
  data: UpdateIncomeRequest,
  locale?: string
): Promise<Income> => {
  return apiRequest<Income>(`/api/incomes/${id}`, {
    method: 'PUT',
    body: data,
    locale,
  })
}

export const deleteIncome = async (
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest<void>(`/api/incomes/${id}`, {
    method: 'DELETE',
    locale,
  })
}

// Profit API
export const getProfit = async (
  params?: {
    month?: string
    month_from?: string
    month_to?: string
  },
  locale?: string
): Promise<Profit> => {
  const queryParams = new URLSearchParams()
  if (params?.month) queryParams.append('month', params.month)
  if (params?.month_from) queryParams.append('month_from', params.month_from)
  if (params?.month_to) queryParams.append('month_to', params.month_to)

  const endpoint = `/api/profit${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  return apiRequest<Profit>(endpoint, { locale })
}
