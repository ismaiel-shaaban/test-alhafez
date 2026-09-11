/** Currency codes used across admin — Arabic labels for display. */
export const CURRENCY_LABELS: Record<string, string> = {
  EGP: 'جنيه مصري',
  SAR: 'ريال سعودي',
  JOD: 'دينار أردني',
  AED: 'درهم إماراتي',
  QAR: 'ريال قطري',
  KWD: 'دينار كويتي',
  ILS: 'شيكل',
  USD: 'دولار أمريكي',
  EUR: 'يورو',
}

export const CURRENCY_CODES = Object.keys(CURRENCY_LABELS) as (keyof typeof CURRENCY_LABELS)[]

export function getCurrencyLabel(code?: string | null): string {
  if (!code?.trim()) return '—'
  return CURRENCY_LABELS[code.trim().toUpperCase()] ?? code.trim().toUpperCase()
}

export function getCurrencyOptionLabel(code: string): string {
  const upper = code.trim().toUpperCase()
  const label = CURRENCY_LABELS[upper]
  return label ? `${label} (${upper})` : upper
}
