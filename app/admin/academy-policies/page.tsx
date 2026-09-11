'use client'

import { useState, useEffect } from 'react'
import {
  listAcademyPolicies,
  createAcademyPolicy,
  updateAcademyPolicy,
  deleteAcademyPolicy,
  type AcademyPolicy,
  type CreateAcademyPolicyRequest,
} from '@/lib/api/academy-policies'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AcademyPoliciesPage() {
  const [policies, setPolicies] = useState<AcademyPolicy[]>([])
  const [pagination, setPagination] = useState<{ total: number; per_page: number; current_page: number; total_pages: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<AcademyPolicy | null>(null)
  const [formData, setFormData] = useState<CreateAcademyPolicyRequest & { is_active?: boolean }>({
    content_ar: '',
    content_en: '',
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterActive, setFilterActive] = useState<boolean | ''>('')

  useEffect(() => {
    loadPolicies()
  }, [currentPage, filterActive])

  const loadPolicies = async () => {
    setLoading(true)
    try {
      const res = await listAcademyPolicies({
        page: currentPage,
        per_page: 15,
        is_active: filterActive === '' ? undefined : filterActive,
      })
      setPolicies(res.policies || [])
      setPagination(res.pagination || null)
    } catch (err: any) {
      alert(err.message || 'فشل تحميل السياسات')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (policy?: AcademyPolicy) => {
    if (policy) {
      setEditingPolicy(policy)
      setFormData({
        content_ar: policy.content_ar,
        content_en: policy.content_en || '',
        is_active: policy.is_active,
      })
    } else {
      setEditingPolicy(null)
      setFormData({ content_ar: '', content_en: '', is_active: true })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPolicy(null)
    setFormData({ content_ar: '', content_en: '', is_active: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.content_ar?.trim()) {
      alert('يرجى إدخال النص بالعربية')
      return
    }
    setIsSubmitting(true)
    try {
      if (editingPolicy) {
        await updateAcademyPolicy(editingPolicy.id, formData)
        alert('تم تحديث السياسة بنجاح')
      } else {
        await createAcademyPolicy(formData)
        alert('تم إضافة السياسة بنجاح')
      }
      handleCloseModal()
      loadPolicies()
    } catch (err: any) {
      alert(err.message || 'فشل الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه السياسة؟')) return
    try {
      await deleteAcademyPolicy(id)
      loadPolicies()
    } catch (err: any) {
      alert(err.message || 'فشل الحذف')
    }
  }

  return (
    <div className="px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 mb-6 sm:mb-8">سياسات الأكاديمية</h1>

      <div className="bg-white rounded-xl border-2 border-primary-200 shadow-lg mb-6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={String(filterActive)}
              onChange={(e) => {
                const v = e.target.value
                setFilterActive(v === '' ? '' : v === 'true')
                setCurrentPage(1)
              }}
              className="px-3 py-2 border-2 border-primary-200 rounded-lg"
            >
              <option value="">جميع الحالات</option>
              <option value="true">نشط</option>
              <option value="false">غير نشط</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            إضافة سياسة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-primary-600">جاري التحميل...</div>
      ) : policies.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-primary-200 p-12 text-center text-primary-600">
          لا توجد سياسات. أضف سياسة جديدة.
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => (
            <motion.div
              key={policy.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-primary-200 p-4 sm:p-6 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-primary-900 whitespace-pre-wrap font-medium">{policy.content}</p>
                  <span
                    className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                      policy.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {policy.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(policy)}
                    className="p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                    title="تعديل"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(policy.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 border-2 border-primary-200 rounded-lg disabled:opacity-50"
          >
            السابق
          </button>
          <span className="py-2 text-primary-700">صفحة {currentPage} من {pagination.total_pages}</span>
          <button
            type="button"
            disabled={currentPage >= pagination.total_pages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 border-2 border-primary-200 rounded-lg disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      )}

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
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary-900">{editingPolicy ? 'تعديل سياسة' : 'إضافة سياسة'}</h2>
                <button type="button" onClick={handleCloseModal} className="p-2 hover:bg-primary-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">النص بالعربية *</label>
                  <textarea
                    value={formData.content_ar}
                    onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg min-h-[120px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">النص بالإنجليزية (اختياري)</label>
                  <textarea
                    value={formData.content_en || ''}
                    onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg min-h-[120px]"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-primary-300"
                    />
                    <span className="text-sm font-medium text-primary-700">نشط</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleCloseModal} className="flex-1 py-2.5 border-2 border-primary-300 rounded-lg text-primary-700 font-medium">
                    إلغاء
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
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
