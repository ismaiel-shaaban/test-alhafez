'use client'

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { Plus, Edit, Trash2, X, Eye, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupervisors, Supervisor } from '@/lib/api/supervisors'
import WhatsAppLink from '@/components/admin/WhatsAppLink'

export default function TeachersPage() {
  const { teachers, teachersMeta, isLoadingTeachers, fetchTeachers, getTeacher, addTeacher, updateTeacher, deleteTeacher, error } = useAdminStore()
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewedTeacher, setViewedTeacher] = useState<any>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [supervisorFilterId, setSupervisorFilterId] = useState<string>('')
  const [withoutSupervisor, setWithoutSupervisor] = useState(false)
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    specialization: '',
    specialization_en: '',
    experience_years: '',
    phone: '',
    email: '',
    password: '',
    trial_lesson_price: '',
    session_link: '',
    supervisor_id: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch supervisors on mount
  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        const data = await getSupervisors({ per_page: 1000 })
        setSupervisors(data?.supervisors || [])
      } catch (error) {
        console.error('Error loading supervisors:', error)
      }
    }
    loadSupervisors()
  }, [])

  // Reset page when search or supervisor filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, supervisorFilterId, withoutSupervisor])

  useEffect(() => {
    const search = searchTerm.trim() || undefined
    const supervisorId = withoutSupervisor ? undefined : (supervisorFilterId ? parseInt(supervisorFilterId) : undefined)
    fetchTeachers(currentPage, 15, search, supervisorId, withoutSupervisor)
  }, [fetchTeachers, currentPage, searchTerm, supervisorFilterId, withoutSupervisor])

  // Teachers are now filtered on the API side, so we use them directly
  const filteredTeachers = teachers

  const handleViewTeacher = async (id: number) => {
    try {
      const teacher = await getTeacher(id)
      setViewedTeacher(teacher)
      setShowViewModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات المعلم')
    }
  }

  const handleOpenModal = (teacher?: any) => {
    if (teacher) {
      
      setEditingId(teacher.id)
      setFormData({
        name: teacher.name_ar || teacher.name || '',
        name_en: teacher.name_en || '',
        specialization: teacher.specialization_ar || teacher.specialization || '',
        specialization_en: teacher.specialization_en || '',
        experience_years: teacher.experience_years?.toString() || '',
        phone: teacher.phone || '',
        email: teacher.email || '',
        password: '', // Keep empty for security - user can leave it to keep current password
        trial_lesson_price: teacher.trial_lesson_price?.toString() || '',
        session_link: teacher.session_link || '',
        supervisor_id: teacher.supervisor_id?.toString() || '',
      })
      setImageFile(null)
      setImagePreview(teacher.image || null)
    } else {
      setEditingId(null)
      setFormData({ name: '', name_en: '', specialization: '', specialization_en: '', experience_years: '', phone: '', email: '', password: '', trial_lesson_price: '', session_link: '', supervisor_id: '' })
      setImageFile(null)
      setImagePreview(null)
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ name: '', name_en: '', specialization: '', specialization_en: '', experience_years: '', phone: '', email: '', password: '', trial_lesson_price: '', session_link: '', supervisor_id: '' })
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const teacherData: any = {
        name: formData.name,
        name_en: formData.name_en || undefined,
        specialization: formData.specialization,
        specialization_en: formData.specialization_en || undefined,
        experience_years: parseInt(formData.experience_years) || 0,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        password: formData.password || undefined,
        trial_lesson_price: formData.trial_lesson_price ? parseFloat(formData.trial_lesson_price) : undefined,
        session_link: formData.session_link?.trim() || undefined,
        supervisor_id: formData.supervisor_id ? parseInt(formData.supervisor_id) : undefined,
      }
      
      // Add image if a new file is selected
      if (imageFile) {
        teacherData.image = imageFile
      }
      
      if (editingId) {
        teacherData._method = 'put'
        await updateTeacher(editingId, teacherData)
      } else {
        await addTeacher(teacherData)
      }
      handleCloseModal()
      // Keep same page and filters after add/update
      const search = searchTerm.trim() || undefined
      const supervisorId = withoutSupervisor ? undefined : (supervisorFilterId ? parseInt(supervisorFilterId) : undefined)
      await fetchTeachers(currentPage, 15, search, supervisorId, withoutSupervisor)
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        alert('يرجى اختيار صورة بصيغة jpeg, jpg, png, أو gif')
        return
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5MB')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
      try {
        await deleteTeacher(id)
        // Keep same page and filters after delete
        const search = searchTerm.trim() || undefined
        const supervisorId = withoutSupervisor ? undefined : (supervisorFilterId ? parseInt(supervisorFilterId) : undefined)
        await fetchTeachers(currentPage, 15, search, supervisorId, withoutSupervisor)
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء الحذف')
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-primary-900">إدارة المعلمين</h1>
        <div className="flex items-center gap-4">
          <div className="text-primary-600 font-medium">إجمالي: { teachersMeta?.total || 0 }</div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            إضافة معلم
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border-2 border-primary-200 p-4 mb-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن معلم..."
              className="w-full pr-12 pl-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
              dir="rtl"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div>
            <select
              value={supervisorFilterId}
              onChange={(e) => {
                setSupervisorFilterId(e.target.value)
                setCurrentPage(1)
              }}
              disabled={withoutSupervisor}
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right disabled:opacity-60 disabled:bg-primary-50"
              dir="rtl"
            >
              <option value="">جميع المشرفين</option>
              {supervisors.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="without_supervisor"
              checked={withoutSupervisor}
              onChange={(e) => {
                setWithoutSupervisor(e.target.checked)
                setCurrentPage(1)
              }}
              className="w-4 h-4 rounded border-2 border-primary-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="without_supervisor" className="text-primary-700 font-medium cursor-pointer">
              بدون مشرف
            </label>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingTeachers ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Teachers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.length === 0 ? (
              <div className="col-span-full text-center py-12 text-primary-600">
                {searchTerm ? 'لا توجد نتائج' : 'لا يوجد معلمون مسجلون بعد'}
              </div>
            ) : (
              filteredTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="bg-white p-6 rounded-xl border-2 border-primary-200 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-300/30 via-accent-green/20 to-primary-400/30 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    {teacher.image ? (
                      <img
                        src={teacher.image}
                        alt={teacher.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initial if image fails to load
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const fallback = document.createElement('span')
                            fallback.className = 'text-2xl font-bold text-primary-700'
                            fallback.textContent = teacher?.name?.charAt(0)
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-primary-700">
                        {teacher?.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <h3 className="text-xl font-bold text-primary-900 text-center">{teacher.name}</h3>
                    <WhatsAppLink phone={teacher.phone} />
                  </div>
                  <p className="text-primary-700 mb-2 text-center">{teacher.specialization}</p>
                  <p className="text-accent-green text-sm font-semibold mb-2 text-center">
                    {teacher.experience_years} سنة خبرة
                  </p>
                  {teacher.supervisor && (
                    <p className="text-primary-600 text-xs mb-4 text-center">
                      المشرف: {teacher.supervisor.name}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleViewTeacher(teacher.id)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(teacher)}
                      className="px-4 py-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id)}
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
          {teachersMeta && teachersMeta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-primary-200">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="px-4 py-2 text-primary-700">
                صفحة {currentPage} من {teachersMeta.last_page}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= teachersMeta.last_page}
                className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* View Teacher Details Modal */}
      <AnimatePresence>
        {showViewModal && viewedTeacher && (
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
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">تفاصيل المعلم</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Teacher Image */}
              {viewedTeacher.image && (
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary-300/30 via-accent-green/20 to-primary-400/30 rounded-full flex items-center justify-center overflow-hidden">
                    <img
                      src={viewedTeacher.image}
                      alt={viewedTeacher.name_ar || viewedTeacher.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          const fallback = document.createElement('span')
                          fallback.className = 'text-4xl font-bold text-primary-700'
                          fallback.textContent = (viewedTeacher?.name_ar || viewedTeacher?.name)?.charAt(0)
                          parent.appendChild(fallback)
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-primary-600 text-sm mb-1">الاسم (عربي)</label>
                  <p className="text-primary-900 font-semibold">{viewedTeacher.name_ar || viewedTeacher.name}</p>
                </div>
                {viewedTeacher.name_en && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الاسم (إنجليزي)</label>
                    <p className="text-primary-900">{viewedTeacher.name_en}</p>
                  </div>
                )}
                <div>
                  <label className="block text-primary-600 text-sm mb-1">التخصص (عربي)</label>
                  <p className="text-primary-900">{viewedTeacher.specialization_ar || viewedTeacher.specialization}</p>
                </div>
                {viewedTeacher.specialization_en && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">التخصص (إنجليزي)</label>
                    <p className="text-primary-900">{viewedTeacher.specialization_en}</p>
                  </div>
                )}
                <div>
                  <label className="block text-primary-600 text-sm mb-1">سنوات الخبرة</label>
                  <p className="text-primary-900">{viewedTeacher.experience_years} سنة</p>
                </div>
                {viewedTeacher.phone && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">رقم الهاتف</label>
                    <p className="text-primary-900 flex items-center gap-2" dir="ltr">
                      {viewedTeacher.phone}
                      <WhatsAppLink phone={viewedTeacher.phone} />
                    </p>
                  </div>
                )}
                {viewedTeacher.supervisor_name && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">المشرف</label>
                    <p className="text-primary-900">{viewedTeacher.supervisor_name}</p>
                  </div>
                )}
                {viewedTeacher.email && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">البريد الإلكتروني</label>
                    <p className="text-primary-900 break-all">{viewedTeacher.email}</p>
                  </div>
                )}
                {viewedTeacher.trial_lesson_price !== undefined && viewedTeacher.trial_lesson_price !== null && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">سعر جلسة التجربة</label>
                    <p className="text-primary-900">{viewedTeacher.trial_lesson_price} جنيه</p>
                  </div>
                )}
                {viewedTeacher.session_link && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">رابط الحلقة</label>
                    <a
                      href={viewedTeacher.session_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline break-all"
                    >
                      {viewedTeacher.session_link}
                    </a>
                  </div>
                )}
                {viewedTeacher.supervisor && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">المشرف</label>
                    <p className="text-primary-900">{viewedTeacher.supervisor.name}</p>
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
                  {editingId ? 'تعديل معلم' : 'إضافة معلم جديد'}
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
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الاسم (عربي)</label>
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
                  <label className="block text-primary-900 font-semibold mb-2 text-right">الاسم (إنجليزي)</label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">التخصص (عربي)</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">التخصص (إنجليزي)</label>
                  <input
                    type="text"
                    value={formData.specialization_en}
                    onChange={(e) => setFormData({ ...formData, specialization_en: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">سنوات الخبرة</label>
                  <input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    placeholder="اختياري - للدخول للمعلم"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder="اختياري - للدخول للمعلم"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">كلمة المرور</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder={editingId ? "اختياري - اتركه فارغاً للحفاظ على كلمة المرور الحالية" : "اختياري - للدخول للمعلم (الحد الأدنى: 6 أحرف)"}
                    minLength={editingId ? undefined : 6}
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">سعر جلسة التجربة</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.trial_lesson_price}
                    onChange={(e) => setFormData({ ...formData, trial_lesson_price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    placeholder="اختياري - سعر جلسة التجربة"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">رابط الحلقة</label>
                  <input
                    type="url"
                    value={formData.session_link}
                    onChange={(e) => setFormData({ ...formData, session_link: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    placeholder="اختياري - مثال: رابط Google Meet"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">المشرف</label>
                  <select
                    value={formData.supervisor_id}
                    onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                  >
                    <option value="">لا يوجد مشرف</option>
                    {supervisors.filter(s => s.is_active).map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">صورة المعلم</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                  />
                  <p className="text-xs text-primary-600 mt-1">اختياري - صيغة: jpeg, png, jpg, gif (الحد الأقصى: 5MB)</p>
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg border-2 border-primary-200"
                      />
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
