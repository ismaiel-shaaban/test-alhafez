'use client'

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { Plus, Edit, Trash2, X, Eye, Star, Search, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchableStudentSelect from '@/components/admin/SearchableStudentSelect'

export default function TestimonialsPage() {
  const { 
    reviews, 
    reviewsMeta,
    isLoadingReviews, 
    fetchReviews, 
    getReview,
    addReview, 
    updateReview, 
    deleteReview,
    students,
    fetchStudents,
    packages,
    fetchPackages,
    error 
  } = useAdminStore()
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewedReview, setViewedReview] = useState<any>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    rating: '',
    package_id: '',
    student_id: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    type: 'review' as 'review' | 'rating',
    student_id: '',
    package_id: '',
    rating: 5,
    review: '',
    review_en: '',
    media_file: null as File | null,
  })

  useEffect(() => {
    fetchReviews()
    fetchStudents()
    fetchPackages()
  }, [fetchReviews, fetchStudents, fetchPackages])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.rating, filters.package_id, filters.student_id])

  // Apply API filters when they change
  useEffect(() => {
    const apiFilters: any = {}
    if (filters.rating) apiFilters.rating = parseInt(filters.rating)
    if (filters.package_id) apiFilters.package_id = parseInt(filters.package_id)
    if (filters.student_id) apiFilters.student_id = parseInt(filters.student_id)
    apiFilters.page = currentPage
    apiFilters.per_page = 15
    
    fetchReviews(apiFilters)
  }, [currentPage, filters.rating, filters.package_id, filters.student_id, fetchReviews])

  // Filter by search term (client-side)
  const filteredReviews = reviews.filter((review) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      review.student?.name.toLowerCase().includes(search) ||
      review.review_ar?.toLowerCase().includes(search) ||
      review.review?.toLowerCase().includes(search) ||
      review.review_en?.toLowerCase().includes(search)
    )
  })

  const handleViewReview = async (id: number) => {
    try {
      const review = await getReview(id)
      setViewedReview(review)
      setShowViewModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات الرأي')
    }
  }

  const handleOpenModal = (review?: any) => {
    if (review) {
      setEditingId(review.id)
      setFormData({
        type: review.type || 'review',
        student_id: review.student_id?.toString() || '',
        package_id: review.package_id?.toString() || '',
        rating: review.rating || 5,
        review: review.review_ar || review.review || '',
        review_en: review.review_en || '',
        media_file: null, // Don't populate file input
      })
    } else {
      setEditingId(null)
      setFormData({ type: 'review', student_id: '', package_id: '', rating: 5, review: '', review_en: '', media_file: null })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ type: 'review', student_id: '', package_id: '', rating: 5, review: '', review_en: '', media_file: null })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const reviewData = {
        type: formData.type,
        student_id: formData.student_id ? parseInt(formData.student_id) : undefined,
        package_id: formData.package_id ? parseInt(formData.package_id) : undefined,
        rating: formData.rating,
        review: formData.review,
        review_en: formData.review_en || undefined,
        media_file: formData.media_file || undefined,
      }
      
      if (editingId) {
        await updateReview(editingId, reviewData)
      } else {
        await addReview(reviewData)
      }
      handleCloseModal()
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الرأي؟')) {
      try {
        await deleteReview(id)
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء الحذف')
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-primary-900">إدارة آراء الطلاب</h1>
        <div className="flex items-center gap-4">
          <div className="text-primary-600 font-medium">إجمالي: {reviews.length}</div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            إضافة رأي
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-primary-200 p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-primary-900">فلترة الآراء</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">البحث</label>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن رأي..."
                className="w-full pr-12 pl-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                dir="rtl"
              />
            </div>
          </div>
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">التقييم</label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
              dir="rtl"
            >
              <option value="">جميع التقييمات</option>
              <option value="5">5 نجوم</option>
              <option value="4">4 نجوم</option>
              <option value="3">3 نجوم</option>
              <option value="2">2 نجوم</option>
              <option value="1">1 نجمة</option>
            </select>
          </div>
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">الباقة</label>
            <select
              value={filters.package_id}
              onChange={(e) => setFilters({ ...filters, package_id: e.target.value })}
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
              dir="rtl"
            >
              <option value="">جميع الباقات</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">الطالب</label>
            <SearchableStudentSelect
              value={filters.student_id}
              onChange={(value) => setFilters({ ...filters, student_id: value })}
              students={students}
              placeholder="جميع الطلاب"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingReviews ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.length === 0 ? (
              <div className="col-span-full text-center py-12 text-primary-600">
                {searchTerm || filters.rating || filters.package_id || filters.student_id
                  ? 'لا توجد نتائج'
                  : 'لا توجد آراء مسجلة بعد'}
              </div>
            ) : (
              filteredReviews.map((review) => {
                const isVideo = review.media_file && /\.(mp4|mov|avi|webm)$/i.test(review.media_file)
                const isImage = review.media_file && /\.(jpeg|jpg|png|gif|webp)$/i.test(review.media_file)
                
                return (
                  <div
                    key={review.id}
                    className="bg-white p-6 rounded-xl border-2 border-primary-200 shadow-lg hover:shadow-xl transition-all relative"
                  >
                    {/* Media File Display */}
                    {review.media_file && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        {isImage ? (
                          <img
                            src={review.media_file}
                            alt="Review media"
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : isVideo ? (
                          <video
                            src={review.media_file}
                            className="w-full h-48 object-cover"
                            controls
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : null}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-accent-gold text-accent-gold" />
                      ))}
                    </div>
                    <p className="text-primary-700 mb-4 leading-relaxed">{review.review_ar || review.review}</p>
                    <div className="border-t border-primary-200 pt-4">
                      <h4 className="font-bold text-primary-900 mb-1">{review.student?.name || 'طالب'}</h4>
                      <p className="text-sm text-primary-600">{review.package?.name || '-'}</p>
                    </div>
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-primary-200">
                    <button
                      onClick={() => handleViewReview(review.id)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(review)}
                      className="px-4 py-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {reviewsMeta && reviewsMeta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-primary-200">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="px-4 py-2 text-primary-700">
                صفحة {currentPage} من {reviewsMeta.last_page}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= reviewsMeta.last_page}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* View Review Details Modal */}
      <AnimatePresence>
        {showViewModal && viewedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">تفاصيل الرأي</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Media File Display */}
                {viewedReview.media_file && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-2">ملف الوسائط</label>
                    <div className="rounded-lg overflow-hidden">
                      {/\.(mp4|mov|avi|webm)$/i.test(viewedReview.media_file) ? (
                        <video
                          src={viewedReview.media_file}
                          className="w-full max-h-96 object-contain"
                          controls
                          onError={(e) => {
                            const target = e.target as HTMLVideoElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : /\.(jpeg|jpg|png|gif|webp)$/i.test(viewedReview.media_file) ? (
                        <img
                          src={viewedReview.media_file}
                          alt="Review media"
                          className="w-full max-h-96 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الطالب</label>
                    <p className="text-primary-900 font-semibold">{viewedReview.student?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الباقة</label>
                    <p className="text-primary-900">{viewedReview.package?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">التقييم</label>
                    <div className="flex items-center gap-1">
                      {[...Array(viewedReview.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-accent-gold text-accent-gold" />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-primary-600 text-sm mb-1">الرأي (عربي)</label>
                  <p className="text-primary-900">{viewedReview.review_ar || viewedReview.review}</p>
                </div>
                {viewedReview.review_en && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الرأي (إنجليزي)</label>
                    <p className="text-primary-900">{viewedReview.review_en}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">
                  {editingId ? 'تعديل رأي' : 'إضافة رأي جديد'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">النوع</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'review' | 'rating' })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                  >
                    <option value="review">رأي</option>
                    <option value="rating">تقييم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الطالب (اختياري)</label>
                  <SearchableStudentSelect
                    value={formData.student_id}
                    onChange={(value) => setFormData({ ...formData, student_id: value })}
                    students={students}
                    placeholder="اختر الطالب (اختياري)"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الباقة</label>
                  <select
                    value={formData.package_id}
                    onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                  >
                    <option value="">اختر الباقة (اختياري)</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">التقييم</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating })}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          formData.rating >= rating
                            ? 'bg-accent-gold text-white'
                            : 'bg-primary-100 text-primary-400'
                        }`}
                      >
                        <Star className="w-5 h-5 mx-auto" fill={formData.rating >= rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الرأي (عربي)</label>
                  <textarea
                    value={formData.review}
                    onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الرأي (إنجليزي)</label>
                  <textarea
                    value={formData.review_en}
                    onChange={(e) => setFormData({ ...formData, review_en: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">ملف وسائط (اختياري)</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setFormData({ ...formData, media_file: e.target.files?.[0] || null })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                  />
                  <p className="text-xs text-primary-600 mt-1">صورة أو فيديو (jpeg, png, jpg, gif, mp4, mov, الحد الأقصى: 10MB)</p>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 border-2 border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
