'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import { useTranslation as useI18nTranslation, loadTranslations, subscribeToTranslations } from '@/lib/i18n'

export function useTranslation() {
  const { locale } = useLocale()
  const [, forceUpdate] = useState({})
  const { t } = useI18nTranslation(locale)

  // Ensure translations are loaded when locale changes
  useEffect(() => {
    let mounted = true
    
    // Load translations immediately
    loadTranslations(locale).catch(() => {})
    
    // Subscribe to translation updates to trigger re-renders
    const unsubscribe = subscribeToTranslations(() => {
      if (mounted) {
        forceUpdate({})
      }
    })
    
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [locale])

  return { t, locale }
}
