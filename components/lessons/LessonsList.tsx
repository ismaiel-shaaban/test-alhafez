'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { useWebsiteStore } from '@/store/useWebsiteStore'
import { Video, Play, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface LessonsListProps {
  showTitle?: boolean
  headingLevel?: 'h1' | 'h2'
  limit?: number // Limit number of lessons to display (for home page)
  carousel?: boolean // Enable carousel mode
}

export default function LessonsList({ showTitle = true, headingLevel = 'h1', limit, carousel = false }: LessonsListProps = {}) {
  const { t } = useTranslation()
  const { lessons, isLoadingLessons, fetchLessons } = useWebsiteStore()
  const swiperRef = useRef<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

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

  // Remove duplicates based on id using useMemo to prevent recalculation
  // MUST be called before any early returns (React hooks rule)
  const uniqueLessons = useMemo(() => {
    const unique = Array.from(
      new Map(lessons.map((lesson) => [lesson.id, lesson])).values()
    )
    return unique
  }, [lessons])
  
  const displayedLessons = useMemo(() => {
    return limit ? uniqueLessons.slice(0, limit) : uniqueLessons
  }, [uniqueLessons, limit])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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

  if (isLoadingLessons) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (uniqueLessons.length === 0 || displayedLessons.length === 0) {
    return (
      <div className="text-center py-12 text-primary-600">
        {t('lessons.noLessons') || 'لا توجد دروس متاحة حالياً'}
      </div>
    )
  }

  const HeadingTag = headingLevel

  return (
    <>
      {showTitle && (
        <div className="text-center mb-12">
          <HeadingTag className="section-title">{t('lessons.title') || 'فيديوهات من الحصص'}</HeadingTag>
          <p className="section-subtitle">{t('lessons.subtitle') || 'شاهد دروسنا المسجلة من الحصص الحية'}</p>
          <div className="mt-0">
            <Link 
              href="/lessons"
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
              el: '.swiper-pagination-custom-lessons',
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
                slidesPerView: 3,
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
            {displayedLessons.map((lesson) => {
          const title = lesson.localized_title || (currentLocale === 'en' && lesson.title_en ? lesson.title_en : (lesson.title_ar || lesson.title))
          const description = lesson.localized_description || (currentLocale === 'en' && lesson.description_en ? lesson.description_en : (lesson.description_ar || lesson.description))

              return (
                <SwiperSlide key={`lesson-${lesson.id}`} className="!h-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white rounded-xl border-2 border-primary-200 hover:border-primary-400 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden h-full"
                  >
                    {/* Video Section */}
                    {lesson.video && (
                      <div className="relative aspect-video bg-gray-900 overflow-hidden rounded-t-xl">
                        <video
                          src={lesson.video}
                          className="w-full h-full object-cover"
                          controls
                          preload="none"
                          playsInline
                          onError={(e) => {
                            const target = e.target as HTMLVideoElement
                            console.error('Video loading error:', lesson.video)
                            target.style.display = 'none'
                            const errorDiv = target.parentElement?.querySelector('.video-error') as HTMLElement
                            if (errorDiv) {
                              errorDiv.style.display = 'flex'
                            }
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                        <div 
                          className="video-error absolute inset-0 bg-gray-900/90 flex items-center justify-center text-white text-center p-4"
                          style={{ display: 'none' }}
                        >
                          <div>
                            <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">فيديو غير متاح</p>
                            <p className="text-xs mt-1 opacity-75">Video unavailable</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Content Section */}
                    <div className="p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-green rounded-lg flex items-center justify-center flex-shrink-0">
                          <Video className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-primary-900 mb-2 line-clamp-2">{title}</h3>
                        </div>
                      </div>
                      <p className="text-primary-700 text-sm leading-relaxed line-clamp-3 mb-4">
                        {description}
                      </p>
                      <Link
                        href={`/lessons#lesson-${lesson.id}`}
                        className="inline-flex items-center gap-2 text-accent-green hover:text-primary-600 font-medium transition-colors text-sm"
                      >
                        <span>{currentLocale === 'en' ? 'Watch Lesson' : 'مشاهدة الدرس'}</span>
                        <Play className="w-4 h-4" />
                      </Link>
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
            className="swiper-button-prev-custom-lessons absolute right-[-38px] top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border-2 border-primary-200 hover:border-primary-400 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="swiper-button-next-custom-lessons absolute left-[-38px] top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border-2 border-primary-200 hover:border-primary-400 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <ChevronLeft className="w-6 h-6 text-primary-600" />
          </button>

          {/* Custom Pagination */}
          <div className="swiper-pagination-custom-lessons flex items-center justify-center gap-2 mt-8"></div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {displayedLessons.map((lesson) => {
            const title = lesson.localized_title || (currentLocale === 'en' && lesson.title_en ? lesson.title_en : (lesson.title_ar || lesson.title))
            const description = lesson.localized_description || (currentLocale === 'en' && lesson.description_en ? lesson.description_en : (lesson.description_ar || lesson.description))

            return (
              <motion.div
                key={lesson.id}
                variants={itemVariants}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-xl border-2 border-primary-200 hover:border-primary-400 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
              >
                {/* Video Section */}
                {lesson.video && (
                  <div className="relative aspect-video bg-gray-900 overflow-hidden rounded-t-xl">
                    <video
                      src={lesson.video}
                      className="w-full h-full object-cover"
                      controls
                      preload="none"
                      playsInline
                      onError={(e) => {
                        const target = e.target as HTMLVideoElement
                        console.error('Video loading error:', lesson.video)
                        target.style.display = 'none'
                        const errorDiv = target.parentElement?.querySelector('.video-error') as HTMLElement
                        if (errorDiv) {
                          errorDiv.style.display = 'flex'
                        }
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div 
                      className="video-error absolute inset-0 bg-gray-900/90 flex items-center justify-center text-white text-center p-4"
                      style={{ display: 'none' }}
                    >
                      <div>
                        <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">فيديو غير متاح</p>
                        <p className="text-xs mt-1 opacity-75">Video unavailable</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Content Section */}
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-green rounded-lg flex items-center justify-center flex-shrink-0">
                      <Video className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-primary-900 mb-2 line-clamp-2">{title}</h3>
                    </div>
                  </div>
                  <p className="text-primary-700 text-sm leading-relaxed line-clamp-3 mb-4">
                    {description}
                  </p>
                  <Link
                    href={`/lessons#lesson-${lesson.id}`}
                    className="inline-flex items-center gap-2 text-accent-green hover:text-primary-600 font-medium transition-colors text-sm"
                  >
                    <span>{currentLocale === 'en' ? 'Watch Lesson' : 'مشاهدة الدرس'}</span>
                    <Play className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </>
  )
}

