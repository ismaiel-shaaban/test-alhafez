import {
  getStudentCountryDialCode,
  phoneAlreadyHasInternationalPrefix,
} from './student-countries'

function cleanPhoneDigits(phone: string): string {
  let cleaned = phone.trim().replace(/[\s\-().]/g, '')

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1)
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2)
  }

  return cleaned.replace(/\D/g, '')
}

function normalizeWithDialCode(digits: string, dialCode: string): string {
  if (digits.startsWith(dialCode) && digits.length > dialCode.length + 6) {
    return digits
  }

  if (phoneAlreadyHasInternationalPrefix(digits)) {
    return digits
  }

  if (digits.startsWith('0')) {
    return `${dialCode}${digits.slice(1)}`
  }

  // US / Canada: 10-digit local number
  if (dialCode === '1' && digits.length === 10) {
    return `${dialCode}${digits}`
  }

  return `${dialCode}${digits}`
}

/** Guess dial code when country is missing (أجنبي or empty). */
function inferDialCodeFromLocalNumber(localDigits: string): string | null {
  if (!localDigits) return null

  if (localDigits.length === 10 && localDigits.startsWith('1')) {
    return '20'
  }

  if (localDigits.length === 9 && localDigits.startsWith('7')) {
    return '962'
  }

  if (localDigits.length === 9 && localDigits.startsWith('5')) {
    return '966'
  }

  if (localDigits.length === 8 && /^[36]/.test(localDigits)) {
    return '974'
  }

  return null
}

/**
 * Normalize phone for wa.me using the student's country from admin when available.
 * Supports all countries in the add-student form (الأردن، مصر، السعودية، …).
 */
export function normalizePhoneForWhatsApp(
  phone: string,
  country?: string | null
): string | null {
  const digits = cleanPhoneDigits(phone)
  if (digits.length < 8) return null

  const dialCode = getStudentCountryDialCode(country)

  if (dialCode) {
    return normalizeWithDialCode(digits, dialCode)
  }

  // Already international (+ / 00 cleaned, or long enough with known prefix)
  if (phoneAlreadyHasInternationalPrefix(digits)) {
    return digits
  }

  if (digits.length >= 11 && !digits.startsWith('0')) {
    return digits
  }

  const localDigits = digits.startsWith('0') ? digits.slice(1) : digits
  const inferred = inferDialCodeFromLocalNumber(localDigits)
  if (inferred) {
    return `${inferred}${localDigits}`
  }

  return null
}

export function getWhatsAppUrl(phone: string, country?: string | null): string | null {
  const normalized = normalizePhoneForWhatsApp(phone, country)
  if (!normalized) return null
  return `https://wa.me/${normalized}`
}
