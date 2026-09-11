export type TeacherSalaryListState = {
  page: number
  month: string
  salary_status: '' | 'pending' | 'paid'
  payment_method_type: '' | 'wallet' | 'insta' | 'bank'
  search: string
}

const STORAGE_KEY = 'admin:teacher-salary:list-state'

export function getDefaultTeacherSalaryMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function readTeacherSalaryListState(): Partial<TeacherSalaryListState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<TeacherSalaryListState>
  } catch {
    return {}
  }
}

export function writeTeacherSalaryListState(state: TeacherSalaryListState): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / private mode
  }
}
