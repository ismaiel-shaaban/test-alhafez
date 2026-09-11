'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useWebsiteStore } from '@/store/useWebsiteStore'
import { Send, CheckCircle, AlertCircle, Star, Upload, X } from 'lucide-react'

export default function ReviewForm() {
  const { t } = useTranslation()
  const { isLoading, error, createReview, fetchWebsiteData } = useWebsiteStore()
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    rating: 5,
    review: '',
    media_file: null as File | null,
  })
  const [preview, setPreview] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    
    try {
      await createReview({
        name: formData.name,
        rating: formData.rating,
        review: formData.review,
        media_file: formData.media_file || undefined,
      })
      
      setSuccess(true)
      // Reset form
      setFormData({
        name: '',
        rating: 5,
        review: '',
        media_file: null,
      })
      setPreview(null)
      
      // Refresh testimonials list to show the new review
      fetchWebsiteData()
      
      setTimeout(() => setSuccess(false), 5000)
    } catch (error: any) {
      setSubmitError(error.message || t('testimonials.error') || 'حدث خطأ أثناء إرسال الرأي')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleRatingChange = (rating: number) => {
    setFormData({
      ...formData,
      rating,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setSubmitError(t('testimonials.errorFileSize') || 'حجم الملف يجب أن يكون أقل من 10 ميجابايت')
        return
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mov']
      if (!validTypes.includes(file.type)) {
        setSubmitError(t('testimonials.errorFileType') || 'نوع الملف غير مدعوم. يرجى اختيار صورة (jpeg, png, jpg, gif) أو فيديو (mp4, mov)')
        return
      }

      setFormData({
        ...formData,
        media_file: file,
      })

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }
      setSubmitError(null)
    }
  }

  const removeFile = () => {
    setFormData({
      ...formData,
      media_file: null,
    })
    setPreview(null)
  }

  return (
    <div className="container-custom max-w-2xl">
      <div className="text-center mb-12">
        <h2 className="section-title text-3xl md:text-4xl font-bold text-primary-900 mb-4">
          {t('testimonials.addReview') || 'أضف رأيك'}
        </h2>
        <p className="section-subtitle text-primary-700">
          {t('testimonials.addReviewSubtitle') || 'شاركنا تجربتك مع أكاديمية الحافظ'}
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <p className="text-green-700 font-medium">
            {t('testimonials.success') || 'تم إرسال رأيك بنجاح! شكراً لك.'}
          </p>
        </div>
      )}

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-400 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <p className="text-red-700 font-medium">{submitError}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border-2 border-primary-200 shadow-xl">
        <div className="space-y-6">
          <div>
            <label className="block text-primary-900 font-medium mb-2" dir="rtl">
              {t('testimonials.name') || 'الاسم'}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-primary-50 border-2 border-primary-300 rounded-lg text-primary-900 focus:outline-none focus:border-accent-green transition-colors"
              dir="rtl"
              placeholder={t('testimonials.namePlaceholder') || 'أدخل اسمك'}
            />
          </div>

          <div>
            <label className="block text-primary-900 font-medium mb-2" dir="rtl">
              {t('testimonials.rating') || 'التقييم'}
            </label>
            <div className="flex items-center gap-2" dir="rtl">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingChange(rating)}
                  className={`transition-all transform hover:scale-110 ${
                    formData.rating >= rating
                      ? 'text-yellow-400'
                      : 'text-primary-300'
                  }`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      formData.rating >= rating ? 'fill-current' : ''
                    }`}
                  />
                </button>
              ))}
              <span className="mr-2 text-primary-700 font-medium">
                ({formData.rating}/5)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-primary-900 font-medium mb-2" dir="rtl">
              {t('testimonials.review') || 'الرأي'}
            </label>
            <textarea
              name="review"
              value={formData.review}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-3 bg-primary-50 border-2 border-primary-300 rounded-lg text-primary-900 focus:outline-none focus:border-accent-green transition-colors resize-none"
              dir="rtl"
              placeholder={t('testimonials.reviewPlaceholder') || 'اكتب رأيك هنا...'}
            />
            <p className="text-xs text-primary-600 mt-1" dir="rtl">
              {t('testimonials.reviewNote') || 'سيتم إرسال نفس النص للعربية والإنجليزية'}
            </p>
          </div>

          <div>
            <label className="block text-primary-900 font-medium mb-2" dir="rtl">
              {t('testimonials.mediaFile') || 'ملف وسائط (اختياري)'}
            </label>
            <div className="space-y-3">
              {!formData.media_file ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary-300 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-primary-400" />
                    <p className="mb-2 text-sm text-primary-600" dir="rtl">
                      <span className="font-semibold">{t('testimonials.uploadClick') || 'اضغط للرفع'}</span> {t('testimonials.uploadDrag') || 'أو اسحب الملف هنا'}
                    </p>
                    <p className="text-xs text-primary-500" dir="rtl">
                      {t('testimonials.uploadInfo') || 'صورة أو فيديو (jpeg, png, jpg, gif, mp4, mov - الحد الأقصى: 10MB)'}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative border-2 border-primary-300 rounded-lg p-4 bg-primary-50">
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    dir="ltr"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-3" dir="rtl">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-primary-200 rounded-lg flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-900" dir="rtl">
                        {formData.media_file.name}
                      </p>
                      <p className="text-xs text-primary-600" dir="rtl">
                        {(formData.media_file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full justify-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              t('testimonials.submitting') || 'جاري الإرسال...'
            ) : (
              <>
                <Send className="w-5 h-5" />
                {t('testimonials.submit') || 'إرسال الرأي'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

