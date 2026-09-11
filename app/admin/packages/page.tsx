'use client'

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { Plus, Edit, Trash2, X, Eye, Search, Check, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PackagesPage() {
  const { packages, packagesMeta, isLoadingPackages, fetchPackages, getPackage, addPackage, updatePackage, deletePackage, error } = useAdminStore()
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewedPackage, setViewedPackage] = useState<any>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    price: '',
    price_ar: '',
    price_en: '',
    features: [] as string[],
    features_en: [] as string[],
    is_popular: false,
  })
  const [newFeature, setNewFeature] = useState('')
  const [newFeatureEn, setNewFeatureEn] = useState('')
  const [featureLanguage, setFeatureLanguage] = useState<'ar' | 'en'>('ar')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPopular, setFilterPopular] = useState<boolean | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filter changes
  }, [filterPopular])

  useEffect(() => {
    fetchPackages(filterPopular === null ? undefined : filterPopular, currentPage)
  }, [fetchPackages, filterPopular, currentPage])

  const filteredPackages = packages.filter((pkg) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        pkg.name.toLowerCase().includes(search) ||
        pkg.name_en?.toLowerCase().includes(search) ||
        (Array.isArray(pkg.features) && pkg.features.some(f => f.toLowerCase().includes(search)))
      )
    }
    return true
  })

  const handleViewPackage = async (id: number) => {
    try {
      const pkg = await getPackage(id)
      setViewedPackage(pkg)
      setShowViewModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات الباقة')
    }
  }

  const handleOpenModal = (pkg?: any) => {
    if (pkg) {
      setEditingId(pkg.id)
      setFormData({ 
        name: pkg.name || pkg.name_ar || '', 
        name_en: pkg.name_en || '',
        price: pkg.price?.toString() || '', 
        price_ar: pkg.price_ar || '',
        price_en: pkg.price_en || '',
        features: Array.isArray(pkg.features_ar) ? [...pkg.features_ar] : (Array.isArray(pkg.features) ? [...pkg.features] : []),
        features_en: Array.isArray(pkg.features_en) ? [...pkg.features_en] : [],
        is_popular: pkg.is_popular || false 
      })
    } else {
      setEditingId(null)
      setFormData({ name: '', name_en: '', price: '', price_ar: '', price_en: '', features: [], features_en: [], is_popular: false })
    }
    setNewFeature('')
    setNewFeatureEn('')
    setFeatureLanguage('ar')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ name: '', name_en: '', price: '', price_ar: '', price_en: '', features: [], features_en: [], is_popular: false })
    setNewFeature('')
    setNewFeatureEn('')
    setFeatureLanguage('ar')
  }

  const handleAddFeature = () => {
    if (featureLanguage === 'ar' && newFeature.trim()) {
      setFormData({ ...formData, features: [...formData.features, newFeature.trim()] })
      setNewFeature('')
    } else if (featureLanguage === 'en' && newFeatureEn.trim()) {
      setFormData({ ...formData, features_en: [...formData.features_en, newFeatureEn.trim()] })
      setNewFeatureEn('')
    }
  }

  const handleRemoveFeature = (index: number, language: 'ar' | 'en') => {
    if (language === 'ar') {
      setFormData({
        ...formData,
        features: formData.features.filter((_, i) => i !== index),
      })
    } else {
      setFormData({
        ...formData,
        features_en: formData.features_en.filter((_, i) => i !== index),
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const packageData = {
        name: formData.name,
        name_en: formData.name_en || undefined,
        price: parseFloat(formData.price) || 0,
        price_ar: formData.price_ar || undefined,
        price_en: formData.price_en || undefined,
        features: formData.features,
        features_en: formData.features_en.length > 0 ? formData.features_en : undefined,
        is_popular: formData.is_popular,
      }
      
      if (editingId) {
        await updatePackage(editingId, packageData)
      } else {
        await addPackage(packageData)
      }
      handleCloseModal()
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
      try {
        await deletePackage(id)
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء الحذف')
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-primary-900">إدارة الباقات</h1>
        <div className="flex items-center gap-4">
          <div className="text-primary-600 font-medium">إجمالي: {packages.length}</div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            إضافة باقة
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
          <h3 className="text-lg font-semibold text-primary-900">فلترة الباقات</h3>
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
                placeholder="ابحث عن باقة..."
                className="w-full pr-12 pl-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                dir="rtl"
              />
            </div>
          </div>
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">الباقات الشائعة</label>
            <select
              value={filterPopular === null ? '' : filterPopular.toString()}
              onChange={(e) => {
                const value = e.target.value
                setFilterPopular(value === '' ? null : value === 'true')
              }}
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
              dir="rtl"
            >
              <option value="">جميع الباقات</option>
              <option value="true">شائعة فقط</option>
              <option value="false">غير شائعة فقط</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingPackages ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.length === 0 ? (
              <div className="col-span-full text-center py-12 text-primary-600">
                {searchTerm || filterPopular !== null ? 'لا توجد نتائج' : 'لا توجد باقات مسجلة بعد'}
              </div>
            ) : (
              filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative bg-white p-8 rounded-xl border-2 ${
                    pkg.is_popular
                      ? 'border-accent-green shadow-2xl ring-4 ring-accent-green/20'
                      : 'border-primary-300 shadow-lg'
                  } hover:shadow-xl transition-all`}
                >
                  {pkg.is_popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-accent-green to-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        الأكثر شعبية
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-primary-900 mb-4">{pkg.name}</h3>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold text-primary-700">{pkg.price}</span>
                      <span className="text-primary-600">دينار/شهرياً</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {(Array.isArray(pkg.features) ? pkg.features : []).map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-primary-700">
                        <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-primary-200">
                    <button
                      onClick={() => handleViewPackage(pkg.id)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(pkg)}
                      className="px-4 py-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
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
          {packagesMeta && packagesMeta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-primary-200">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="px-4 py-2 text-primary-700">
                صفحة {currentPage} من {packagesMeta.last_page}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= packagesMeta.last_page}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* View Package Details Modal */}
      <AnimatePresence>
        {showViewModal && viewedPackage && (
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
                <h2 className="text-2xl font-bold text-primary-900">تفاصيل الباقة</h2>
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
                    <label className="block text-primary-600 text-sm mb-1">اسم الباقة (عربي)</label>
                    <p className="text-primary-900 font-semibold">{viewedPackage.name_ar || viewedPackage.name}</p>
                  </div>
                  {viewedPackage.name_en && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">اسم الباقة (إنجليزي)</label>
                      <p className="text-primary-900">{viewedPackage.name_en}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">السعر (رقم)</label>
                    <p className="text-primary-900 font-semibold">{viewedPackage.price}</p>
                  </div>
                  {viewedPackage.price_ar && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">السعر (عربي)</label>
                      <p className="text-primary-900 font-semibold">{viewedPackage.price_ar}</p>
                    </div>
                  )}
                  {viewedPackage.price_en && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">السعر (إنجليزي)</label>
                      <p className="text-primary-900 font-semibold">{viewedPackage.price_en}</p>
                    </div>
                  )}
                  {viewedPackage.price_label && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">تسمية السعر</label>
                      <p className="text-primary-900 font-semibold">{viewedPackage.price_label}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">باقة شائعة</label>
                    <p className="text-primary-900">{viewedPackage.is_popular ? 'نعم' : 'لا'}</p>
                  </div>
                  {viewedPackage.students_count !== undefined && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">عدد الطلاب</label>
                      <p className="text-primary-900">{viewedPackage.students_count}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-primary-600 text-sm mb-2">المميزات (عربي)</label>
                  <ul className="space-y-2">
                    {(Array.isArray(viewedPackage.features_ar) ? viewedPackage.features_ar : (Array.isArray(viewedPackage.features) ? viewedPackage.features : [])).map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-primary-900">
                        <Check className="w-4 h-4 text-accent-green flex-shrink-0 mt-1" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {viewedPackage.features_en && Array.isArray(viewedPackage.features_en) && viewedPackage.features_en.length > 0 && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-2">المميزات (إنجليزي)</label>
                    <ul className="space-y-2">
                      {viewedPackage.features_en.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-primary-900">
                          <Check className="w-4 h-4 text-accent-green flex-shrink-0 mt-1" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
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
                  {editingId ? 'تعديل باقة' : 'إضافة باقة جديدة'}
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
                  <label className="block text-primary-900 font-semibold mb-2 text-right">اسم الباقة (عربي)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">اسم الباقة (إنجليزي)</label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">السعر (رقم) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">السعر (عربي)</label>
                  <input
                    type="text"
                    value={formData.price_ar}
                    onChange={(e) => setFormData({ ...formData, price_ar: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    placeholder="مثال: 500 جنيه"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">السعر (إنجليزي)</label>
                  <input
                    type="text"
                    value={formData.price_en}
                    onChange={(e) => setFormData({ ...formData, price_en: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder="e.g., 500 EGP"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">المميزات</label>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={featureLanguage}
                      onChange={(e) => setFeatureLanguage(e.target.value as 'ar' | 'en')}
                      className="px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    >
                      <option value="ar">عربي</option>
                      <option value="en">English</option>
                    </select>
                    <input
                      type="text"
                      value={featureLanguage === 'ar' ? newFeature : newFeatureEn}
                      onChange={(e) => {
                        if (featureLanguage === 'ar') {
                          setNewFeature(e.target.value)
                        } else {
                          setNewFeatureEn(e.target.value)
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddFeature()
                        }
                      }}
                      placeholder={featureLanguage === 'ar' ? 'أضف ميزة...' : 'Add feature...'}
                      className="flex-1 px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                      dir={featureLanguage === 'ar' ? 'rtl' : 'ltr'}
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      إضافة
                    </button>
                  </div>
                  {formData.features.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-primary-600 mb-2">المميزات (عربي):</p>
                      <div className="space-y-2">
                        {formData.features.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-primary-50 rounded-lg">
                            <span className="text-primary-700">{feature}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(index, 'ar')}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.features_en.length > 0 && (
                    <div>
                      <p className="text-sm text-primary-600 mb-2">المميزات (إنجليزي):</p>
                      <div className="space-y-2">
                        {formData.features_en.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-primary-50 rounded-lg">
                            <span className="text-primary-700">{feature}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(index, 'en')}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="popular"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="popular" className="text-primary-900 font-semibold">
                    باقة شائعة
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
