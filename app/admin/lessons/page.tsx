'use client'

import { useState, useEffect, useRef } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { Plus, Edit, Trash2, X, Eye, Search, Video, Play, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LessonsPage() {
  const { 
    lessons, 
    lessonsMeta,
    isLoadingLessons, 
    fetchLessons, 
    getLesson,
    addLesson, 
    updateLesson, 
    deleteLesson,
    error 
  } = useAdminStore()
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewedLesson, setViewedLesson] = useState<any>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    title_en: '',
    description: '',
    description_en: '',
  })
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchLessons({ page: currentPage, per_page: 15 })
  }, [fetchLessons, currentPage])

  // Filter by search term (client-side)
  const filteredLessons = lessons.filter((lesson) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      lesson.title_ar?.toLowerCase().includes(search) ||
      lesson.title?.toLowerCase().includes(search) ||
      lesson.title_en?.toLowerCase().includes(search) ||
      lesson.description_ar?.toLowerCase().includes(search) ||
      lesson.description?.toLowerCase().includes(search) ||
      lesson.description_en?.toLowerCase().includes(search)
    )
  })

  const handleViewLesson = async (id: number) => {
    try {
      const lesson = await getLesson(id)
      setViewedLesson(lesson)
      setShowViewModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات الدرس')
    }
  }

  const handleOpenModal = (lesson?: any) => {
    if (lesson) {
      setEditingId(lesson.id)
      setFormData({
        title: lesson.title_ar || lesson.title || '',
        title_en: lesson.title_en || '',
        description: lesson.description_ar || lesson.description || '',
        description_en: lesson.description_en || '',
      })
      setVideoPreview(lesson.video || null)
      setVideoFile(null)
    } else {
      setEditingId(null)
      setFormData({
        title: '',
        title_en: '',
        description: '',
        description_en: '',
      })
      setVideoPreview(null)
      setVideoFile(null)
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({
      title: '',
      title_en: '',
      description: '',
      description_en: '',
    })
    setVideoPreview(null)
    setVideoFile(null)
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm']
      if (!validTypes.includes(file.type)) {
        alert('نوع الملف غير مدعوم. الرجاء اختيار ملف فيديو (mp4, avi, mov, wmv, flv, webm)')
        return
      }
      
      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('حجم الملف كبير جداً. الحد الأقصى هو 50 ميجابايت')
        return
      }
      
      setVideoFile(file)
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
    }
  }

  const handleRemoveVideo = () => {
    setVideoFile(null)
    setVideoPreview(null)
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const lessonData: any = {
        title: formData.title,
        description: formData.description,
      }
      
      if (formData.title_en) lessonData.title_en = formData.title_en
      if (formData.description_en) lessonData.description_en = formData.description_en
      
      // For new lesson, video is required
      if (!editingId && !videoFile) {
        alert('الرجاء اختيار ملف فيديو')
        setIsSubmitting(false)
        return
      }
      
      // If video file is selected, include it
      if (videoFile) {
        lessonData.video = videoFile
      }
      
      if (editingId) {
        await updateLesson(editingId, lessonData)
      } else {
        await addLesson(lessonData)
      }
      
      handleCloseModal()
    } catch (error: any) {
      alert(error.message || 'فشل حفظ الدرس')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return
    
    try {
      await deleteLesson(id)
    } catch (error: any) {
      alert(error.message || 'فشل حذف الدرس')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary-900">فيديوهات من الحصص</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة درس جديد
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
          <input
            type="text"
            placeholder="البحث في الدروس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pr-12 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
            dir="rtl"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-right">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoadingLessons ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Lessons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.length === 0 ? (
              <div className="col-span-full text-center py-12 text-primary-600">
                {searchTerm
                  ? 'لا توجد نتائج'
                  : 'لا توجد دروس مسجلة بعد'}
              </div>
            ) : (
              filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white p-6 rounded-xl border-2 border-primary-200 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-primary-900 mb-2">{lesson.title_ar || lesson.title}</h3>
                    <p className="text-primary-700 text-sm leading-relaxed line-clamp-3">
                      {lesson.description_ar || lesson.description}
                    </p>
                  </div>
                  
                  {lesson.video && (
                    <div className="mb-4 relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
                      <video
                        src={lesson.video}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-primary-200">
                    <button
                      onClick={() => handleViewLesson(lesson.id)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(lesson)}
                      className="px-4 py-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(lesson.id)}
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
          {lessonsMeta && lessonsMeta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-primary-200">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="px-4 py-2 text-primary-700">
                صفحة {currentPage} من {lessonsMeta.last_page}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= lessonsMeta.last_page}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* View Lesson Details Modal */}
      <AnimatePresence>
        {showViewModal && viewedLesson && (
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
              className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">تفاصيل الدرس</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {viewedLesson.video && (
                  <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
                    <video
                      src={viewedLesson.video}
                      className="w-full h-full object-cover"
                      controls
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">العنوان (عربي)</label>
                    <p className="text-primary-900 font-semibold">{viewedLesson.title_ar || viewedLesson.title}</p>
                  </div>
                  {viewedLesson.title_en && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">العنوان (إنجليزي)</label>
                      <p className="text-primary-900">{viewedLesson.title_en}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="block text-primary-600 text-sm mb-1">الوصف (عربي)</label>
                    <p className="text-primary-900">{viewedLesson.description_ar || viewedLesson.description}</p>
                  </div>
                  {viewedLesson.description_en && (
                    <div className="col-span-2">
                      <label className="block text-primary-600 text-sm mb-1">الوصف (إنجليزي)</label>
                      <p className="text-primary-900">{viewedLesson.description_en}</p>
                    </div>
                  )}
                  {viewedLesson.created_at && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">تاريخ الإنشاء</label>
                      <p className="text-primary-900">{new Date(viewedLesson.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                  )}
                  {viewedLesson.updated_at && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">تاريخ التحديث</label>
                      <p className="text-primary-900">{new Date(viewedLesson.updated_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                  )}
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
              className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">
                  {editingId ? 'تعديل درس' : 'إضافة درس جديد'}
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
                  <label className="block text-primary-900 font-semibold mb-2 text-right">العنوان (عربي) *</label>
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
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الوصف (عربي) *</label>
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
                
                {/* Video Upload */}
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">
                    ملف الفيديو {!editingId && '*'}
                  </label>
                  {videoPreview ? (
                    <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video mb-2">
                      <video
                        src={videoPreview}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-primary-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
                    >
                      <Video className="w-12 h-12 mx-auto mb-4 text-primary-400" />
                      <p className="text-primary-700 font-medium mb-2">اضغط لرفع ملف فيديو</p>
                      <p className="text-sm text-primary-500">mp4, avi, mov, wmv, flv, webm (حد أقصى 50 ميجابايت)</p>
                    </div>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/avi,video/quicktime,video/x-ms-wmv,video/x-flv,video/webm"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  {!videoPreview && !editingId && (
                    <p className="text-sm text-red-600 mt-1">ملف الفيديو مطلوب</p>
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

