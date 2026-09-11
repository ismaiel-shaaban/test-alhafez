'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ReactNode, useEffect, useState } from 'react'

interface AnimatedSectionProps {
  children: ReactNode
  id?: string
  className?: string
  delay?: number
}

export default function AnimatedSection({ 
  children, 
  id, 
  className = '', 
  delay = 0 
}: AnimatedSectionProps) {
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
    <motion.section
      id={id}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={shouldReduceMotion ? {
        duration: 0.3,
        delay: 0,
      } : {
        duration: 0.8,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.section>
  )
}
