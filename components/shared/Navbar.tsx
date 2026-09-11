'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/hooks/useTranslation'
import { useLocale } from '@/contexts/LocaleContext'
import { Menu, X, BookOpen, Globe } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const { t } = useTranslation()
  const { setLocale, locale } = useLocale()

  const toggleMenu = () => setIsOpen(!isOpen)
  const toggleLangMenu = () => setIsLangMenuOpen(!isLangMenuOpen)

  const changeLanguage = (locale: 'ar' | 'en') => {
    setLocale(locale)
    setIsLangMenuOpen(false)
  }

  const navLinks = [
    { href: '/', label: t('nav.home') },
    // { href: '/#features', label: t('nav.features') },
    // { href: '/honor-board', label: t('nav.honorBoard') },
    { href: '/teachers', label: t('nav.teachers') },
    { href: '/packages', label: t('nav.packages') },
    { href: '/lessons', label: t('nav.lessons') },
    { href: '/testimonials', label: t('nav.testimonials') },
    { href: '/refund-policy', label: t('nav.refundPolicy') },
    { href: '/register', label: t('nav.register') },
  ]

  return (
    <nav className="fixed top-0 w-full bg-navbar backdrop-blur-sm z-50 border-b border-primary shadow-md">
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow relative">
              <Image
                src="/images/logo.jpg"
                alt="أكاديمية الحافظ"
                fill
                className="object-cover"
                sizes="48px"
                priority
              />
            </div>
            <span className="text-xl font-bold text-primary-900 hidden sm:block">
              أكاديمية الحافظ
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-primary-700 hover:text-accent-green transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Language Switcher & Mobile Menu Button */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={toggleLangMenu}
                className="flex items-center gap-2 text-primary-700 hover:text-accent-green transition-colors p-2"
              >
                <Globe className="w-5 h-5" />
                <span className="hidden sm:inline">{locale === 'ar' ? 'العربية' : 'English'}</span>
              </button>
              {isLangMenuOpen && (
                <div className="absolute left-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-primary-300">
                  <button
                    onClick={() => changeLanguage('ar')}
                    className="block w-full text-right px-4 py-2 hover:bg-primary-100 rounded-t-lg text-primary-900"
                  >
                    العربية
                  </button>
                  <button
                    onClick={() => changeLanguage('en')}
                    className="block w-full text-right px-4 py-2 hover:bg-primary-100 rounded-b-lg text-primary-900"
                  >
                    English
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="lg:hidden text-primary-900 p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden pb-4 border-t border-primary-300 mt-4 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-3 text-primary-700 hover:text-accent-green transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
