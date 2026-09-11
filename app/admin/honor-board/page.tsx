'use client'

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { Plus, Edit, Trash2, X, Eye, Trophy, Search, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchableStudentSelect from '@/components/admin/SearchableStudentSelect'

export default function HonorBoardPage() {
  const { 
    honorBoard, 
    honorBoardMeta,
    isLoadingHonorBoard, 
    fetchHonorBoard, 
    getHonorEntry,
    addHonorEntry, 
    updateHonorEntry, 
    deleteHonorEntry,
    students,
    fetchStudents,
    error 
  } = useAdminStore()
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewedEntry, setViewedEntry] = useState<any>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStudentId, setFilterStudentId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    student_id: '',
    level: '',
    level_en: '',
    achievement: '',
    achievement_en: '',
    certificate_images: [] as File[],
  })

  useEffect(() => {
    fetchHonorBoard()
    fetchStudents({ per_page: 1000000, page: 1 })
  }, [fetchHonorBoard, fetchStudents])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStudentId])

  // Apply API filter when student filter changes
  useEffect(() => {
    const studentId = filterStudentId ? parseInt(filterStudentId) : undefined
    fetchHonorBoard(studentId, currentPage)
  }, [currentPage, filterStudentId, fetchHonorBoard])

  // Filter by search term (client-side)
  const filteredEntries = honorBoard.filter((entry) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      entry.student?.name.toLowerCase().includes(search) ||
      entry.level_ar?.toLowerCase().includes(search) ||
      entry.level?.toLowerCase().includes(search) ||
      entry.achievement_ar?.toLowerCase().includes(search) ||
      entry.achievement?.toLowerCase().includes(search)
    )
  })

  const handleViewEntry = async (id: number) => {
    try {
      const entry = await getHonorEntry(id)
      setViewedEntry(entry)
      setShowViewModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات السجل')
    }
  }

  const handleOpenModal = (entry?: any) => {
    if (entry) {
      setEditingId(entry.id)
      setFormData({
        student_id: entry.student_id?.toString() || '',
        level: entry.level_ar || entry.level || '',
        level_en: entry.level_en || '',
        achievement: entry.achievement_ar || entry.achievement || '',
        achievement_en: entry.achievement_en || '',
        certificate_images: [], // Don't populate file inputs
      })
    } else {
      setEditingId(null)
      setFormData({ 
        student_id: '', 
        level: '', 
        level_en: '', 
        achievement: '', 
        achievement_en: '', 
        certificate_images: [] 
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ 
      student_id: '', 
      level: '', 
      level_en: '', 
      achievement: '', 
      achievement_en: '', 
      certificate_images: [] 
    })
  }

  const handleAddCertificates = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files)
      setFormData({
        ...formData,
        certificate_images: [...formData.certificate_images, ...newFiles],
      })
    }
  }

  const handleRemoveCertificate = (index: number) => {
    setFormData({
      ...formData,
      certificate_images: formData.certificate_images.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const entryData = {
        student_id: parseInt(formData.student_id) || 0,
        level: formData.level,
        level_en: formData.level_en || undefined,
        achievement: formData.achievement,
        achievement_en: formData.achievement_en || undefined,
        certificate_images: formData.certificate_images,
      }
      
      if (editingId) {
        await updateHonorEntry(editingId, entryData)
      } else {
        await addHonorEntry(entryData)
      }
      handleCloseModal()
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      try {
        await deleteHonorEntry(id)
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء الحذف')
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-primary-900">إدارة لوحة الشرف</h1>
        <div className="flex items-center gap-4">
          <div className="text-primary-600 font-medium">إجمالي: {honorBoard.length}</div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            إضافة سجل
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
          <h3 className="text-lg font-semibold text-primary-900">فلترة السجلات</h3>
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
                placeholder="ابحث عن سجل..."
                className="w-full pr-12 pl-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                dir="rtl"
              />
            </div>
          </div>
          <div>
            <label className="block text-primary-900 font-semibold mb-2 text-right">الطالب</label>
            <SearchableStudentSelect
              value={filterStudentId}
              onChange={(value) => setFilterStudentId(value)}
              students={students}
              placeholder="جميع الطلاب"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingHonorBoard ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Honor Board Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.length === 0 ? (
              <div className="col-span-full text-center py-12 text-primary-600">
                {searchTerm || filterStudentId
                  ? 'لا توجد نتائج'
                  : 'لا توجد سجلات مسجلة بعد'}
              </div>
            ) : (
              filteredEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="bg-white p-6 rounded-xl border-2 border-primary-200 shadow-lg hover:shadow-xl transition-all relative"
                >
                  {index < 3 && (
                    <div className="absolute -top-3 -right-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-gold to-accent-gold-light rounded-full flex items-center justify-center shadow-lg">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-300/30 via-accent-green/20 to-primary-400/30 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-700">
                        {entry.student?.name?.charAt(0) || entry?.id?.toString()?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary-900 mb-1">
                        {entry?.student?.name || 'طالب'}
                      </h3>
                      <span className="text-accent-green text-sm font-semibold">{entry.level_ar || entry.level}</span>
                    </div>
                  </div>
                  <p className="text-primary-700 font-medium mb-4">{entry.achievement_ar || entry.achievement}</p>
                  {entry.certificate_images && entry.certificate_images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-primary-600 mb-2">شهادات: {entry.certificate_images.length}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-primary-200">
                    <button
                      onClick={() => handleViewEntry(entry.id)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(entry)}
                      className="px-4 py-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
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
          {honorBoardMeta && honorBoardMeta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-primary-200">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="px-4 py-2 text-primary-700">
                صفحة {currentPage} من {honorBoardMeta.last_page}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= honorBoardMeta.last_page}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* View Entry Details Modal */}
      <AnimatePresence>
        {showViewModal && viewedEntry && (
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
              className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">تفاصيل السجل</h2>
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
                    <label className="block text-primary-600 text-sm mb-1">الطالب</label>
                    <p className="text-primary-900 font-semibold">{viewedEntry.student?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">المستوى (عربي)</label>
                    <p className="text-primary-900">{viewedEntry.level_ar || viewedEntry.level}</p>
                  </div>
                  {viewedEntry.level_en && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">المستوى (إنجليزي)</label>
                      <p className="text-primary-900">{viewedEntry.level_en}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-primary-600 text-sm mb-1">الإنجاز (عربي)</label>
                  <p className="text-primary-900">{viewedEntry.achievement_ar || viewedEntry.achievement}</p>
                </div>
                {viewedEntry.achievement_en && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الإنجاز (إنجليزي)</label>
                    <p className="text-primary-900">{viewedEntry.achievement_en}</p>
                  </div>
                )}
                {viewedEntry.certificate_images && Array.isArray(viewedEntry.certificate_images) && viewedEntry.certificate_images.length > 0 && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-2">صور الشهادات</label>
                    <div className="grid grid-cols-2 gap-4">
                      {viewedEntry.certificate_images.map((url: string, index: number) => (
                        <div key={index} className="border-2 border-primary-200 rounded-lg p-2">
                          <img
                            src={url}
                            alt={`شهادة ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Certificate'
                            }}
                          />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center text-sm text-primary-600 hover:text-primary-800 mt-2"
                          >
                            عرض الصورة
                          </a>
                        </div>
                      ))}
                    </div>
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
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">
                  {editingId ? 'تعديل سجل' : 'إضافة سجل جديد'}
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
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الطالب</label>
                  <SearchableStudentSelect
                    value={formData.student_id}
                    onChange={(value) => setFormData({ ...formData, student_id: value })}
                    students={students}
                    placeholder="اختر الطالب"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">المستوى (عربي)</label>
                  <input
                    type="text"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">المستوى (إنجليزي)</label>
                  <input
                    type="text"
                    value={formData.level_en}
                    onChange={(e) => setFormData({ ...formData, level_en: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الإنجاز (عربي)</label>
                  <textarea
                    value={formData.achievement}
                    onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الإنجاز (إنجليزي)</label>
                  <textarea
                    value={formData.achievement_en}
                    onChange={(e) => setFormData({ ...formData, achievement_en: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">
                    صور الشهادات *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleAddCertificates(e.target.files)}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                  />
                  <p className="text-xs text-primary-600 mt-1">صور الشهادات (jpeg, png, jpg, gif, الحد الأقصى: 5MB لكل صورة)</p>
                  {formData.certificate_images.length > 0 && (
                    <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
                      {formData.certificate_images.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-primary-50 rounded-lg"
                        >
                          <span className="flex-1 text-sm text-primary-700 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertificate(index)}
                            className="px-2 py-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
