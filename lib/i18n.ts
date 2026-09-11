

type Locale = 'ar' | 'en'

// Load translations synchronously for server/client compatibility
let translations: Record<Locale, any> = {} as any

// Track loading state for client-side
let loadingPromises: Record<Locale, Promise<any> | null> = {
  ar: null,
  en: null,
}

// Callbacks to notify when translations are loaded (for reactivity)
let translationCallbacks: Set<() => void> = new Set()

if (typeof window === 'undefined') {
  // Server-side
  try {
    const fs = require('fs')
    const path = require('path')
    const arPath = path.join(process.cwd(), 'public', 'locales', 'ar', 'common.json')
    const enPath = path.join(process.cwd(), 'public', 'locales', 'en', 'common.json')
    translations.ar = JSON.parse(fs.readFileSync(arPath, 'utf8'))
    translations.en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
  } catch (e) {
    console.error('Error loading translations:', e)
  }
} else {
  // Client-side - will be populated on first use
}

export async function loadTranslations(locale: Locale) {
  // If already loaded, return immediately
  if (translations[locale]) return translations[locale]
  
  // If already loading, return the existing promise
  if (loadingPromises[locale]) {
    return loadingPromises[locale]
  }
  
  // Start loading
  const loadPromise = (async () => {
    try {
      const response = await fetch(`/locales/${locale}/common.json`)
      translations[locale] = await response.json()
      // Notify all callbacks that translations have been loaded
      translationCallbacks.forEach(cb => cb())
      return translations[locale]
    } catch (e) {
      console.error('Error loading translations:', e)
      // Fallback to Arabic
      if (!translations.ar) {
        try {
          const response = await fetch('/locales/ar/common.json')
          translations.ar = await response.json()
          translationCallbacks.forEach(cb => cb())
        } catch {}
      }
      return translations.ar || {}
    } finally {
      loadingPromises[locale] = null
    }
  })()
  
  loadingPromises[locale] = loadPromise
  return loadPromise
}

// Pre-load translations on client based on saved locale
if (typeof window !== 'undefined') {
  // Get saved locale or default to Arabic
  const savedLocale = localStorage.getItem('locale') as Locale | null
  const initialLocale = (savedLocale === 'ar' || savedLocale === 'en') ? savedLocale : 'ar'
  
  // Load translations for the initial locale immediately
  loadTranslations(initialLocale).catch(() => {})
  // Also pre-load the other locale
  const otherLocale = initialLocale === 'ar' ? 'en' : 'ar'
  loadTranslations(otherLocale).catch(() => {})
}

// Hook to subscribe to translation updates (for React components)
export function subscribeToTranslations(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  translationCallbacks.add(callback)
  return () => {
    translationCallbacks.delete(callback)
  }
}

export function useTranslation(locale: Locale = 'ar') {
  // This is a non-reactive hook - it just returns the translation function
  // Reactivity is handled by the useTranslation hook in hooks/useTranslation.ts
  const t = (key: string, options?: { returnObjects?: boolean }): any => {
    const keys = key.split('.')
    let value: any = translations[locale] || translations.ar || {}

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) {
        // Fallback to Arabic if translation is missing
        value = translations.ar || {}
        for (const fallbackKey of keys) {
          value = value?.[fallbackKey]
        }
        break
      }
    }

    // Handle returnObjects option
    if (options?.returnObjects) {
      if (Array.isArray(value)) {
        return value
      }
      if (typeof value === 'object' && value !== null) {
        return value
      }
      // If returnObjects is true but value is not an object/array, return empty array for safety
      return []
    }

    return value ?? key
  }

  return { t }
}

// Server-side helper to get translations object directly
export function getTranslations(locale: Locale = 'ar'): any {
  return translations[locale] || translations.ar || {}
}
