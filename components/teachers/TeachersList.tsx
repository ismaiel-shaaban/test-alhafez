'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { useWebsiteStore } from '@/store/useWebsiteStore'
import { User, Award, BookOpen, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface TeachersListProps {
  showTitle?: boolean
  headingLevel?: 'h1' | 'h2'
  limit?: number // Limit number of teachers to display (for home page)
  carousel?: boolean // Enable carousel mode
}

export default function TeachersList({ showTitle = true, headingLevel = 'h1', limit, carousel = false }: TeachersListProps = {}) {
  const { t } = useTranslation()
  const { teachers, isLoading, fetchWebsiteData } = useWebsiteStore()
  const swiperRef = useRef<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    fetchWebsiteData()
  }, [fetchWebsiteData])

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const currentLocale = typeof window !== 'undefined' ? (localStorage.getItem('locale') || 'ar') : 'ar'

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const displayedTeachers = limit ? teachers.slice(0, limit) : teachers

  if (displayedTeachers.length === 0) {
    return (
      <div className="text-center py-12 text-primary-600">
        {t('teachers.noTeachers') || 'لا يوجد معلمون متاحون حالياً'}
      </div>
    )
  }

  const HeadingTag = headingLevel

  return (
    <>
      {showTitle && (
        <div className="text-center mb-12">
          <HeadingTag className="section-title">{t('teachers.title')}</HeadingTag>
          <p className="section-subtitle">{t('teachers.subtitle')}</p>
          <div className="mt-0">
            <Link 
              href="/teachers"
              className="inline-flex items-center gap-1.5 text-accent-green hover:text-primary-600 font-medium transition-all group text-sm sm:text-base relative pb-0.5"
              dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}
            >
              <span className="relative">
                {t('common.seeAll') || 'عرض الكل'}
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-green scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></span>
              </span>
              {currentLocale === 'ar' ? (
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </Link>
          </div>
        </div>
      )}
      {carousel ? (
        <div className="relative max-w-6xl mx-auto">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={32}
            slidesPerView={1}
            slidesPerGroup={1}
            speed={300}
            watchSlidesProgress={true}
            allowSlidePrev={true}
            allowSlideNext={true}
            navigation={false}
            pagination={{
              clickable: true,
              el: '.swiper-pagination-custom-teachers',
              bulletClass: 'swiper-pagination-bullet-custom',
              bulletActiveClass: 'swiper-pagination-bullet-active-custom',
            }}
            autoplay={isMobile ? false : {
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              640: {
                slidesPerView: 1,
                slidesPerGroup: 1,
                spaceBetween: 24,
              },
              768: {
                slidesPerView: 2,
                slidesPerGroup: 1,
                spaceBetween: 32,
              },
              1024: {
                slidesPerView: 4,
                slidesPerGroup: 1,
                spaceBetween: 32,
              },
            }}
            loop={false}
            allowTouchMove={true}
            className="!pb-12"
            dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}
            onSwiper={(swiper) => {
              swiperRef.current = swiper
            }}
          >
            {displayedTeachers.map((teacher) => {
              const name = currentLocale === 'en' && teacher.name_en ? teacher.name_en : (teacher.name_ar || teacher.name)
              const specialization = currentLocale === 'en' && teacher.specialization_en ? teacher.specialization_en : (teacher.specialization_ar || teacher.specialization)
              const experience = `${teacher.experience_years} ${currentLocale === 'en' ? 'years experience' : 'سنة خبرة'}`

              return (
                <SwiperSlide key={teacher.id} className="!h-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white p-6 rounded-xl border-2 border-primary-200 hover:border-primary-400 transition-all duration-300 text-center shadow-lg hover:shadow-2xl h-full"
                  >
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-300/30 via-accent-green/20 to-primary-400/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden relative">
                      {(teacher as any).image ? (
                        <>
                          <img
                            src={(teacher as any).image}
                            alt={name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const fallback = target.nextElementSibling as HTMLElement
                              if (fallback) {
                                fallback.style.display = 'flex'
                              }
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center absolute inset-0" style={{ display: 'none' }}>
                            <User className="w-16 h-16 text-primary-600" />
                          </div>
                        </>
                      ) : (
                        <User className="w-16 h-16 text-primary-600" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-primary-900 mb-2">{name}</h3>
                    <div className="flex items-center justify-center gap-2 text-primary-700 mb-2">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm">{specialization}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-accent-green">
                      <Award className="w-4 h-4" />
                      <span className="text-sm font-semibold">{experience}</span>
                    </div>
                  </motion.div>
                </SwiperSlide>
              )
            })}
          </Swiper>

          {/* Custom Navigation Buttons */}
          <button
            onClick={() => {
              if (swiperRef.current && !swiperRef.current.isBeginning) {
                swiperRef.current.slidePrev()
              }
            }}
            className="swiper-button-prev-custom-teachers absolute right-[-38px] top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border-2 border-primary-200 hover:border-primary-400 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <ChevronRight className="w-6 h-6 text-primary-600" />
          </button>
          <button
            onClick={() => {
              if (swiperRef.current && !swiperRef.current.isEnd) {
                swiperRef.current.slideNext()
              }
            }}
            className="swiper-button-next-custom-teachers absolute left-[-38px] top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border-2 border-primary-200 hover:border-primary-400 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <ChevronLeft className="w-6 h-6 text-primary-600" />
          </button>

          {/* Custom Pagination */}
          <div className="swiper-pagination-custom-teachers flex items-center justify-center gap-2 mt-8"></div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {displayedTeachers.map((teacher) => {
        const name = currentLocale === 'en' && teacher.name_en ? teacher.name_en : (teacher.name_ar || teacher.name)
        const specialization = currentLocale === 'en' && teacher.specialization_en ? teacher.specialization_en : (teacher.specialization_ar || teacher.specialization)
        const experience = `${teacher.experience_years} ${currentLocale === 'en' ? 'years experience' : 'سنة خبرة'}`

        return (
          <motion.div
            key={teacher.id}
            variants={itemVariants}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-white p-6 rounded-xl border-2 border-primary-200 hover:border-primary-400 transition-all duration-300 text-center shadow-lg hover:shadow-2xl"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-primary-300/30 via-accent-green/20 to-primary-400/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden relative">
              {(teacher as any).image ? (
                <>
                  <img
                    src={(teacher as any).image}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) {
                        fallback.style.display = 'flex'
                      }
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center absolute inset-0" style={{ display: 'none' }}>
                    <User className="w-16 h-16 text-primary-600" />
                  </div>
                </>
              ) : (
                <User className="w-16 h-16 text-primary-600" />
              )}
            </div>
            <h3 className="text-xl font-bold text-primary-900 mb-2">{name}</h3>
            <div className="flex items-center justify-center gap-2 text-primary-700 mb-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">{specialization}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-accent-green">
              <Award className="w-4 h-4" />
              <span className="text-sm font-semibold">{experience}</span>
            </div>
          </motion.div>
        )
      })}
        </motion.div>
      )}
    </>
  )
}
