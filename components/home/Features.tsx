'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useWebsiteStore } from '@/store/useWebsiteStore'
import * as websiteAPI from '@/lib/api/website'
import { Users, Clock, Heart, BookOpen, GraduationCap, UserCheck, Award, Star, Sparkles, MessageCircle, Calendar, Shield, Zap } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

// Icon mapping
const iconMap: Record<string, JSX.Element> = {
  teacher: <Users className="w-8 h-8" />,
  clock: <Clock className="w-8 h-8" />,
  heart: <Heart className="w-8 h-8" />,
  book: <BookOpen className="w-8 h-8" />,
  graduation: <GraduationCap className="w-8 h-8" />,
  user: <UserCheck className="w-8 h-8" />,
  award: <Award className="w-8 h-8" />,
  star: <Star className="w-8 h-8" />,
  sparkles: <Sparkles className="w-8 h-8" />,
  message: <MessageCircle className="w-8 h-8" />,
  calendar: <Calendar className="w-8 h-8" />,
  shield: <Shield className="w-8 h-8" />,
  zap: <Zap className="w-8 h-8" />,
}

export default function Features() {
  const { t } = useTranslation()
  const { features, isLoading, fetchWebsiteData } = useWebsiteStore()
  const prefersReducedMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    fetchWebsiteData()
  }, [fetchWebsiteData])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get active features sorted by order
  const activeFeatures = features
    .filter(f => f.is_active)
    .sort((a, b) => a.order - b.order)
    .slice(0, 6) // Limit to 6 features

  // Fallback to translation if no API features
  const fallbackFeatures = [
    { id: 1, title_ar: t('features.feature1.title'), title_en: '', description_ar: t('features.feature1.description'), description_en: '', icon: 'teacher', order: 1, is_active: true },
    { id: 2, title_ar: t('features.feature2.title'), title_en: '', description_ar: t('features.feature2.description'), description_en: '', icon: 'clock', order: 2, is_active: true },
    { id: 3, title_ar: t('features.feature3.title'), title_en: '', description_ar: t('features.feature3.description'), description_en: '', icon: 'heart', order: 3, is_active: true },
    { id: 4, title_ar: t('features.feature4.title'), title_en: '', description_ar: t('features.feature4.description'), description_en: '', icon: 'book', order: 4, is_active: true },
    { id: 5, title_ar: t('features.feature5.title'), title_en: '', description_ar: t('features.feature5.description'), description_en: '', icon: 'graduation', order: 5, is_active: true },
    { id: 6, title_ar: t('features.feature6.title'), title_en: '', description_ar: t('features.feature6.description'), description_en: '', icon: 'user', order: 6, is_active: true },
  ] as websiteAPI.WebsiteFeature[]
  
  const displayFeatures = activeFeatures.length > 0 ? activeFeatures : fallbackFeatures

  const shouldReduceMotion = isMobile || prefersReducedMotion

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: shouldReduceMotion ? { duration: 0.3 } : {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30, scale: shouldReduceMotion ? 1 : 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  }

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container-custom">
        <h2 className="section-title">{t('features.title')}</h2>
        <p className="section-subtitle">{t('features.subtitle')}</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {displayFeatures.map((feature) => {
              const currentLocale = typeof window !== 'undefined' ? (localStorage.getItem('locale') || 'ar') : 'ar'
              const title = currentLocale === 'en' && feature.title_en ? feature.title_en : (feature.title_ar || feature.title)
              const description = currentLocale === 'en' && feature.description_en ? feature.description_en : (feature.description_ar || feature.description)
              const icon = feature.icon ? (iconMap[feature.icon] || <Users className="w-8 h-8" />) : <Users className="w-8 h-8" />
              
              return (
                <motion.div
                  key={feature.id}
                  variants={itemVariants}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  whileHover={shouldReduceMotion ? {} : { y: -8, scale: 1.02 }}
                  className="bg-white p-6 rounded-xl hover:shadow-2xl transition-all duration-300 border-2 border-primary-200 hover:border-accent-green group"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-green/20 via-primary-300/30 to-accent-green/40 rounded-full flex items-center justify-center mb-4 group-hover:from-accent-green/30 group-hover:to-primary-400/40 transition-all duration-300 shadow-lg group-hover:scale-110">
                    <div className="text-accent-green group-hover:text-primary-600 transition-colors">{icon}</div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-primary-900">{title}</h3>
                  <p className="text-primary-700 leading-relaxed">{description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </section>
  )
}
