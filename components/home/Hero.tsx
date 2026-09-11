'use client'

import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { MessageCircle, ArrowLeft, Sparkles, BookOpen, Users, Award } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function Hero() {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const [displayedText, setDisplayedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [charIndex, setCharIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  const fullText = t('hero.title')
  // Faster typing on mobile for better performance
  const typingSpeed = isMobile ? 150 : 100
  const deletingSpeed = isMobile ? 75 : 50
  const pauseTime = 2000

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Skip typewriter animation on mobile or if user prefers reduced motion
  useEffect(() => {
    if (isMobile || prefersReducedMotion) {
      setDisplayedText(fullText)
      return
    }

    let timeout: NodeJS.Timeout

    if (!isDeleting && charIndex < fullText.length) {
      // Typing
      timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, charIndex + 1))
        setCharIndex(charIndex + 1)
      }, typingSpeed)
    } else if (isDeleting && charIndex > 0) {
      // Deleting
      timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, charIndex - 1))
        setCharIndex(charIndex - 1)
      }, deletingSpeed)
    } else if (!isDeleting && charIndex === fullText.length) {
      // Finished typing, wait then start deleting
      timeout = setTimeout(() => {
        setIsDeleting(true)
      }, pauseTime)
    } else if (isDeleting && charIndex === 0) {
      // Finished deleting, wait then start typing again
      timeout = setTimeout(() => {
        setIsDeleting(false)
      }, 500)
    }

    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, fullText, isMobile, prefersReducedMotion, typingSpeed, deletingSpeed])

  // Reduce animations on mobile or if user prefers reduced motion
  const shouldReduceMotion = isMobile || prefersReducedMotion

  const floatingVariants = {
    float: {
      y: shouldReduceMotion ? 0 : [0, -20, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
      },
    },
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: shouldReduceMotion ? { duration: 0.3 } : {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
    },
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Cover Image Background */}
      <div className="absolute inset-0 z-0">
        {/* Cover Image - Using CSS background for reliable mobile support */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/images/cover.jfif)',
          }}
        />
        
        {/* Animated gradient mesh overlay - Simplified on mobile */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-green/10 via-transparent to-primary-400/10"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-primary-300/10 via-transparent to-accent-green/10"></div>
        </div>

        {/* Large animated gradient circles for depth - Disabled on mobile */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="hidden md:block absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-accent-green/20 to-primary-400/20 rounded-full mix-blend-overlay filter blur-3xl opacity-40"
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="hidden md:block absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-primary-500/20 to-accent-green/20 rounded-full mix-blend-overlay filter blur-3xl opacity-40"
              animate={{
                scale: [1, 1.3, 1],
                x: [0, -40, 0],
                y: [0, 40, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
            <motion.div
              className="hidden md:block absolute bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-primary-300/20 to-accent-green/15 rounded-full mix-blend-overlay filter blur-3xl opacity-30"
              animate={{
                scale: [1, 1.1, 1],
                y: [0, -50, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 2,
              }}
            />
          </>
        )}
      </div>

      {/* Floating decorative icons - Hidden on mobile for performance */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            className="hidden md:block absolute top-32 left-10 text-white/20"
            variants={floatingVariants}
            animate="float"
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BookOpen className="w-16 h-16" />
          </motion.div>
          <motion.div
            className="hidden md:block absolute top-48 right-16 text-white/20"
            variants={floatingVariants}
            animate="float"
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <Users className="w-20 h-20" />
          </motion.div>
          <motion.div
            className="hidden md:block absolute bottom-32 right-20 text-white/20"
            variants={floatingVariants}
            animate="float"
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          >
            <Award className="w-14 h-14" />
          </motion.div>
        </>
      )}

      {/* Content */}
      <motion.div
        className="relative z-20 container-custom text-center px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Icon Badge */}
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="inline-block mb-8"
        >
          <div className="relative">
            <motion.div
              className="w-28 h-28 bg-gradient-to-br from-accent-green via-primary-500 to-primary-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl"
              animate={shouldReduceMotion ? {} : {
                boxShadow: [
                  '0 20px 40px rgba(5, 150, 105, 0.3)',
                  '0 30px 60px rgba(5, 150, 105, 0.4)',
                  '0 20px 40px rgba(5, 150, 105, 0.3)',
                ],
              }}
              transition={shouldReduceMotion ? {} : {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Sparkles className="w-14 h-14 text-white" />
            </motion.div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-28 h-28 bg-gradient-to-br from-accent-green via-primary-500 to-primary-700 rounded-3xl mx-auto blur-2xl opacity-50 -z-10"></div>
          </div>
        </motion.div>

        {/* Main Title with Typewriter Animation */}
        <motion.h1
          variants={itemVariants}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-2xl md:text-4xl lg:text-4xl xl:text-4xl font-extrabold mb-6 leading-tight min-h-[1.2em]"
        >
          <span className="block mb-2">
            <span className="bg-gradient-to-r from-white via-primary-100 to-white bg-clip-text text-transparent drop-shadow-lg">
              {displayedText}
              <span className="inline-block w-1 h-[1em] bg-white align-middle mr-1 animate-pulse drop-shadow-lg">|</span>
            </span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-xl md:text-2xl lg:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed font-medium drop-shadow-lg"
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* Stats or features highlight */}
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-wrap items-center justify-center gap-8 mb-12"
        >
          <div className="flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-white/30">
            <div className="w-3 h-3 bg-accent-green rounded-full animate-pulse"></div>
            <span className="text-primary-900 font-semibold">{t('hero.specializedTeachers')}</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-white/30">
            <div className="w-3 h-3 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <span className="text-primary-900 font-semibold">{t('hero.liveSessions')}</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-white/30">
            <div className="w-3 h-3 bg-accent-green rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <span className="text-primary-900 font-semibold">{t('hero.integratedCurriculum')}</span>
          </div>
        </motion.div>

        {/* Enhanced CTA Buttons */}
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <motion.a
            href="https://wa.me/966510253812"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-8 py-4 bg-gradient-to-r from-accent-green to-primary-600 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-green opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <MessageCircle className="w-6 h-6 relative z-10" />
            <span className="relative z-10">{t('hero.contactDirect')}</span>
            <ArrowLeft className="w-5 h-5 relative z-10 transform group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          </motion.a>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/register"
              className="group px-8 py-4 bg-white/90 backdrop-blur-sm text-primary-700 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 border-2 border-primary-300 hover:border-primary-500"
            >
              <span>{t('hero.register')}</span>
              <ArrowLeft className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-primary-50/50 to-transparent z-10 pointer-events-none">
        <svg
          className="absolute bottom-0 w-full h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 120"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60L60 50C120 40 240 20 360 20C480 20 600 40 720 50C840 60 960 60 1080 50C1200 40 1320 20 1380 10L1440 0V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V60Z"
            fill="white"
            opacity="0.8"
          />
        </svg>
      </div>
    </section>
  )
}
