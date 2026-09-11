'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loadTranslations } from '@/lib/i18n'

type Locale = 'ar' | 'en'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

// Get initial locale synchronously from localStorage
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ar'
  const savedLocale = localStorage.getItem('locale') as Locale | null
  return (savedLocale === 'ar' || savedLocale === 'en') ? savedLocale : 'ar'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  useEffect(() => {
    // Update document attributes on mount
    const initialLocale = getInitialLocale()
    updateDocumentAttributes(initialLocale)
    
    // Load translations for the initial locale immediately
    loadTranslations(initialLocale).catch(() => {})
    // Also pre-load the other locale
    const otherLocale = initialLocale === 'ar' ? 'en' : 'ar'
    loadTranslations(otherLocale).catch(() => {})
  }, [])

  const updateDocumentAttributes = (newLocale: Locale) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
    }
  }

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    updateDocumentAttributes(newLocale)
    // Load translations when locale changes
    loadTranslations(newLocale).catch(() => {})
  }

  const toggleLocale = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    setLocale(newLocale)
  }

  useEffect(() => {
    updateDocumentAttributes(locale)
  }, [locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
