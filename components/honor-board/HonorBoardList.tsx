'use client'

import { useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useWebsiteStore } from '@/store/useWebsiteStore'
import { Trophy, Star } from 'lucide-react'
import Link from 'next/link'

export default function HonorBoardList() {
  const { t } = useTranslation()
  const { honorBoards, isLoadingHonorBoards, fetchHonorBoards } = useWebsiteStore()

  useEffect(() => {
    fetchHonorBoards()
  }, [fetchHonorBoards])

  const currentLocale = typeof window !== 'undefined' ? (localStorage.getItem('locale') || 'ar') : 'ar'

  if (isLoadingHonorBoards) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (honorBoards.length === 0) {
    return (
      <div className="text-center py-12 text-primary-600">
        {t('honorBoard.noEntries') || 'لا توجد إدخالات في لوحة الشرف حالياً'}
      </div>
    )
  }

  return (
    <>
      <div className="text-center mb-12">
        <h1 className="section-title">{t('honorBoard.title')}</h1>
        <p className="section-subtitle">{t('honorBoard.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {honorBoards.map((entry, index) => {
        const level = currentLocale === 'en' && entry.level_en ? entry.level_en : (entry.level_ar || entry.level)
        const achievement = currentLocale === 'en' && entry.achievement_en ? entry.achievement_en : (entry.achievement_ar || entry.achievement)

        return (
          <Link
            key={entry.id}
            href={`/honor-board/${entry.id}`}
            className="block"
          >
            <div className="bg-white p-6 rounded-xl border-2 border-primary-200 hover:border-primary-400 transition-all duration-300 relative shadow-lg hover:shadow-2xl transform hover:-translate-y-1 cursor-pointer">
              {index < 3 && (
                <div className="absolute -top-3 -right-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent-gold to-accent-gold-light rounded-full flex items-center justify-center shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-300/30 via-accent-green/20 to-primary-400/30 rounded-full flex items-center justify-center shadow-md">
                  <Star className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary-900 mb-2">{entry.student?.name || 'طالب'}</h3>
                  <span className="text-accent-green text-sm font-semibold">{level}</span>
                </div>
              </div>
              <p className="text-primary-700 font-medium">{achievement}</p>
              {entry.certificate_images && entry.certificate_images.length > 0 && (
                <p className="text-xs text-primary-600 mt-2">
                  {currentLocale === 'en' ? `${entry.certificate_images.length} certificates` : `${entry.certificate_images.length} شهادة`}
                </p>
              )}
            </div>
          </Link>
        )
      })}
      </div>
    </>
  )
}
