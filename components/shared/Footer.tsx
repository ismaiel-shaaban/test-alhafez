'use client'

import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { Facebook, Twitter, Instagram, Mail, Phone, Heart } from 'lucide-react'

export default function Footer() {
  const { t } = useTranslation()

  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-gradient-to-b from-primary-800 via-primary-900 to-primary-950 text-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-700/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo/Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <img
                src="/images/logo.jpg"
                alt="أكاديمية الحافظ"
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    const fallback = document.createElement('h3')
                    fallback.className = 'text-2xl font-bold bg-gradient-to-r from-white via-primary-100 to-white bg-clip-text text-transparent'
                    fallback.textContent = 'أكاديمية الحافظ'
                    parent.appendChild(fallback)
                  }
                }}
              />
            </div>
            <p className="text-primary-200 leading-relaxed text-sm">
              {t('footer.aboutText')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white border-b border-primary-700 pb-2">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/" 
                  className="text-primary-200 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-accent-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/#features" 
                  className="text-primary-200 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-accent-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('nav.features')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/packages" 
                  className="text-primary-200 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-accent-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('nav.packages')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/lessons" 
                  className="text-primary-200 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-accent-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('nav.lessons')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/register" 
                  className="text-primary-200 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-accent-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('nav.register')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/refund-policy" 
                  className="text-primary-200 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-accent-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('footer.refundPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white border-b border-primary-700 pb-2">
              {t('footer.contact')}
            </h3>
            <div className="space-y-4">
              <a
                href="mailto:hafezacademy84@gmail.com"
                className="flex items-center gap-3 text-primary-200 hover:text-white transition-colors duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-700/50 flex items-center justify-center group-hover:bg-accent-green transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm">hafezacademy84@gmail.com</span>
              </a>
              <a
                href="tel:+966510253812"
                className="flex items-center gap-3 text-primary-200 hover:text-white transition-colors duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-700/50 flex items-center justify-center group-hover:bg-accent-green transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm">+201016914708</span>
              </a>
              {/* Address */}
              <div className="flex items-start gap-3 text-primary-200 hover:text-white transition-colors duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-primary-700/50 flex items-center justify-center group-hover:bg-accent-green transition-colors">
                  {/* You can use a location marker icon here if available */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 0c-4 0-7 3.14-7 7h14c0-3.86-3-7-7-7z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">العنوان</span>
                  <span className="text-sm whitespace-pre-line">ميت عزون ، مركز المنصورة ، محافظة الدقهلية</span>
                </div>
              </div>
            </div>
          </div>
     

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white border-b border-primary-700 pb-2">
              تابعنا
            </h3>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.facebook.com/share/1Jxyr6vtLw/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-lg bg-primary-700/50 hover:bg-accent-green flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-accent-green/50"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-700/50 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-300 text-sm text-center md:text-right">
              © {currentYear} {t('footer.rights')} - أكاديمية الحافظ
            </p>
            <p className="text-primary-400 text-sm flex items-center gap-2">
              صنع بـ <Heart className="w-4 h-4 fill-red-500 text-red-500" /> مع الحب
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
