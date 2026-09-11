'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { useWebsiteStore } from '@/store/useWebsiteStore'
import { Check, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface PackagesListProps {
  showTitle?: boolean
  headingLevel?: 'h1' | 'h2'
  carousel?: boolean // Enable carousel mode
}

export default function PackagesList({ showTitle = true, headingLevel = 'h1', carousel = false }: PackagesListProps = {}) {
  const { t } = useTranslation()
  const { packages, isLoading, fetchWebsiteData } = useWebsiteStore()
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

  // Remove duplicates based on id using useMemo to prevent recalculation
  // MUST be called before any early returns (React hooks rule)
  const uniquePackages = useMemo(() => {
    const unique = Array.from(
      new Map(packages.map((pkg) => [pkg.id, pkg])).values()
    )
    return unique
  }, [packages])

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

  if (uniquePackages.length === 0) {
    return (
      <div className="text-center py-12 text-primary-600">
        {t('packages.noPackages') || 'لا توجد باقات متاحة حالياً'}
      </div>
    )
  }

  const HeadingTag = headingLevel

  return (
    <>
      {showTitle && (
        <div className="text-center mb-12">
          <HeadingTag className="section-title">{t('packages.title')}</HeadingTag>
          <p className="section-subtitle">{t('packages.subtitle')}</p>
          <div className="mt-0">
            <Link 
              href="/packages"
              className="inline-flex items-center  gap-1.5 text-accent-green hover:text-primary-600 font-medium transition-all group text-sm sm:text-base relative pb-0.5"
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
              el: '.swiper-pagination-custom-packages',
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
            {uniquePackages.map((pkg) => {
        const name = currentLocale === 'en' && pkg.name_en ? pkg.name_en : (pkg.name_ar || pkg.name)
        const priceLabel = currentLocale === 'en' && pkg.price_en ? pkg.price_en : (pkg.price_ar || pkg.price_label || `${pkg.price} جنيه`)
        const features = currentLocale === 'en' && pkg.features_en ? pkg.features_en : (pkg.features_ar || pkg.features || [])

              return (
                <SwiperSlide key={`package-${pkg.id}`} className="!h-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={`relative bg-white p-8 rounded-xl border-2 h-full ${
                      pkg.is_popular
                        ? 'border-accent-green scale-105 shadow-2xl ring-4 ring-accent-green/20'
                        : 'border-primary-300 hover:border-primary-400 shadow-lg'
                    } transition-all duration-300 hover:shadow-2xl`}
                  >
                    {pkg.is_popular && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-accent-green to-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                          {currentLocale === 'en' ? 'Most Popular' : 'الأكثر شعبية'}
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-primary-900 mb-4">{name}</h3>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent">{priceLabel}</span>
                        {!pkg.price_ar && !pkg.price_en && <span className="text-primary-600">{currentLocale === 'en' ? '/month' : 'جنيه/شهرياً'}</span>}
                      </div>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {(Array.isArray(features) ? features : []).map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-gradient-to-br from-accent-green to-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-primary-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/register"
                      className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                        pkg.is_popular
                          ? 'bg-gradient-to-r from-accent-green to-primary-500 hover:from-primary-500 hover:to-accent-green text-white shadow-lg hover:shadow-xl'
                          : 'bg-primary-100 hover:bg-primary-200 text-primary-900 border-2 border-primary-400'
                      }`}
                    >
                      {t('packages.select')}
                    </Link>
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
            className="swiper-button-prev-custom-packages absolute right-[-38px] top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border-2 border-primary-200 hover:border-primary-400 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="swiper-button-next-custom-packages absolute left-[-38px] top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border-2 border-primary-200 hover:border-primary-400 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <ChevronLeft className="w-6 h-6 text-primary-600" />
          </button>

          {/* Custom Pagination */}
          <div className="swiper-pagination-custom-packages flex items-center justify-center gap-2 mt-8"></div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {uniquePackages.map((pkg) => {
            const name = currentLocale === 'en' && pkg.name_en ? pkg.name_en : (pkg.name_ar || pkg.name)
            const priceLabel = currentLocale === 'en' && pkg.price_en ? pkg.price_en : (pkg.price_ar || pkg.price_label || `${pkg.price} جنيه`)
            const features = currentLocale === 'en' && pkg.features_en ? pkg.features_en : (pkg.features_ar || pkg.features || [])

            return (
              <motion.div
                key={pkg.id}
                variants={itemVariants}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative bg-white p-8 rounded-xl border-2 ${
                  pkg.is_popular
                    ? 'border-accent-green scale-105 shadow-2xl ring-4 ring-accent-green/20'
                    : 'border-primary-300 hover:border-primary-400 shadow-lg'
                } transition-all duration-300 hover:shadow-2xl`}
              >
                {pkg.is_popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-accent-green to-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      {currentLocale === 'en' ? 'Most Popular' : 'الأكثر شعبية'}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-primary-900 mb-4">{name}</h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent">{priceLabel}</span>
                    {!pkg.price_ar && !pkg.price_en && <span className="text-primary-600">{currentLocale === 'en' ? '/month' : 'جنيه/شهرياً'}</span>}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {(Array.isArray(features) ? features : []).map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-gradient-to-br from-accent-green to-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-primary-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    pkg.is_popular
                      ? 'bg-gradient-to-r from-accent-green to-primary-500 hover:from-primary-500 hover:to-accent-green text-white shadow-lg hover:shadow-xl'
                      : 'bg-primary-100 hover:bg-primary-200 text-primary-900 border-2 border-primary-400'
                  }`}
                >
                  {t('packages.select')}
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </>
  )
}
