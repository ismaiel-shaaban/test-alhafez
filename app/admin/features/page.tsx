'use client'

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { Plus, Edit, Trash2, X, Eye, Search, Filter, CheckCircle, XCircle, Users, Clock, Heart, BookOpen, GraduationCap, UserCheck, Award, Star, Sparkles, MessageCircle, Calendar, Shield, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Available icon options
const iconOptions = [
  { value: '', label: 'بدون أيقونة' },
  { value: 'teacher', label: 'معلمون (Users)' },
  { value: 'clock', label: 'ساعة (Clock)' },
  { value: 'heart', label: 'قلب (Heart)' },
  { value: 'book', label: 'كتاب (BookOpen)' },
  { value: 'graduation', label: 'تخرج (GraduationCap)' },
  { value: 'user', label: 'مستخدم (UserCheck)' },
  { value: 'award', label: 'جائزة (Award)' },
  { value: 'star', label: 'نجمة (Star)' },
  { value: 'sparkles', label: 'شرارات (Sparkles)' },
  { value: 'message', label: 'رسالة (MessageCircle)' },
  { value: 'calendar', label: 'تقويم (Calendar)' },
  { value: 'shield', label: 'درع (Shield)' },
  { value: 'zap', label: 'صاعقة (Zap)' },
]

export default function FeaturesPage() {
  const { 
    features, 
    featuresMeta,
    isLoadingFeatures, 
    fetchFeatures, 
    getFeature,
    addFeature, 
    updateFeature, 
    deleteFeature,
    error 
  } = useAdminStore()
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewedFeature, setViewedFeature] = useState<any>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    title_en: '',
    description: '',
    description_en: '',
    icon: '',
    order: 0,
    is_active: true,
  })

  useEffect(() => {
    fetchFeatures()
  }, [fetchFeatures])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterActive])

  // Apply API filter when active filter changes
  useEffect(() => {
    const filters: any = {}
    if (filterActive !== null) filters.is_active = filterActive
    filters.page = currentPage
    filters.per_page = 15
    fetchFeatures(filters)
  }, [currentPage, filterActive, fetchFeatures])

  // Filter by search term (client-side)
  const filteredFeatures = features.filter((feature) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      feature.title_ar?.toLowerCase().includes(search) ||
      feature.title?.toLowerCase().includes(search) ||
      feature.title_en?.toLowerCase().includes(search) ||
      feature.description_ar?.toLowerCase().includes(search) ||
      feature.description?.toLowerCase().includes(search) ||
      feature.description_en?.toLowerCase().includes(search)
    )
  })

  const handleViewFeature = async (id: number) => {
    try {
      const feature = await getFeature(id)
      setViewedFeature(feature)
      setShowViewModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات الميزة')
    }
  }

  const handleOpenModal = (feature?: any) => {
    if (feature) {
      setEditingId(feature.id)
      setFormData({
        title: feature.title_ar || feature.title || '',
        title_en: feature.title_en || '',
        description: feature.description_ar || feature.description || '',
        description_en: feature.description_en || '',
        icon: feature.icon || '',
        order: feature.order || 0,
        is_active: feature.is_active !== undefined ? feature.is_active : true,
      })
    } else {
      setEditingId(null)
      setFormData({ title: '', title_en: '', description: '', description_en: '', icon: '', order: 0, is_active: true })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ title: '', title_en: '', description: '', description_en: '', icon: '', order: 0, is_active: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const featureData = {
        title: formData.title,
        title_en: formData.title_en || undefined,
        description: formData.description,
        description_en: formData.description_en || undefined,
        icon: formData.icon || undefined,
        order: parseInt(formData.order.toString()) || 0,
        is_active: formData.is_active,
      }
      
      if (editingId) {
        await updateFeature(editingId, featureData)
      } else {
        await addFeature(featureData)
      }
      handleCloseModal()
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذه الميزة؟')) {
      try {
        await deleteFeature(id)
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء الحذف')
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-primary-900">إدارة المميزات</h1>
        <div className="flex items-center gap-4">
          <div className="text-primary-600 font-medium">إجمالي: {features.length}</div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            إضافة ميزة
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
          <h3 className="text-lg font-semibold text-primary-900">فلترة المميزات</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">البحث</label>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن ميزة..."
                className="w-full pr-12 pl-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                dir="rtl"
              />
            </div>
          </div>
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">الحالة</label>
            <select
              value={filterActive === null ? '' : filterActive.toString()}
              onChange={(e) => {
                const value = e.target.value
                setFilterActive(value === '' ? null : value === 'true')
              }}
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
              dir="rtl"
            >
              <option value="">جميع المميزات</option>
              <option value="true">نشطة فقط</option>
              <option value="false">غير نشطة فقط</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingFeatures ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.length === 0 ? (
              <div className="col-span-full text-center py-12 text-primary-600">
                {searchTerm || filterActive !== null
                  ? 'لا توجد نتائج'
                  : 'لا توجد مميزات مسجلة بعد'}
              </div>
            ) : (
              filteredFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className={`bg-white p-6 rounded-xl border-2 ${
                    feature.is_active
                      ? 'border-primary-200 shadow-lg'
                      : 'border-gray-200 opacity-60'
                  } hover:shadow-xl transition-all`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-primary-900 mb-2">{feature.title_ar || feature.title}</h3>
                      <p className="text-primary-700 text-sm leading-relaxed line-clamp-3">
                        {feature.description_ar || feature.description}
                      </p>
                    </div>
                    {feature.is_active ? (
                      <CheckCircle className="w-6 h-6 text-accent-green flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-primary-600 mb-4">
                    <span>الترتيب: {feature.order}</span>
                    {feature.icon && <span>الأيقونة: {feature.icon}</span>}
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-primary-200">
                    <button
                      onClick={() => handleViewFeature(feature.id)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(feature)}
                      className="px-4 py-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(feature.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {featuresMeta && featuresMeta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-primary-200">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="px-4 py-2 text-primary-700">
                صفحة {currentPage} من {featuresMeta.last_page}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= featuresMeta.last_page}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* View Feature Details Modal */}
      <AnimatePresence>
        {showViewModal && viewedFeature && (
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
                <h2 className="text-2xl font-bold text-primary-900">تفاصيل الميزة</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">العنوان (عربي)</label>
                    <p className="text-primary-900 font-semibold">{viewedFeature.title_ar || viewedFeature.title}</p>
                  </div>
                  {viewedFeature.title_en && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">العنوان (إنجليزي)</label>
                      <p className="text-primary-900">{viewedFeature.title_en}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الوصف (عربي)</label>
                    <p className="text-primary-900">{viewedFeature.description_ar || viewedFeature.description}</p>
                  </div>
                  {viewedFeature.description_en && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">الوصف (إنجليزي)</label>
                      <p className="text-primary-900">{viewedFeature.description_en}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الأيقونة</label>
                    <p className="text-primary-900">{viewedFeature.icon || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الترتيب</label>
                    <p className="text-primary-900">{viewedFeature.order}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الحالة</label>
                    <p className="text-primary-900">{viewedFeature.is_active ? 'نشطة' : 'غير نشطة'}</p>
                  </div>
                </div>
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
                  {editingId ? 'تعديل ميزة' : 'إضافة ميزة جديدة'}
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
                  <label className="block text-primary-900 font-semibold mb-2 text-right">العنوان (عربي)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">العنوان (إنجليزي)</label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الوصف (عربي)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الوصف (إنجليزي)</label>
                  <textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الأيقونة</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                  >
                    {iconOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الترتيب</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    min="0"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="text-primary-900 font-semibold">
                    ميزة نشطة
                  </label>
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

