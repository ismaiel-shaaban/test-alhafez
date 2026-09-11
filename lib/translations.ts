type Locale = 'ar' | 'en'

// Load translations based on environment
let translations: Record<Locale, any> = {} as any

if (typeof window === 'undefined') {
  // Server-side: use require
  try {
    const fs = require('fs')
    const path = require('path')
    const arPath = path.join(process.cwd(), 'public', 'locales', 'ar', 'common.json')
    const enPath = path.join(process.cwd(), 'public', 'locales', 'en', 'common.json')
    translations.ar = JSON.parse(fs.readFileSync(arPath, 'utf8'))
    translations.en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
  } catch (e) {
    console.error('Error loading translations:', e)
    // Fallback empty translations
    translations.ar = {}
    translations.en = {}
  }
} else {
  // Client-side - will be loaded via fetch
}

export function getTranslations(locale: Locale = 'ar'): any {
  return translations[locale] || translations.ar || {}
}

export function getTranslation(locale: Locale, key: string): string {
  if (!translations[locale]) {
    translations[locale] = translations.ar || {}
  }
  
  const keys = key.split('.')
  let value: any = translations[locale]

  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) {
      // Fallback to Arabic
      value = translations.ar || {}
      for (const fallbackKey of keys) {
        value = value?.[fallbackKey]
      }
      break
    }
  }

  return value ?? key
}
