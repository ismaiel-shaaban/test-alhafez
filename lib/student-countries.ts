/** Countries available when adding/editing students — shared with WhatsApp normalization. */
export const STUDENT_COUNTRY_OPTIONS = [
  { value: 'الأردن', dialCode: '962' },
  { value: 'مصر', dialCode: '20' },
  { value: 'السعودية', dialCode: '966' },
  { value: 'الإمارات', dialCode: '971' },
  { value: 'قطر', dialCode: '974' },
  { value: 'الكويت', dialCode: '965' },
  { value: 'فلسطين', dialCode: '970' },
  { value: 'أمريكا', dialCode: '1' },
  { value: 'كندا', dialCode: '1' },
  { value: 'ألمانيا', dialCode: '49' },
  { value: 'أجنبي', dialCode: null },
] as const

export type StudentCountryValue = (typeof STUDENT_COUNTRY_OPTIONS)[number]['value']

const DIAL_CODE_BY_COUNTRY: Record<string, string> = Object.fromEntries(
  STUDENT_COUNTRY_OPTIONS.filter((option) => option.dialCode).map((option) => [
    option.value,
    option.dialCode as string,
  ])
)

const ALL_STUDENT_DIAL_CODES: string[] = STUDENT_COUNTRY_OPTIONS.flatMap((option) =>
  option.dialCode ? [option.dialCode] : []
)

/** Dial code for a student country selected in admin (null for أجنبي / unknown). */
export function getStudentCountryDialCode(country?: string | null): string | null {
  if (!country?.trim()) return null
  const trimmed = country.trim()
  if (trimmed === 'أجنبي') return null
  return DIAL_CODE_BY_COUNTRY[trimmed] ?? null
}

export function phoneAlreadyHasInternationalPrefix(digits: string): boolean {
  return ALL_STUDENT_DIAL_CODES.some(
    (code) => digits.startsWith(code) && digits.length >= code.length + 7
  )
}
