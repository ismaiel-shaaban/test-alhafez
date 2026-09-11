'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { useWebsiteStore } from '@/store/useWebsiteStore'
import { Star, Quote, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface TestimonialsListProps {
  showTitle?: boolean
  headingLevel?: 'h1' | 'h2'
  carousel?: boolean // Enable carousel mode
}

export default function TestimonialsList({ showTitle = true, headingLevel = 'h1', carousel = false }: TestimonialsListProps = {}) {
  const { t } = useTranslation()
  const { reviews, isLoading, fetchWebsiteData } = useWebsiteStore()
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-primary-600">
        {t('testimonials.noReviews') || 'لا توجد آراء متاحة حالياً'}
      </div>
    )
  }

  const HeadingTag = headingLevel

  return (
    <>
      {showTitle && (
        <div className="text-center mb-12">
          <HeadingTag className="section-title">{t('testimonials.title')}</HeadingTag>
          <p className="section-subtitle">{t('testimonials.subtitle')}</p>
          <div className="mt-4">
            <Link 
              href="/testimonials"
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
              el: '.swiper-pagination-custom',
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
            {reviews.map((review) => {
              const reviewText = currentLocale === 'en' && review.review_en ? review.review_en : (review.review_ar || review.review)
              const packageName = review.package?.name || '-'

              return (
                <SwiperSlide key={review.id} className="!h-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white p-6 rounded-xl border-2 border-primary-200 hover:border-primary-400 transition-all duration-300 shadow-lg hover:shadow-2xl relative h-full flex flex-col"
                  >
                    <div className="absolute top-4 left-4 text-primary-300/20">
                      <Quote className="w-12 h-12" />
                    </div>
                    
                    {/* Media File Display */}
                    {review.media_file && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        {/\.(mp4|mov|avi|webm)$/i.test(review.media_file) ? (
                          <video
                            src={review.media_file}
                            className="w-full h-48 object-cover rounded-lg"
                            controls
                            preload="none"
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : /\.(jpeg|jpg|png|gif|webp)$/i.test(review.media_file) ? (
                          <img
                            src={review.media_file}
                            alt="Review media"
                            className="w-full h-48 object-cover rounded-lg"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : null}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 mb-4 mt-2">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-accent-gold text-accent-gold" />
                      ))}
                    </div>
                    <p className="text-primary-700 mb-4 leading-relaxed relative z-10 flex-grow">{reviewText}</p>
                    <div className="border-t border-primary-200 pt-4 mt-auto">
                      <h4 className="font-bold text-primary-900 mb-1">{review.student?.name || 'طالب'}</h4>
                      <p className="text-sm text-primary-600">{packageName}</p>
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
            className="swiper-button-prev-custom absolute right-[-38px] top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border-2 border-primary-200 hover:border-primary-400 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="swiper-button-next-custom absolute left-[-38px] top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border-2 border-primary-200 hover:border-primary-400 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <ChevronLeft className="w-6 h-6 text-primary-600" />
          </button>

          {/* Custom Pagination */}
          <div className="swiper-pagination-custom flex items-center justify-center gap-2 mt-8"></div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {reviews.map((review) => {
            const reviewText = currentLocale === 'en' && review.review_en ? review.review_en : (review.review_ar || review.review)
            const packageName = review.package?.name || '-'

              return (
              <motion.div
                key={review.id}
                variants={itemVariants}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white p-6 rounded-xl border-2 border-primary-200 hover:border-primary-400 transition-all duration-300 shadow-lg hover:shadow-2xl relative h-full flex flex-col"
              >
                <div className="absolute top-4 left-4 text-primary-300/20">
                  <Quote className="w-12 h-12" />
                </div>
                
                {/* Media File Display */}
                {review.media_file && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    {/\.(mp4|mov|avi|webm)$/i.test(review.media_file) ? (
                      <video
                        src={review.media_file}
                        className="w-full h-48 object-cover rounded-lg"
                        controls
                        preload="none"
                        onError={(e) => {
                          const target = e.target as HTMLVideoElement
                          target.style.display = 'none'
                        }}
                      />
                    ) : /\.(jpeg|jpg|png|gif|webp)$/i.test(review.media_file) ? (
                      <img
                        src={review.media_file}
                        alt="Review media"
                        className="w-full h-48 object-cover rounded-lg"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    ) : null}
                  </div>
                )}
                
                <div className="flex items-center gap-1 mb-4 mt-2">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent-gold text-accent-gold" />
                  ))}
                </div>
                <p className="text-primary-700 mb-4 leading-relaxed relative z-10 flex-grow">{reviewText}</p>
                <div className="border-t border-primary-200 pt-4 mt-auto">
                  <h4 className="font-bold text-primary-900 mb-1">{review.student?.name || 'طالب'}</h4>
                  <p className="text-sm text-primary-600">{packageName}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </>
  )
}
