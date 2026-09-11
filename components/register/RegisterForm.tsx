'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useWebsiteStore } from '@/store/useWebsiteStore'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'

export default function RegisterForm() {
  const { t } = useTranslation()
  const { packages, isLoading, error, fetchWebsiteData, registerStudent } = useWebsiteStore()
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'male',
    package_id: '',
    notes: '',
  })

  useEffect(() => {
    fetchWebsiteData()
  }, [fetchWebsiteData])

  const currentLocale = typeof window !== 'undefined' ? (localStorage.getItem('locale') || 'ar') : 'ar'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    
    try {
      await registerStudent({
        name: formData.name,
        phone: formData.phone,
        age: parseInt(formData.age),
        gender: formData.gender as 'male' | 'female',
        package_id: formData.package_id ? parseInt(formData.package_id) : undefined,
        notes: formData.notes || undefined,
      })
      
      setSuccess(true)
      // Reset form
      setFormData({
        name: '',
        phone: '',
        age: '',
        gender: '',
        package_id: '',
        notes: '',
      })
      setTimeout(() => setSuccess(false), 5000)
    } catch (error: any) {
      setSubmitError(error.message || 'حدث خطأ أثناء التسجيل')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="container-custom max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="section-title">{t('register.title')}</h1>
        <p className="section-subtitle">{t('register.subtitle')}</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <p className="text-green-700 font-medium">{t('register.success') || 'تم التسجيل بنجاح! سنتواصل معك قريباً.'}</p>
        </div>
      )}

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-400 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <p className="text-red-700 font-medium">{submitError}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <p className="text-yellow-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border-2 border-primary-200 shadow-xl">
        <div className="space-y-6">
          <div>
            <label className="block text-primary-900 font-medium mb-2">{t('register.fullName')}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-primary-50 border-2 border-primary-300 rounded-lg text-primary-900 focus:outline-none focus:border-accent-green transition-colors"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-primary-900 font-medium mb-2">{t('register.phone')}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-primary-50 border-2 border-primary-300 rounded-lg text-primary-900 focus:outline-none focus:border-accent-green transition-colors"
              dir="rtl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-primary-900 font-medium mb-2">{t('register.age')}</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="1"
                max="120"
                className="w-full px-4 py-3 bg-primary-50 border-2 border-primary-300 rounded-lg text-primary-900 focus:outline-none focus:border-accent-green transition-colors"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-primary-900 font-medium mb-2">{t('register.gender')}</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-primary-50 border-2 border-primary-300 rounded-lg text-primary-900 focus:outline-none focus:border-accent-green transition-colors"
                dir="rtl"
              >
                <option value="">-- {t('register.gender')} --</option>
                <option value="male">{t('register.male') || 'ذكر'}</option>
                <option value="female">{t('register.female') || 'أنثى'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-primary-900 font-medium mb-2">{t('register.package')}</label>
            <select
              name="package_id"
              value={formData.package_id}
              required
              onChange={handleChange}
              className="w-full px-4 py-3 bg-primary-50 border-2 border-primary-300 rounded-lg text-primary-900 focus:outline-none focus:border-accent-green transition-colors"
              dir="rtl"
            >
              <option value="">-- {t('register.package')} --</option>
              {packages.map((pkg) => {
                const name = currentLocale === 'en' && pkg.name_en ? pkg.name_en : (pkg.name_ar || pkg.name)
                return (
                  <option key={pkg.id} value={pkg.id}>
                    {name}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-primary-900 font-medium mb-2">{t('register.message')}</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-primary-50 border-2 border-primary-300 rounded-lg text-primary-900 focus:outline-none focus:border-accent-green transition-colors resize-none"
              dir="rtl"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full justify-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              'جاري الإرسال...'
            ) : (
              <>
                <Send className="w-5 h-5" />
                {t('register.submit')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
