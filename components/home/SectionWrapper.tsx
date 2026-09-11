'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ReactNode, useEffect, useState } from 'react'

interface SectionWrapperProps {
  children: ReactNode
  delay?: number
  className?: string
}

export default function SectionWrapper({ children, delay = 0, className = '' }: SectionWrapperProps) {
  const prefersReducedMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const shouldReduceMotion = isMobile || prefersReducedMotion

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={shouldReduceMotion ? {
        duration: 0.3,
        delay: 0,
      } : {
        duration: 0.6,
        delay,
        ease: [0.21, 1.11, 0.81, 0.99],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
