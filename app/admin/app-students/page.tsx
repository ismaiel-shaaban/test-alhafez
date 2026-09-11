'use client'

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { useAdminPermissions } from '@/hooks/useAdminPermissions'
import { Search, Eye, X, Edit, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchableTeacherSelect from '@/components/admin/SearchableTeacherSelect'
import {
  parseWeeklyScheduleFromApi,
  parseWeeklyDaysFromApi,
  toApiWeeklySchedule,
  toApiWeeklyDays,
  type WeeklyScheduleForm,
  type WeeklyDaysForm,
} from '@/lib/weekly-schedule-utils'

const DAYS_OF_WEEK = [
  { value: 'saturday', label: 'السبت', arName: 'السبت' },
  { value: 'sunday', label: 'الأحد', arName: 'الأحد' },
  { value: 'monday', label: 'الإثنين', arName: 'الإثنين' },
  { value: 'tuesday', label: 'الثلاثاء', arName: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء', arName: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس', arName: 'الخميس' },
  { value: 'friday', label: 'الجمعة', arName: 'الجمعة' },
]

export default function AppStudentsPage() {
  const { canDeleteStudents } = useAdminPermissions()
  const { 
    students, 
    isLoadingStudents, 
    fetchStudents, 
    getStudent,
    updateStudent,
    deleteStudent,
    packages,
    fetchPackages,
    teachers,
    fetchTeachers,
    error 
  } = useAdminStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [trialSessionFilter, setTrialSessionFilter] = useState<'not_booked' | 'booked' | 'attended' | ''>('')
  const [teacherFilterId, setTeacherFilterId] = useState<string>('')
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [viewedStudent, setViewedStudent] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [updatingTrialAttendance, setUpdatingTrialAttendance] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '' as 'male' | 'female' | '',
    package_id: '',
    teacher_id: '',
    hour: '',
    monthly_sessions: '',
    weekly_sessions: '',
    weekly_days: [] as WeeklyDaysForm,
    weekly_schedule: {} as WeeklyScheduleForm,
    useWeeklySchedule: false,
    session_duration: '',
    hourly_rate: '',
    notes: '',
    password: '',
    trial_session_attendance: '' as 'not_booked' | 'booked' | 'attended' | '',
    monthly_subscription_price: '',
    paid_months_count: '',
    country: '',
    currency: '',
  })

  useEffect(() => {
    // Fetch only app students with filters
    const filters: any = { type: 'app' }
    if (trialSessionFilter) filters.trial_session_attendance = trialSessionFilter
    if (teacherFilterId) filters.teacher_id = parseInt(teacherFilterId)
    fetchStudents(filters)
    fetchPackages()
    fetchTeachers(1, 1000)
  }, [fetchStudents, fetchPackages, fetchTeachers, trialSessionFilter, teacherFilterId])

  const handleViewStudent = async (id: number) => {
    try {
      const student = await getStudent(id)
      setViewedStudent(student)
      setViewingId(id)
      setShowViewModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات الطالب')
    }
  }

  const handleEdit = (student: any) => {
    setEditingId(student.id)
    // Check if student has weekly_schedule (takes precedence)
    const hasWeeklySchedule = student.weekly_schedule && typeof student.weekly_schedule === 'object' && Object.keys(student.weekly_schedule).length > 0
    setEditForm({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      age: student.age?.toString() || '',
      gender: student.gender || '',
      package_id: student.package_id?.toString() || '',
      teacher_id: student.teacher_id?.toString() || '',
      hour: student.hour || '',
      monthly_sessions: student.monthly_sessions?.toString() || '',
      weekly_sessions: student.weekly_sessions?.toString() || '',
      weekly_days: parseWeeklyDaysFromApi(student.weekly_days as any),
      weekly_schedule: hasWeeklySchedule ? parseWeeklyScheduleFromApi(student.weekly_schedule as any) : {},
      useWeeklySchedule: hasWeeklySchedule,
      session_duration: student.session_duration?.toString() || '',
      hourly_rate: student.hourly_rate?.toString() || '',
      notes: student.notes || '',
      password: '', // Don't populate password field for security
      trial_session_attendance: student.trial_session_attendance || '',
      monthly_subscription_price: student.monthly_subscription_price?.toString() || '',
      paid_months_count: student.paid_months_count?.toString() ?? '',
      country: student.country || '',
      currency: student.currency || '',
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      setIsSubmitting(true)
      try {
        // Build request data - weekly_schedule takes precedence over hour and weekly_days
        const updateData: any = {
          name: editForm.name,
          email: editForm.email || undefined,
          phone: editForm.phone,
          age: editForm.age ? parseInt(editForm.age) : undefined,
          gender: editForm.gender as 'male' | 'female',
          package_id: editForm.package_id ? parseInt(editForm.package_id) : undefined,
          teacher_id: editForm.teacher_id ? parseInt(editForm.teacher_id) : undefined,
          monthly_sessions: editForm.monthly_sessions ? parseInt(editForm.monthly_sessions) : undefined,
          weekly_sessions: editForm.weekly_sessions ? parseInt(editForm.weekly_sessions) : undefined,
          session_duration: editForm.session_duration ? parseInt(editForm.session_duration) : undefined,
          hourly_rate: editForm.hourly_rate ? parseFloat(editForm.hourly_rate) : undefined,
          notes: editForm.notes || undefined,
          password: editForm.password || undefined,
          trial_session_attendance: editForm.trial_session_attendance || undefined,
          monthly_subscription_price: editForm.monthly_subscription_price ? parseFloat(editForm.monthly_subscription_price) : undefined,
          paid_months_count: editForm.paid_months_count !== '' ? parseInt(editForm.paid_months_count) : undefined,
          country: editForm.country || undefined,
          currency: editForm.currency || undefined,
        }

        // If using weekly_schedule, send it (takes precedence)
        if (editForm.useWeeklySchedule && Object.keys(editForm.weekly_schedule).length > 0) {
          updateData.weekly_schedule = toApiWeeklySchedule(editForm.weekly_schedule)
        } else {
          if (editForm.hour) updateData.hour = editForm.hour
          if (editForm.weekly_days.length > 0) updateData.weekly_days = toApiWeeklyDays(editForm.weekly_days)
        }

        await updateStudent(editingId, updateData)
        setEditingId(null)
        setEditForm({
          name: '',
          email: '',
          phone: '',
          age: '',
          gender: '' as 'male' | 'female' | '',
          package_id: '',
          teacher_id: '',
          hour: '',
          monthly_sessions: '',
          weekly_sessions: '',
          weekly_days: [],
          weekly_schedule: {},
          useWeeklySchedule: false,
          session_duration: '',
          hourly_rate: '',
          notes: '',
          password: '',
          trial_session_attendance: '',
          monthly_subscription_price: '',
          paid_months_count: '',
          country: '',
          currency: '',
        })
        setShowEditModal(false)
        // Refresh the list
        const filters: any = { type: 'app' }
        if (trialSessionFilter) filters.trial_session_attendance = trialSessionFilter
        if (teacherFilterId) filters.teacher_id = parseInt(teacherFilterId)
        fetchStudents(filters)
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء التحديث')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingId(null)
    setEditForm({
      name: '',
      email: '',
      phone: '',
      age: '',
      gender: '' as 'male' | 'female' | '',
      package_id: '',
      teacher_id: '',
      hour: '',
      monthly_sessions: '',
      weekly_sessions: '',
      weekly_days: [],
      weekly_schedule: {},
      useWeeklySchedule: false,
      session_duration: '',
      hourly_rate: '',
      notes: '',
      password: '',
      trial_session_attendance: '',
      monthly_subscription_price: '',
      paid_months_count: '',
      country: '',
      currency: '',
    })
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      try {
        await deleteStudent(id)
        // Refresh the list
        const filters: any = { type: 'app' }
        if (trialSessionFilter) filters.trial_session_attendance = trialSessionFilter
        if (teacherFilterId) filters.teacher_id = parseInt(teacherFilterId)
        fetchStudents(filters)
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء الحذف')
      }
    }
  }

  const handleUpdateTrialAttendance = async (studentId: number, newStatus: 'not_booked' | 'booked' | 'attended') => {
    setUpdatingTrialAttendance(studentId)
    try {
      await updateStudent(studentId, { trial_session_attendance: newStatus })
      // Refresh the list
      const filters: any = { type: 'app' }
      if (trialSessionFilter) filters.trial_session_attendance = trialSessionFilter
      if (teacherFilterId) filters.teacher_id = parseInt(teacherFilterId)
      fetchStudents(filters)
      // Update viewed student if it's the same
      if (viewingId === studentId) {
        const updatedStudent = await getStudent(studentId)
        setViewedStudent(updatedStudent)
      }
    } catch (error: any) {
      alert(error.message || 'فشل تحديث حالة جلسة التجربة')
    } finally {
      setUpdatingTrialAttendance(null)
    }
  }

  const getTrialAttendanceBadge = (status?: string) => {
    if (!status) return null
    switch (status) {
      case 'not_booked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            غير محجوز
          </span>
        )
      case 'booked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            محجوز
          </span>
        )
      case 'attended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            حضر
          </span>
        )
      default:
        return null
    }
  }

  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      student.name.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search) ||
      student.phone.toLowerCase().includes(search) ||
      student.package?.name.toLowerCase().includes(search) ||
      student.teacher?.name.toLowerCase().includes(search)
    )
  })

  // Filter to only show app students (double check)
  const appStudents = filteredStudents.filter(student => student.type === 'app')

  return (
    <div className="min-w-0 px-3 sm:px-4 lg:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-primary-900">الطلاب الجدد من التطبيق</h1>
        <div className="text-primary-600 font-medium text-sm sm:text-base shrink-0">إجمالي: {appStudents.length}</div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg sm:rounded-xl border-2 border-primary-200 p-3 sm:p-4 mb-4 sm:mb-6 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 min-w-0">
          <div className="relative min-w-0">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن طالب..."
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
          <div className="min-w-0">
            <select
              value={trialSessionFilter}
              onChange={(e) => setTrialSessionFilter(e.target.value as 'not_booked' | 'booked' | 'attended' | '')}
              className="w-full min-w-0 px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
              dir="rtl"
            >
              <option value="">جميع الحالات</option>
              <option value="not_booked">غير محجوز</option>
              <option value="booked">محجوز</option>
              <option value="attended">حضر</option>
            </select>
          </div>
          <div className="min-w-0">
            <SearchableTeacherSelect
              value={teacherFilterId}
              onChange={(value) => setTeacherFilterId(value)}
              teachers={teachers}
              placeholder="جميع المعلمين"
            />
          </div>
        </div>
      </div>

      {/* Students Content */}
      {isLoadingStudents ? (
        <div className="flex items-center justify-center py-10 sm:py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : appStudents.length === 0 ? (
        <div className="bg-white rounded-lg sm:rounded-xl border-2 border-primary-200 p-6 sm:p-8 text-center text-primary-600 text-sm sm:text-base shadow-lg">
          {searchTerm || trialSessionFilter || teacherFilterId ? 'لا توجد نتائج' : 'لا يوجد طلاب مسجلون من التطبيق بعد'}
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 sm:space-y-4">
            {appStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-lg sm:rounded-xl border-2 border-primary-200 p-3 sm:p-4 shadow-lg overflow-hidden min-w-0"
              >
                <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-primary-900 truncate min-w-0">{student.name}</h3>
                </div>
                <div className="space-y-2 text-sm min-w-0">
                  <div className="flex justify-between gap-2 min-w-0">
                    <span className="text-primary-600 shrink-0">الهاتف:</span>
                    <span className="text-primary-900 font-medium truncate text-left" dir="ltr">{student.phone}</span>
                  </div>
                  {student.email && (
                    <div className="flex justify-between gap-2 min-w-0">
                      <span className="text-primary-600 shrink-0">البريد:</span>
                      <span className="text-primary-900 truncate text-left min-w-0">{student.email}</span>
                    </div>
                  )}
                  {student.age && (
                    <div className="flex justify-between">
                      <span className="text-primary-600">العمر:</span>
                      <span className="text-primary-900">{student.age}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-primary-600">الجنس:</span>
                    <span className="text-primary-900">{student.gender_label || (student.gender === 'male' ? 'ذكر' : 'أنثى')}</span>
                  </div>
                  {student.package?.name && (
                    <div className="flex justify-between">
                      <span className="text-primary-600">الباقة:</span>
                      <span className="text-primary-900 truncate min-w-0">{student.package.name}</span>
                    </div>
                  )}
                  {student.teacher?.name && (
                    <div className="flex justify-between">
                      <span className="text-primary-600">المعلم:</span>
                      <span className="text-primary-900 truncate min-w-0">{student.teacher.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-primary-600">جلسة التجربة:</span>
                    <div className="flex flex-col items-end gap-2">
                      {getTrialAttendanceBadge(student.trial_session_attendance)}
                      <select
                        value={student.trial_session_attendance || 'not_booked'}
                        onChange={(e) => handleUpdateTrialAttendance(student.id, e.target.value as 'not_booked' | 'booked' | 'attended')}
                        disabled={updatingTrialAttendance === student.id}
                        className="text-xs px-2 py-1 border border-primary-300 rounded-lg focus:border-primary-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        dir="rtl"
                      >
                        <option value="not_booked">غير محجوز</option>
                        <option value="booked">محجوز</option>
                        <option value="attended">حضر</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center flex-wrap gap-1 sm:gap-2 mt-4 pt-4 border-t border-primary-200">
                  <button
                    onClick={() => handleViewStudent(student.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="عرض التفاصيل"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(student)}
                    className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {canDeleteStudents && (
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg lg:rounded-xl border-2 border-primary-200 overflow-hidden shadow-lg min-w-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm lg:text-base table-fixed" style={{ tableLayout: 'fixed', minWidth: 0 }}>
                <colgroup>
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '16%' }} />
                </colgroup>
                <thead className="bg-primary-100">
                  <tr>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-right text-primary-900 font-semibold whitespace-nowrap truncate">الاسم</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-right text-primary-900 font-semibold whitespace-nowrap truncate">البريد</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-right text-primary-900 font-semibold whitespace-nowrap truncate">الهاتف</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-right text-primary-900 font-semibold whitespace-nowrap">العمر</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-right text-primary-900 font-semibold whitespace-nowrap">الجنس</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-right text-primary-900 font-semibold whitespace-nowrap truncate">الباقة</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-right text-primary-900 font-semibold whitespace-nowrap truncate">المعلم</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-center text-primary-900 font-semibold whitespace-nowrap truncate">جلسة التجربة</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-center text-primary-900 font-semibold whitespace-nowrap">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {appStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-primary-200 hover:bg-primary-50 transition-colors"
                    >
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-900 font-medium truncate" title={student.name}>{student.name}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700 truncate" title={student.email || ''}>{student.email || '-'}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700 truncate" dir="ltr" title={student.phone}>{student.phone}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700">{student.age || '-'}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700">{student.gender_label || (student.gender === 'male' ? 'ذكر' : 'أنثى')}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700 truncate" title={student.package?.name || ''}>{student.package?.name || '-'}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700 truncate" title={student.teacher?.name || ''}>{student.teacher?.name || '-'}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                        <div className="flex flex-col items-center gap-2">
                          {getTrialAttendanceBadge(student.trial_session_attendance)}
                          <select
                            value={student.trial_session_attendance || 'not_booked'}
                            onChange={(e) => handleUpdateTrialAttendance(student.id, e.target.value as 'not_booked' | 'booked' | 'attended')}
                            disabled={updatingTrialAttendance === student.id}
                            className="text-xs px-2 py-1 border border-primary-300 rounded-lg focus:border-primary-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            dir="rtl"
                          >
                            <option value="not_booked">غير محجوز</option>
                            <option value="booked">محجوز</option>
                            <option value="attended">حضر</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewStudent(student.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {canDeleteStudents && (
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* View Student Details Modal */}
      <AnimatePresence>
        {showViewModal && viewedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900 min-w-0">تفاصيل الطالب</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الاسم</label>
                    <p className="text-primary-900 font-semibold text-lg">{viewedStudent.name}</p>
                  </div>
                  {viewedStudent.email && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">البريد الإلكتروني</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.email}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">رقم الهاتف</label>
                    <p className="text-primary-900 font-semibold text-lg">{viewedStudent.phone}</p>
                  </div>
                  {viewedStudent.age && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">العمر</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.age} سنة</p>
                    </div>
                  )}
                  {viewedStudent.gender_label && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">الجنس</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.gender_label}</p>
                    </div>
                  )}
                  {viewedStudent.package && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">الباقة</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.package.name}</p>
                    </div>
                  )}
                  {viewedStudent.teacher && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">المعلم</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.teacher.name}</p>
                    </div>
                  )}
                  {viewedStudent.trial_session_attendance && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">حالة جلسة التجربة</label>
                      <p className="text-primary-900 font-semibold text-lg">
                        {viewedStudent.trial_session_attendance_label || 
                         (viewedStudent.trial_session_attendance === 'not_booked' ? 'غير محجوز' :
                          viewedStudent.trial_session_attendance === 'booked' ? 'محجوز' : 'حضر')}
                      </p>
                    </div>
                  )}
                  {viewedStudent.monthly_subscription_price && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">سعر الاشتراك الشهري</label>
                      <p className="text-primary-900 font-semibold text-lg">
                        {viewedStudent.monthly_subscription_price} {viewedStudent.currency || 'EGP'}
                      </p>
                    </div>
                  )}
                  {viewedStudent.country && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">البلد</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.country}</p>
                    </div>
                  )}
                  {viewedStudent.currency && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">العملة</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.currency}</p>
                    </div>
                  )}
                  {viewedStudent.hour && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">وقت الحصة</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.hour}</p>
                    </div>
                  )}
                  {viewedStudent.monthly_sessions && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">عدد الحصص الشهرية</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.monthly_sessions}</p>
                    </div>
                  )}
                  {viewedStudent.weekly_sessions && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">عدد الحصص الأسبوعية</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.weekly_sessions}</p>
                    </div>
                  )}
                  {viewedStudent.session_duration && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">مدة الحصة (دقيقة)</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.session_duration}</p>
                    </div>
                  )}
                  {viewedStudent.hourly_rate && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">سعر الساعة</label>
                      <p className="text-primary-900 font-semibold text-lg">{viewedStudent.hourly_rate} جنيه</p>
                    </div>
                  )}
                  {viewedStudent.created_at && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">تاريخ التسجيل</label>
                      <p className="text-primary-900 font-semibold text-lg">
                        {new Date(viewedStudent.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {viewedStudent.weekly_schedule && Object.keys(viewedStudent.weekly_schedule).length > 0 && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-2">الجدول الأسبوعي</label>
                    <div className="bg-primary-50 rounded-lg p-4">
                      {Object.entries(viewedStudent.weekly_schedule).map(([day, val]) => {
                        const dayObj = DAYS_OF_WEEK.find(d => d.value === day || d.arName === day)
                        const timeStr = typeof val === 'string' ? val : (val as any)?.time
                        const dur = typeof val === 'object' && val && 'session_duration' in val ? (val as any).session_duration : null
                        return (
                          <div key={day} className="flex items-center justify-between py-2 border-b border-primary-200 last:border-0">
                            <span className="text-primary-900 font-medium">{dayObj?.label || day}</span>
                            <span className="text-primary-700">{timeStr || '-'}{dur != null ? ` (${dur} د)` : ''}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {viewedStudent.weekly_days && viewedStudent.weekly_days.length > 0 && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-2">أيام الأسبوع</label>
                    <div className="flex flex-wrap gap-2">
                      {viewedStudent.weekly_days.map((item: any) => {
                        const day = typeof item === 'string' ? item : item?.day
                        const dayObj = DAYS_OF_WEEK.find(d => d.value === day)
                        const dur = typeof item === 'object' && item?.session_duration != null ? ` (${item.session_duration} د)` : ''
                        return (
                          <span
                            key={day}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm"
                          >
                            {dayObj?.label || day}{dur}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {viewedStudent.notes && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">ملاحظات</label>
                    <p className="text-primary-900 bg-primary-50 rounded-lg p-4">{viewedStudent.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={handleCloseEditModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900 min-w-0">تعديل بيانات الطالب</h2>
                <button
                  onClick={handleCloseEditModal}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">الاسم الكامل</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">البريد الإلكتروني (اختياري)</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">العمر (اختياري)</label>
                    <input
                      type="number"
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                      min="1"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">الجنس</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as 'male' | 'female' })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                      required
                    >
                      <option value="">اختر الجنس</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">الباقة</label>
                    <select
                      value={editForm.package_id}
                      onChange={(e) => setEditForm({ ...editForm, package_id: e.target.value })}
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
                    <label className="block text-primary-900 font-semibold mb-2 text-right">المعلم</label>
                    <SearchableTeacherSelect
                      value={editForm.teacher_id}
                      onChange={(value) => setEditForm({ ...editForm, teacher_id: value })}
                      teachers={teachers}
                      placeholder="اختر المعلم (اختياري)"
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">حالة جلسة التجربة</label>
                    <select
                      value={editForm.trial_session_attendance}
                      onChange={(e) => setEditForm({ ...editForm, trial_session_attendance: e.target.value as 'not_booked' | 'booked' | 'attended' | '' })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                    >
                      <option value="">اختر الحالة</option>
                      <option value="not_booked">غير محجوز</option>
                      <option value="booked">محجوز</option>
                      <option value="attended">حضر</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">سعر الاشتراك الشهري</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.monthly_subscription_price}
                      onChange={(e) => setEditForm({ ...editForm, monthly_subscription_price: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">عدد الأشهر المدفوعة</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.paid_months_count === '' ? '' : editForm.paid_months_count}
                      onChange={(e) => setEditForm({ ...editForm, paid_months_count: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">البلد</label>
                    <select
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                    >
                      <option value="">اختر البلد</option>
                      <option value="الأردن">الأردن</option>
                      <option value="مصر">مصر</option>
                      <option value="السعودية">السعودية</option>
                      <option value="الإمارات">الإمارات</option>
                      <option value="قطر">قطر</option>
                      <option value="الكويت">الكويت</option>
                      <option value="فلسطين">فلسطين</option>
                      <option value="أمريكا">أمريكا</option>
                      <option value="كندا">كندا</option>
                      <option value="ألمانيا">ألمانيا</option>
                      <option value="أجنبي">أجنبي</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">العملة</label>
                    <select
                      value={editForm.currency}
                      onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                    >
                      <option value="">اختر العملة</option>
                      <option value="JOD">دينار أردني (JOD)</option>
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="AED">درهم إماراتي (AED)</option>
                      <option value="QAR">ريال قطري (QAR)</option>
                      <option value="KWD">دينار كويتي (KWD)</option>
                      <option value="ILS">شيكل (ILS)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="CAD">دولار كندي (CAD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">وقت الحصة</label>
                    <input
                      type="time"
                      value={editForm.hour}
                      onChange={(e) => setEditForm({ ...editForm, hour: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                      placeholder="HH:mm"
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">عدد الحصص الشهرية</label>
                    <input
                      type="number"
                      value={editForm.monthly_sessions}
                      onChange={(e) => setEditForm({ ...editForm, monthly_sessions: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">عدد الحصص الأسبوعية</label>
                    <input
                      type="number"
                      value={editForm.weekly_sessions}
                      onChange={(e) => setEditForm({ ...editForm, weekly_sessions: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">مدة الحصة (بالدقائق)</label>
                    <input
                      type="number"
                      value={editForm.session_duration}
                      onChange={(e) => setEditForm({ ...editForm, session_duration: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">سعر الساعة (جنيه)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.hourly_rate}
                      onChange={(e) => setEditForm({ ...editForm, hourly_rate: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <label className="block text-primary-900 font-semibold text-sm sm:text-base">جدول الأسبوع</label>
                    <label className="flex items-center gap-2 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={editForm.useWeeklySchedule}
                        onChange={(e) => setEditForm({ ...editForm, useWeeklySchedule: e.target.checked })}
                        className="w-4 h-4 shrink-0 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-primary-700 text-xs sm:text-sm">استخدام جدول متقدم (وقت مختلف لكل يوم)</span>
                    </label>
                  </div>
                  
                  {editForm.useWeeklySchedule ? (
                    <div className="space-y-3 p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                      <p className="text-sm text-primary-600 mb-3">حدد وقت الحصة ومدة الحصة (اختياري) لكل يوم</p>
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day.value} className="flex items-center gap-3 flex-wrap">
                          <label className="w-24 text-primary-700 font-medium">{day.label}</label>
                          <input
                            type="time"
                            value={editForm.weekly_schedule[day.value]?.time || ''}
                            onChange={(e) => {
                              const newSchedule = { ...editForm.weekly_schedule }
                              if (e.target.value) {
                                newSchedule[day.value] = { ...(newSchedule[day.value] || { time: '', session_duration: '' }), time: e.target.value }
                              } else {
                                delete newSchedule[day.value]
                              }
                              setEditForm({ ...editForm, weekly_schedule: newSchedule })
                            }}
                            className="flex-1 min-w-[100px] px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                          />
                          <input
                            type="number"
                            min="1"
                            max="180"
                            placeholder="مدة (د)"
                            value={editForm.weekly_schedule[day.value]?.session_duration || ''}
                            onChange={(e) => {
                              const newSchedule = { ...editForm.weekly_schedule }
                              if (newSchedule[day.value]) {
                                newSchedule[day.value] = { ...newSchedule[day.value], session_duration: e.target.value }
                              }
                              setEditForm({ ...editForm, weekly_schedule: newSchedule })
                            }}
                            className="w-20 px-2 py-2 border-2 border-primary-200 rounded-lg text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-primary-900 font-semibold mb-2 text-right">وقت الحصة الافتراضي</label>
                        <input
                          type="time"
                          value={editForm.hour}
                          onChange={(e) => setEditForm({ ...editForm, hour: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                          placeholder="HH:mm"
                        />
                      </div>
                      <div>
                        <label className="block text-primary-900 font-semibold mb-2 text-right">أيام الأسبوع</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <label key={day.value} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editForm.weekly_days.some((d) => d.day === day.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditForm({ ...editForm, weekly_days: [...editForm.weekly_days, { day: day.value, session_duration: '' }] })
                                  } else {
                                    setEditForm({ ...editForm, weekly_days: editForm.weekly_days.filter((d) => d.day !== day.value) })
                                  }
                                }}
                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                              />
                              <span className="text-primary-700">{day.label}</span>
                            </label>
                          ))}
                        </div>
                        {editForm.weekly_days.length > 0 && (
                          <div className="space-y-2 mt-2 p-2 bg-primary-50 rounded-lg">
                            <p className="text-xs text-primary-600 mb-1">مدة الحصة لكل يوم (اختياري)</p>
                            {editForm.weekly_days.map((item) => (
                              <div key={item.day} className="flex items-center gap-2">
                                <span className="text-sm w-20">{DAYS_OF_WEEK.find((d) => d.value === item.day)?.label}</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="180"
                                  placeholder="دقيقة"
                                  value={item.session_duration || ''}
                                  onChange={(e) => setEditForm({
                                    ...editForm,
                                    weekly_days: editForm.weekly_days.map((d) => d.day === item.day ? { ...d, session_duration: e.target.value } : d),
                                  })}
                                  className="w-20 px-2 py-1 border rounded text-sm"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">كلمة المرور (اختياري)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    placeholder="اتركه فارغاً للحفاظ على كلمة المرور الحالية"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">ملاحظات</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    placeholder="ملاحظات اختيارية..."
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="flex-1 px-4 sm:px-6 py-3 border-2 border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-all text-sm sm:text-base"
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

