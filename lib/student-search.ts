export function sanitizeStudentPhoneInput(value: string): string {
  return value.replace(/\D/g, '')
}

export function isPhoneLikeSearch(search: string): boolean {
  return /^[\d\s+\-().]+$/.test(search.trim())
}

/** If query looks like a phone number, strip spaces/symbols; otherwise keep name search as-is. */
export function normalizeStudentSearchQuery(search: string): string {
  const trimmed = search.trim()
  if (!trimmed) return ''

  if (isPhoneLikeSearch(trimmed)) {
    return trimmed.replace(/\D/g, '')
  }

  return trimmed
}

export function studentMatchesSearch(
  student: {
    name: string
    email?: string | null
    phone?: string | null
    package?: { name: string } | null
    teacher?: { name: string } | null
  },
  searchTerm: string
): boolean {
  const trimmed = searchTerm.trim()
  if (!trimmed) return true

  if (isPhoneLikeSearch(trimmed)) {
    const query = normalizeStudentSearchQuery(trimmed)
    const phoneDigits = (student.phone || '').replace(/\D/g, '')
    return phoneDigits.includes(query)
  }

  const search = trimmed.toLowerCase()
  return (
    student.name.toLowerCase().includes(search) ||
    student.email?.toLowerCase().includes(search) ||
    student.phone?.toLowerCase().includes(search) ||
    student.package?.name.toLowerCase().includes(search) ||
    student.teacher?.name.toLowerCase().includes(search) ||
    false
  )
}