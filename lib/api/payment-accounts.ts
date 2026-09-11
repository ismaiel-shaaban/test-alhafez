import { apiRequest, Pagination } from '../api-client'

export type PaymentAccountType = 'bank' | 'wallet' | 'insta'

export interface PaymentAccount {
  id: number
  title: string
  type: PaymentAccountType
  type_label?: string
  phone?: string | null
  account_number?: string | null
  bank_name?: string | null
  notes?: string | null
  is_active: boolean
  students_count?: number
  created_at?: string
  updated_at?: string
}

export interface PaymentAccountPayload {
  title: string
  type?: PaymentAccountType
  phone?: string
  account_number?: string
  bank_name?: string
  notes?: string
  is_active?: boolean
}

export interface PaymentAccountsFilters {
  is_active?: boolean | 0 | 1
  per_page?: number
  page?: number
}

export interface PaymentAccountsListResponse {
  payment_accounts: PaymentAccount[]
  pagination?: Pagination
}

export const PAYMENT_ACCOUNT_TYPE_LABELS: Record<PaymentAccountType, string> = {
  bank: 'بنك',
  wallet: 'محفظة',
  insta: 'انستا باي',
}

export function formatPaymentAccountOption(account: PaymentAccount): string {
  const typeLabel =
    account.bank_name ||
    account.type_label ||
    PAYMENT_ACCOUNT_TYPE_LABELS[account.type] ||
    account.type
  return typeLabel ? `${account.title} (${typeLabel})` : account.title
}

export function formatPaymentAccountCopyText(account: PaymentAccount): string {
  const lines: string[] = [`اسم صاحب الحساب: ${account.title}`]
  const typeLabel =
    account.bank_name ||
    account.type_label ||
    (account.type ? PAYMENT_ACCOUNT_TYPE_LABELS[account.type] : '')
  if (typeLabel) lines.push(`نوع الحساب: ${typeLabel}`)
  if (account.account_number) lines.push(`رقم الحساب: ${account.account_number}`)
  if (account.phone) lines.push(`رقم التحويل: ${account.phone}`)
  lines.push(`ملاحظات: ${account.notes?.trim() || '—'}`)
  return lines.join('\n')
}

export async function copyPaymentAccountDetails(account: PaymentAccount): Promise<boolean> {
  const text = formatPaymentAccountCopyText(account)
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    } catch {
      return false
    }
  }
}

export const listPaymentAccounts = async (
  filters: PaymentAccountsFilters = {},
  locale?: string
): Promise<PaymentAccountsListResponse> => {
  const params = new URLSearchParams()
  if (filters.is_active !== undefined) {
    params.append('is_active', filters.is_active === true || filters.is_active === 1 ? '1' : '0')
  }
  if (filters.per_page) params.append('per_page', String(filters.per_page))
  if (filters.page) params.append('page', String(filters.page))
  const query = params.toString()
  const data = await apiRequest<PaymentAccountsListResponse | PaymentAccount[]>(
    `/api/payment-accounts${query ? `?${query}` : ''}`,
    { locale }
  )
  if (Array.isArray(data)) {
    return { payment_accounts: data }
  }
  return {
    payment_accounts: data.payment_accounts ?? [],
    pagination: data.pagination,
  }
}

export const getPaymentAccount = async (id: number, locale?: string): Promise<PaymentAccount> => {
  return apiRequest<PaymentAccount>(`/api/payment-accounts/${id}`, { locale })
}

export const createPaymentAccount = async (body: PaymentAccountPayload): Promise<PaymentAccount> => {
  return apiRequest<PaymentAccount>('/api/payment-accounts', {
    method: 'POST',
    body,
  })
}

export const updatePaymentAccount = async (
  id: number,
  body: Partial<PaymentAccountPayload>
): Promise<PaymentAccount> => {
  return apiRequest<PaymentAccount>(`/api/payment-accounts/${id}`, {
    method: 'POST',
    body,
  })
}

export const deletePaymentAccount = async (id: number): Promise<void> => {
  return apiRequest(`/api/payment-accounts/${id}`, {
    method: 'DELETE',
  })
}
