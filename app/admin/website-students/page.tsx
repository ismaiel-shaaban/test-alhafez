'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/store/useAdminStore'
import { useAdminPermissions } from '@/hooks/useAdminPermissions'
import { Search, Eye, X, Edit, Trash2, AlertTriangle, Plus, CreditCard, Calendar, CheckCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchableTeacherSelect from '@/components/admin/SearchableTeacherSelect'
import CompactSubscriptionSettings from '@/components/admin/CompactSubscriptionSettings'
import WhatsAppLink from '@/components/admin/WhatsAppLink'
import {
  listPaymentAccounts,
  formatPaymentAccountOption,
  type PaymentAccount,
} from '@/lib/api/payment-accounts'
import { WEBSITE_STUDENT_JOURNEY_STATUS_FILTER_OPTIONS, type StudentFilters, type StudentJourneyStatus } from '@/lib/api/students'
import { studentMatchesSearch, sanitizeStudentPhoneInput } from '@/lib/student-search'
import {
  parseWeeklyScheduleFromApi,
  parseWeeklyDaysFromApi,
  toApiWeeklySchedule,
  deriveSessionCountsFromSchedule,
  type WeeklyScheduleForm,
} from '@/lib/weekly-schedule-utils'

function applyDerivedSessionCounts(
  payload: Record<string, unknown>,
  weeklySchedule: WeeklyScheduleForm
) {
  const counts = deriveSessionCountsFromSchedule({
    useWeeklySchedule: true,
    weekly_schedule: weeklySchedule,
    weekly_days: [],
  })
  if (counts) {
    payload.weekly_sessions = counts.weekly_sessions
    payload.monthly_sessions = counts.monthly_sessions
  }
}

function buildWeeklyScheduleFromStudent(fullStudent: any): WeeklyScheduleForm {
  const hasWeeklySchedule = !!(
    fullStudent.weekly_schedule &&
    typeof fullStudent.weekly_schedule === 'object' &&
    Object.keys(fullStudent.weekly_schedule).length > 0
  )
  if (hasWeeklySchedule) {
    return parseWeeklyScheduleFromApi(fullStudent.weekly_schedule as any)
  }
  const schedule: WeeklyScheduleForm = {}
  const defaultHour = fullStudent.hour || ''
  const defaultDuration = fullStudent.session_duration?.toString() || ''
  for (const item of parseWeeklyDaysFromApi(fullStudent.weekly_days as any)) {
    if (item.day && defaultHour) {
      schedule[item.day] = {
        time: defaultHour,
        session_duration: item.session_duration || defaultDuration,
      }
    }
  }
  return schedule
}

const DAYS_OF_WEEK = [
  { value: 'saturday', label: 'السبت', arName: 'السبت' },
  { value: 'sunday', label: 'الأحد', arName: 'الأحد' },
  { value: 'monday', label: 'الإثنين', arName: 'الإثنين' },
  { value: 'tuesday', label: 'الثلاثاء', arName: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء', arName: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس', arName: 'الخميس' },
  { value: 'friday', label: 'الجمعة', arName: 'الجمعة' },
]

const emptyEditForm = () => ({
  name: '',
  phone: '',
  gender: '' as 'male' | 'female' | '',
  teacher_id: '',
  country: '',
  payment_account_id: '',
  currency: '',
  monthly_subscription_price: '',
  trial_session_attendance: 'not_booked' as 'not_booked' | 'booked' | 'attended',
  trial_session_date: '',
  trial_session_time: '',
  package_id: '',
  weekly_schedule: {} as WeeklyScheduleForm,
  past_months_count: '0',
  paid_months_count: '',
  subscription_start_date: '',
  past_sessions_mode: '' as '' | 'count' | 'date',
  past_sessions_count: '',
})

function resolvePastSessionsFromStudent(fullStudent: any) {
  if (fullStudent.past_sessions_count != null) {
    return {
      past_sessions_mode: 'count' as const,
      past_sessions_count: String(fullStudent.past_sessions_count),
      subscription_start_date: '',
    }
  }
  if (fullStudent.past_sessions_date) {
    const date = String(fullStudent.past_sessions_date).split('T')[0].split(' ')[0]
    return {
      past_sessions_mode: 'date' as const,
      past_sessions_count: '',
      subscription_start_date: date,
    }
  }
  return { past_sessions_mode: '' as const, past_sessions_count: '' }
}

function applyPastSessionsToPayload(
  payload: Record<string, unknown>,
  mode: '' | 'count' | 'date',
  count: string
) {
  if (mode === 'count' && count !== '') {
    payload.past_sessions_count = parseInt(count, 10)
  }
}

export default function WebsiteStudentsPage() {
  const { canDeleteStudents } = useAdminPermissions()
  const { 
    students, 
    isLoadingStudents, 
    fetchStudents, 
    getStudent,
    addStudent,
    updateStudent,
    deleteStudent,
    forceDeleteStudent,
    packages,
    fetchPackages,
    teachers,
    fetchTeachers,
    sessions,
    isLoadingSessions,
    fetchSessions,
    completeSession,
    revertSessionToPending,
    deleteSession,
    updateSubscriptionPaymentStatus,
    error 
  } = useAdminStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [journeyStatusFilter, setJourneyStatusFilter] = useState<StudentJourneyStatus | ''>('')
  const [teacherFilterId, setTeacherFilterId] = useState<string>('')
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [viewedStudent, setViewedStudent] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [updatingTrialAttendance, setUpdatingTrialAttendance] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTeacherSelectModal, setShowTeacherSelectModal] = useState(false)
  const [pendingTrialUpdate, setPendingTrialUpdate] = useState<{ studentId: number; newStatus: 'not_booked' | 'booked' | 'attended' } | null>(null)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [trialSessionDate, setTrialSessionDate] = useState<string>('')
  const [trialSessionTime, setTrialSessionTime] = useState<string>('')
  const [trialSessionDuration, setTrialSessionDuration] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSubscriptionsOnlyModal, setShowSubscriptionsOnlyModal] = useState(false)
  const [selectedStudentForSubscriptions, setSelectedStudentForSubscriptions] = useState<any>(null)
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '' as 'male' | 'female' | '',
    teacher_id: '',
    notes: '',
    country: '',
    payment_account_id: '',
    currency: '',
    monthly_subscription_price: '',
    trial_session_attendance: 'not_booked' as 'not_booked' | 'booked',
    trial_session_date: '',
    trial_session_time: '',
  })
  const [editForm, setEditForm] = useState(emptyEditForm())
  const [editingStudentHasSubscriptions, setEditingStudentHasSubscriptions] = useState(false)
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([])
  const [editLinkedPaymentAccount, setEditLinkedPaymentAccount] = useState<PaymentAccount | null>(null)

  const paymentAccountSelectOptions = useMemo(() => {
    const byId = new Map<number, PaymentAccount>()
    for (const acc of paymentAccounts) byId.set(acc.id, acc)
    if (editLinkedPaymentAccount && !byId.has(editLinkedPaymentAccount.id)) {
      byId.set(editLinkedPaymentAccount.id, editLinkedPaymentAccount)
    }
    return Array.from(byId.values())
  }, [paymentAccounts, editLinkedPaymentAccount])

  const buildListFilters = useCallback((): StudentFilters => {
    const filters: StudentFilters = { type: 'website', per_page: 10000 }
    if (journeyStatusFilter) filters.student_journey_status = journeyStatusFilter
    if (teacherFilterId) filters.teacher_id = parseInt(teacherFilterId)
    return filters
  }, [journeyStatusFilter, teacherFilterId])

  useEffect(() => {
    fetchStudents(buildListFilters())
    fetchPackages()
    fetchTeachers(1, 1000)
    listPaymentAccounts({ is_active: 1, per_page: 500 })
      .then((data) => setPaymentAccounts(data.payment_accounts))
      .catch(() => setPaymentAccounts([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyStatusFilter, teacherFilterId])

  const handleViewSubscriptionsOnly = async (student: any) => {
    try {
      const fullStudent = await getStudent(student.id)
      setSelectedStudentForSubscriptions(fullStudent)
      setShowSubscriptionsOnlyModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل الاشتراكات')
    }
  }

  const handleViewSessions = async (studentId: number) => {
    setSelectedStudentId(studentId)
    await fetchSessions({ student_id: studentId, per_page: 10000 })
    setShowSessionsModal(true)
  }

  const handleToggleSubscriptionPayment = async (subscriptionId: number, currentIsPaid: boolean) => {
    if (!selectedStudentForSubscriptions) return
    try {
      await updateSubscriptionPaymentStatus(subscriptionId, !currentIsPaid)
      const updatedStudent = await getStudent(selectedStudentForSubscriptions.id)
      setSelectedStudentForSubscriptions(updatedStudent)
    } catch (error: any) {
      alert(error.message || 'فشل تحديث حالة الدفع')
    }
  }

  const handleCompleteSession = async (sessionId: number) => {
    if (!selectedStudentId) return
    try {
      await completeSession(sessionId)
      await fetchSessions({ student_id: selectedStudentId, per_page: 10000 })
    } catch (error: any) {
      alert(error.message || 'فشل إتمام الحصة')
    }
  }

  const handleRevertToPending = async (sessionId: number) => {
    if (!selectedStudentId || !confirm('هل أنت متأكد من إرجاع الحصة إلى قيد الانتظار؟')) return
    try {
      await revertSessionToPending(sessionId)
      await fetchSessions({ student_id: selectedStudentId, per_page: 10000 })
    } catch (error: any) {
      alert(error.message || 'فشل إرجاع الحصة قيد الانتظار')
    }
  }

  const handleDeleteSession = async (sessionId: number) => {
    if (!selectedStudentId || !confirm('هل أنت متأكد من حذف هذه الحصة؟')) return
    try {
      await deleteSession(sessionId)
      await fetchSessions({ student_id: selectedStudentId, per_page: 10000 })
    } catch (error: any) {
      alert(error.message || 'فشل حذف الحصة')
    }
  }

  const studentSessions = selectedStudentId
    ? sessions.filter((s: { student_id: number }) => s.student_id === selectedStudentId)
    : []

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

  const handleEdit = async (student: any) => {
    try {
      const fullStudent = await getStudent(student.id)
      setEditLinkedPaymentAccount(fullStudent.payment_account ?? null)
      setEditingId(fullStudent.id)

      const hasSubscriptions =
        Array.isArray(fullStudent.subscriptions) && fullStudent.subscriptions.length > 0
      setEditingStudentHasSubscriptions(hasSubscriptions)

      const rawDate = (fullStudent as { trial_session_date?: string }).trial_session_date
      const rawTime = (fullStudent as { trial_session_time?: string }).trial_session_time

      let subscriptionStartDate = ''
      if (hasSubscriptions && Array.isArray(fullStudent.subscriptions)) {
        const sortedSubscriptions = [...fullStudent.subscriptions]
          .filter((sub: any) => sub.start_date)
          .sort(
            (a: any, b: any) =>
              new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          )
        if (sortedSubscriptions.length > 0) {
          subscriptionStartDate = sortedSubscriptions[0].start_date.split('T')[0].split(' ')[0]
        }
      }

      const pastMonthsCount =
        fullStudent.subscriptions_statistics?.past_months_count ??
        fullStudent.past_months_count ??
        (hasSubscriptions ? fullStudent.subscriptions?.length ?? 0 : 0)

      setEditForm({
        name: fullStudent.name || '',
        phone: fullStudent.phone || '',
        gender: fullStudent.gender || '',
        teacher_id: fullStudent.teacher_id?.toString() || '',
        payment_account_id:
          fullStudent.payment_account_id?.toString() ||
          fullStudent.payment_account?.id?.toString() ||
          '',
        country: fullStudent.country || '',
        currency: fullStudent.currency || '',
        monthly_subscription_price: fullStudent.monthly_subscription_price?.toString() || '',
        trial_session_attendance:
          fullStudent.trial_session_attendance === 'booked' ||
          fullStudent.trial_session_attendance === 'attended' ||
          fullStudent.trial_session_attendance === 'not_booked'
            ? fullStudent.trial_session_attendance
            : 'not_booked',
        trial_session_date: rawDate ? rawDate.split('T')[0].split(' ')[0] : '',
        trial_session_time: rawTime ? rawTime.slice(0, 5) : '',
        package_id: fullStudent.package_id?.toString() || '',
        weekly_schedule: buildWeeklyScheduleFromStudent(fullStudent),
        past_months_count: String(pastMonthsCount ?? '0'),
        paid_months_count:
          fullStudent.paid_months_count != null
            ? String(fullStudent.paid_months_count)
            : fullStudent.subscriptions_statistics?.paid_subscriptions != null
              ? String(fullStudent.subscriptions_statistics.paid_subscriptions)
              : '',
        subscription_start_date: hasSubscriptions ? '' : subscriptionStartDate,
        ...resolvePastSessionsFromStudent(fullStudent),
      })
      setShowEditModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات الطالب')
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!editingId || isSubmitting) return

    if (editForm.trial_session_attendance === 'booked') {
      if (!editForm.trial_session_date) {
        alert('يرجى اختيار تاريخ حصة التجربة')
        return
      }
      if (!editForm.trial_session_time) {
        alert('يرجى اختيار وقت حصة التجربة')
        return
      }
    }

    if (editForm.trial_session_attendance === 'attended' && !editingStudentHasSubscriptions) {
      if (!editForm.teacher_id) {
        alert('يرجى اختيار المعلم قبل إضافة الاشتراك')
        return
      }
      if (editForm.past_sessions_mode === 'count') {
        if (editForm.past_sessions_count === '') {
          alert('يرجى إدخال عدد الحصص المكتملة سابقاً')
          return
        }
      } else if (!editForm.subscription_start_date) {
        alert('يرجى اختيار تاريخ بداية الاشتراك')
        return
      }
      if (Object.keys(editForm.weekly_schedule).length === 0) {
        alert('يرجى تحديد وقت الحصة ليوم واحد على الأقل في الجدول')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const updateData: any = {
        name: editForm.name,
        phone: editForm.phone,
        gender: editForm.gender as 'male' | 'female',
        teacher_id: editForm.teacher_id ? parseInt(editForm.teacher_id) : undefined,
        monthly_subscription_price: editForm.monthly_subscription_price
          ? parseFloat(editForm.monthly_subscription_price)
          : undefined,
        country: editForm.country || undefined,
        currency: editForm.currency || undefined,
        payment_account_id: editForm.payment_account_id
          ? parseInt(editForm.payment_account_id, 10)
          : null,
      }

      updateData.trial_session_attendance = editForm.trial_session_attendance
      if (editForm.trial_session_attendance === 'booked') {
        updateData.trial_session_date = editForm.trial_session_date
        updateData.trial_session_time = editForm.trial_session_time
      }

      if (editForm.trial_session_attendance === 'attended' && !editingStudentHasSubscriptions) {
        if (editForm.package_id) updateData.package_id = parseInt(editForm.package_id, 10)
        updateData.weekly_schedule = toApiWeeklySchedule(editForm.weekly_schedule)
        updateData.hour = null
        applyDerivedSessionCounts(updateData, editForm.weekly_schedule)
        applyPastSessionsToPayload(
          updateData,
          editForm.past_sessions_mode,
          editForm.past_sessions_count
        )
        if (editForm.past_months_count !== '') {
          updateData.past_months_count = parseInt(editForm.past_months_count, 10)
        }
        if (editForm.paid_months_count !== '') {
          updateData.paid_months_count = parseInt(editForm.paid_months_count, 10)
        }
        if (editForm.past_sessions_mode !== 'count' && editForm.subscription_start_date) {
          updateData.subscription_start_date = editForm.subscription_start_date
        }
      }

      await updateStudent(editingId, updateData)
      setEditingId(null)
      setEditForm(emptyEditForm())
      setEditingStudentHasSubscriptions(false)
      setShowEditModal(false)
      setEditLinkedPaymentAccount(null)

      fetchStudents(buildListFilters())
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء التحديث')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingId(null)
    setEditingStudentHasSubscriptions(false)
    setEditLinkedPaymentAccount(null)
    setEditForm(emptyEditForm())
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      try {
        await deleteStudent(id)
        // Refresh the list
        fetchStudents(buildListFilters())
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء الحذف')
      }
    }
  }

  const handleForceDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من الحذف النهائي لهذا الطالب؟ لا يمكن التراجع عن هذا الإجراء.')) {
      try {
        await forceDeleteStudent(id)
        fetchStudents(buildListFilters())
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء الحذف النهائي')
      }
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (newStudent.trial_session_attendance === 'booked') {
      if (!newStudent.trial_session_date) {
        alert('يرجى اختيار تاريخ حصة التجربة')
        return
      }
      if (!newStudent.trial_session_time) {
        alert('يرجى اختيار وقت حصة التجربة')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const createData: any = {
        name: newStudent.name,
        phone: newStudent.phone,
        gender: newStudent.gender as 'male' | 'female',
        teacher_id: newStudent.teacher_id ? parseInt(newStudent.teacher_id) : undefined,
        country: newStudent.country || undefined,
        currency: newStudent.currency || undefined,
        monthly_subscription_price: newStudent.monthly_subscription_price
          ? parseFloat(newStudent.monthly_subscription_price)
          : undefined,
      }
      if (newStudent.payment_account_id) {
        createData.payment_account_id = parseInt(newStudent.payment_account_id, 10)
      }
      createData.trial_session_attendance = newStudent.trial_session_attendance
      if (newStudent.trial_session_attendance === 'booked') {
        createData.trial_session_date = newStudent.trial_session_date
        createData.trial_session_time = newStudent.trial_session_time
      }
      await addStudent(createData)
      await fetchStudents(buildListFilters())
      setNewStudent({
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: '' as 'male' | 'female' | '',
        teacher_id: '',
        notes: '',
        country: '',
        payment_account_id: '',
        currency: '',
        monthly_subscription_price: '',
        trial_session_attendance: 'not_booked',
        trial_session_date: '',
        trial_session_time: '',
      })
      setShowAddModal(false)
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء الإضافة')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTrialAttendance = async (studentId: number, newStatus: 'not_booked' | 'booked' | 'attended') => {
    try {
      // Get the student to retrieve teacher_id
      const student = await getStudent(studentId)
      
      // If status is 'booked', we need to show modal to get date, time, and teacher (if needed)
      if (newStatus === 'booked') {
        setPendingTrialUpdate({ studentId, newStatus })
        setSelectedTeacherId(student.teacher_id?.toString() || '')
        setTrialSessionDate('')
        setTrialSessionTime('')
        setTrialSessionDuration('')
        setShowTeacherSelectModal(true)
        return
      }
      
      // For other statuses, if student doesn't have a teacher_id, show modal to select one
      if (!student.teacher_id) {
        setPendingTrialUpdate({ studentId, newStatus })
        setSelectedTeacherId('')
        setTrialSessionDate('')
        setTrialSessionTime('')
        setTrialSessionDuration('')
        setShowTeacherSelectModal(true)
        return
      }
      
      // If teacher_id exists and status is not 'booked', proceed with update
      await performTrialAttendanceUpdate(studentId, newStatus, student.teacher_id)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات الطالب')
    }
  }

  const performTrialAttendanceUpdate = async (
    studentId: number, 
    newStatus: 'not_booked' | 'booked' | 'attended', 
    teacherId?: number,
    trialDate?: string,
    trialTime?: string,
    sessionDuration?: string
  ) => {
    // Prevent duplicate requests
    if (updatingTrialAttendance === studentId) {
      return
    }
    setUpdatingTrialAttendance(studentId)
    try {
      const updateData: any = { trial_session_attendance: newStatus }
      // Include teacher_id if provided
      if (teacherId) {
        updateData.teacher_id = teacherId
      }
      // Include trial_session_date, trial_session_time, session_duration only when status is 'booked'
      if (newStatus === 'booked') {
        if (trialDate) {
          updateData.trial_session_date = trialDate
        }
        if (trialTime) {
          updateData.trial_session_time = trialTime
        }
        if (sessionDuration && sessionDuration.trim() !== '') {
          const duration = parseInt(sessionDuration, 10)
          if (!isNaN(duration) && duration > 0) {
            updateData.session_duration = duration
          }
        }
      }
      await updateStudent(studentId, updateData)
      // Refresh the list
      fetchStudents(buildListFilters())
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

  const handleConfirmTeacherSelection = async () => {
    if (!pendingTrialUpdate) {
      return
    }
    // Prevent duplicate submissions
    if (updatingTrialAttendance === pendingTrialUpdate.studentId) {
      return
    }
    
    // If status is 'booked', require teacher, date, and time
    if (pendingTrialUpdate.newStatus === 'booked') {
      if (!selectedTeacherId) {
        alert('يرجى اختيار معلم')
        return
      }
      if (!trialSessionDate) {
        alert('يرجى اختيار تاريخ جلسة التجربة')
        return
      }
      if (!trialSessionTime) {
        alert('يرجى اختيار وقت جلسة التجربة')
        return
      }
    } else {
      // For other statuses, only require teacher if not already set
      if (!selectedTeacherId) {
        alert('يرجى اختيار معلم')
        return
      }
    }
    
    setShowTeacherSelectModal(false)
    await performTrialAttendanceUpdate(
      pendingTrialUpdate.studentId,
      pendingTrialUpdate.newStatus,
      parseInt(selectedTeacherId),
      trialSessionDate || undefined,
      trialSessionTime || undefined,
      trialSessionDuration || undefined
    )
    setPendingTrialUpdate(null)
    setSelectedTeacherId('')
    setTrialSessionDate('')
    setTrialSessionTime('')
    setTrialSessionDuration('')
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

  const filteredStudents = students.filter((student) => studentMatchesSearch(student, searchTerm))

  const websiteStudents = filteredStudents.filter((student) => student.type === 'website')

  return (
    <div className="min-w-0 px-3 sm:px-4 lg:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-primary-900">طلاب الموقع</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="text-primary-600 font-medium text-sm sm:text-base shrink-0">إجمالي: {websiteStudents.length}</div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4 shrink-0" />
            إضافة طالب
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
      <div className="bg-white rounded-lg sm:rounded-xl border-2 border-primary-200 p-3 sm:p-4 mb-4 sm:mb-6 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          <div className="relative min-w-0">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن طالب بالاسم أو رقم الهاتف..."
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
              value={journeyStatusFilter}
              onChange={(e) => setJourneyStatusFilter(e.target.value as StudentJourneyStatus | '')}
              className="w-full min-w-0 px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
              dir="rtl"
            >
              <option value="">جميع المراحل</option>
              {WEBSITE_STUDENT_JOURNEY_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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

      {/* Students Table */}
      {isLoadingStudents ? (
        <div className="flex items-center justify-center py-10 sm:py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : websiteStudents.length === 0 ? (
        <div className="bg-white rounded-lg sm:rounded-xl border-2 border-primary-200 p-6 sm:p-8 text-center text-primary-600 text-sm sm:text-base shadow-lg">
          {searchTerm || journeyStatusFilter || teacherFilterId ? 'لا توجد نتائج' : 'لا يوجد طلاب مسجلون من الموقع بعد'}
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 sm:space-y-4">
            {websiteStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-lg sm:rounded-xl border-2 border-primary-200 p-3 sm:p-4 shadow-lg overflow-hidden min-w-0"
              >
                <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-primary-900 truncate min-w-0">{student.name}</h3>
                    <WhatsAppLink phone={student.phone} country={student.country} />
                  </div>
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
                      <span className="text-primary-900">{student.package.name}</span>
                    </div>
                  )}
                  {student.teacher?.name && (
                    <div className="flex justify-between">
                      <span className="text-primary-600">المعلم:</span>
                      <span className="text-primary-900">{student.teacher.name}</span>
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
                    onClick={() => handleViewSubscriptionsOnly(student)}
                    className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    title="الاشتراكات"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewSessions(student.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="عرض الحصص"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(student)}
                    className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {canDeleteStudents && (
                    <>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleForceDelete(student.id)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="حذف نهائي"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </>
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
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '24%' }} />
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
                  {websiteStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-primary-200 hover:bg-primary-50 transition-colors"
                    >
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-900 font-medium truncate overflow-hidden" title={student.name}>
                        <span className="inline-flex items-center gap-1.5 max-w-full">
                          <span className="truncate">{student.name}</span>
                          <WhatsAppLink phone={student.phone} country={student.country} />
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700 truncate" title={student.email || ''}>{student.email || '-'}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700 truncate" dir="ltr" title={student.phone}>{student.phone}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700">{student.age || '-'}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700">{student.gender_label || (student.gender === 'male' ? 'ذكر' : 'أنثى')}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700 truncate" title={student.package?.name || ''}>{student.package?.name || '-'}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3 text-primary-700 truncate" title={student.teacher?.name || ''}>{student.teacher?.name || '-'}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3">
                        <div className="flex flex-col items-center gap-1.5">
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
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-3">
                        <div className="flex items-center justify-center gap-1 lg:gap-2 flex-wrap">
                          <button
                            onClick={() => handleViewStudent(student.id)}
                            className="p-1.5 lg:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewSubscriptionsOnly(student)}
                            className="p-1.5 lg:p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="الاشتراكات"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewSessions(student.id)}
                            className="p-1.5 lg:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="عرض الحصص"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-1.5 lg:p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {canDeleteStudents && (
                            <>
                              <button
                                onClick={() => handleDelete(student.id)}
                                className="p-1.5 lg:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleForceDelete(student.id)}
                                className="p-1.5 lg:p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="حذف نهائي"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </>
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

      {/* Add Student Modal (basic data only) */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto min-h-[50vh] sm:min-h-0"
            >
              <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900 min-w-0">
                  إضافة طالب من الموقع
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-primary-900 font-semibold mb-2 text-right">الاسم الكامل</label>
                    <input
                      type="text"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={newStudent.phone}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, phone: sanitizeStudentPhoneInput(e.target.value) })
                      }
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">الجنس</label>
                    <select
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as 'male' | 'female' })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                      dir="rtl"
                      required
                    >
                      <option value="">اختر الجنس</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-primary-900 font-semibold mb-2 text-right">المعلم (اختياري)</label>
                    <SearchableTeacherSelect
                      value={newStudent.teacher_id}
                      onChange={(value) => setNewStudent({ ...newStudent, teacher_id: value })}
                      teachers={teachers}
                      placeholder="اختر المعلم"
                    />
                  </div>
                </div>

                <div className="border-t-2 border-primary-200 pt-4">
                  <h3 className="text-lg font-bold text-primary-900 mb-1 text-right">حصة التجربة</h3>
                  <p className="text-sm text-primary-600 mb-4 text-right">
                    حدد حالة حصة التجربة. عند اختيار «محجوز» أدخل تاريخ ووقت الحصة.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-primary-900 font-semibold mb-2 text-right">حالة حصة التجربة</label>
                      <select
                        value={newStudent.trial_session_attendance}
                        onChange={(e) => {
                          const next = e.target.value as 'not_booked' | 'booked'
                          setNewStudent({
                            ...newStudent,
                            trial_session_attendance: next,
                            trial_session_date: next === 'booked' ? newStudent.trial_session_date : '',
                            trial_session_time: next === 'booked' ? newStudent.trial_session_time : '',
                          })
                        }}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                        dir="rtl"
                      >
                        <option value="not_booked">غير محجوز</option>
                        <option value="booked">محجوز</option>
                      </select>
                    </div>
                    {newStudent.trial_session_attendance === 'booked' && (
                      <>
                        <div>
                          <label className="block text-primary-900 font-semibold mb-2 text-right">تاريخ حصة التجربة</label>
                          <input
                            type="date"
                            value={newStudent.trial_session_date}
                            onChange={(e) => setNewStudent({ ...newStudent, trial_session_date: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-primary-900 font-semibold mb-2 text-right">وقت حصة التجربة</label>
                          <input
                            type="time"
                            value={newStudent.trial_session_time}
                            onChange={(e) => setNewStudent({ ...newStudent, trial_session_time: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t-2 border-primary-200 pt-4">
                  <h3 className="text-lg font-bold text-primary-900 mb-4 text-right">بيانات الدفع والاشتراك</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-primary-900 font-semibold mb-2 text-right">حساب التحويل</label>
                      <select
                        value={newStudent.payment_account_id}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, payment_account_id: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                        dir="rtl"
                      >
                        <option value="">بدون حساب محدد</option>
                        {paymentAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {formatPaymentAccountOption(acc)}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-primary-500 mt-1">
                        <Link href="/admin/payment-accounts" className="text-primary-700 underline">
                          إدارة حسابات التحويل
                        </Link>
                      </p>
                    </div>
                    <div>
                      <label className="block text-primary-900 font-semibold mb-2 text-right">العملة</label>
                      <select
                        value={newStudent.currency}
                        onChange={(e) => setNewStudent({ ...newStudent, currency: e.target.value })}
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
                      <label className="block text-primary-900 font-semibold mb-2 text-right">سعر الاشتراك الشهري</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newStudent.monthly_subscription_price}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, monthly_subscription_price: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-primary-900 font-semibold mb-2 text-right">البلد</label>
                      <select
                        value={newStudent.country}
                        onChange={(e) => setNewStudent({ ...newStudent, country: e.target.value })}
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
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border-2 border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'إضافة الطالب'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Student Details Modal */}
      <AnimatePresence>
        {showViewModal && viewedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto min-h-[50vh] sm:min-h-0"
            >
              <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900 min-w-0">تفاصيل الطالب</h2>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <label className="block text-primary-600 text-sm mb-1">الاسم</label>
                    <p className="text-primary-900 font-semibold text-base sm:text-lg break-words">{viewedStudent.name}</p>
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
                      <label className="block text-primary-600 text-sm mb-1">حالة حصة التجربة</label>
                      <div className="mt-1">
                        {getTrialAttendanceBadge(viewedStudent.trial_session_attendance)}
                      </div>
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
                      <label className="block text-primary-600 text-sm mb-1">مدة الحصة (دقائق)</label>
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
                          day: 'numeric',
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
                        const dayObj = DAYS_OF_WEEK.find((d) => d.value === day || d.arName === day)
                        const timeStr = typeof val === 'string' ? val : (val as any)?.time
                        const dur =
                          typeof val === 'object' && val && 'session_duration' in val
                            ? (val as any).session_duration
                            : null
                        return (
                          <div
                            key={day}
                            className="flex items-center justify-between py-2 border-b border-primary-200 last:border-0"
                          >
                            <span className="text-primary-900 font-medium">{dayObj?.label || day}</span>
                            <span className="text-primary-700">
                              {timeStr || '-'}
                              {dur != null ? ` (${dur} د)` : ''}
                            </span>
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
                        const dayObj = DAYS_OF_WEEK.find((d) => d.value === day)
                        const dur =
                          typeof item === 'object' && item?.session_duration != null
                            ? ` (${item.session_duration} د)`
                            : ''
                        return (
                          <span
                            key={day}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm"
                          >
                            {dayObj?.label || day}
                            {dur}
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
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={handleCloseEditModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto min-h-[50vh] sm:min-h-0"
            >
              <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900 min-w-0">
                  تعديل طالب من الموقع
                </h2>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
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
                  <div className="sm:col-span-2">
                    <label className="block text-primary-900 font-semibold mb-2 text-right">المعلم (اختياري)</label>
                    <SearchableTeacherSelect
                      value={editForm.teacher_id}
                      onChange={(value) => setEditForm({ ...editForm, teacher_id: value })}
                      teachers={teachers}
                      placeholder="اختر المعلم"
                    />
                  </div>
                </div>

                <div className="border-t-2 border-primary-200 pt-4">
                  <h3 className="text-lg font-bold text-primary-900 mb-1 text-right">حصة التجربة</h3>
                  <p className="text-sm text-primary-600 mb-4 text-right">
                    حدد حالة حصة التجربة. عند اختيار «حضر» يمكنك إضافة اشتراك للطالب إذا لم يكن لديه اشتراك بعد.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-primary-900 font-semibold mb-2 text-right">حالة حصة التجربة</label>
                      <select
                        value={editForm.trial_session_attendance}
                        onChange={(e) => {
                          const next = e.target.value as 'not_booked' | 'booked' | 'attended'
                          setEditForm({
                            ...editForm,
                            trial_session_attendance: next,
                            trial_session_date: next === 'booked' ? editForm.trial_session_date : '',
                            trial_session_time: next === 'booked' ? editForm.trial_session_time : '',
                          })
                        }}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                        dir="rtl"
                      >
                        <option value="not_booked">غير محجوز</option>
                        <option value="booked">محجوز</option>
                        <option value="attended">حضر</option>
                      </select>
                    </div>
                    {editForm.trial_session_attendance === 'booked' && (
                      <>
                        <div>
                          <label className="block text-primary-900 font-semibold mb-2 text-right">تاريخ حصة التجربة</label>
                          <input
                            type="date"
                            value={editForm.trial_session_date}
                            onChange={(e) => setEditForm({ ...editForm, trial_session_date: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-primary-900 font-semibold mb-2 text-right">وقت حصة التجربة</label>
                          <input
                            type="time"
                            value={editForm.trial_session_time}
                            onChange={(e) => setEditForm({ ...editForm, trial_session_time: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {editForm.trial_session_attendance === 'attended' && !editingStudentHasSubscriptions && (
                  <div className="border-t-2 border-primary-200 pt-4">
                    <h3 className="text-sm font-semibold text-primary-900 mb-2 text-right">إضافة اشتراك</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="sm:col-span-2">
                        <CompactSubscriptionSettings
                          idPrefix="website_edit_subscription"
                          value={{
                            past_sessions_mode: editForm.past_sessions_mode,
                            past_sessions_count: editForm.past_sessions_count,
                            subscription_start_date: editForm.subscription_start_date,
                            past_months_count: editForm.past_months_count,
                            paid_months_count: editForm.paid_months_count,
                          }}
                          onChange={(subscriptionSettings) =>
                            setEditForm({ ...editForm, ...subscriptionSettings })
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-primary-900 font-semibold mb-2 text-right">جدول الأسبوع</label>
                        <div className="space-y-2 p-3 bg-primary-50 rounded-lg border border-primary-200">
                          {DAYS_OF_WEEK.map((day) => (
                            <div key={day.value} className="flex items-center gap-3 flex-wrap">
                              <label className="w-24 text-primary-700 font-medium">{day.label}</label>
                              <input
                                type="time"
                                value={editForm.weekly_schedule[day.value]?.time || ''}
                                onChange={(e) => {
                                  const newSchedule = { ...editForm.weekly_schedule }
                                  if (e.target.value) {
                                    newSchedule[day.value] = {
                                      ...(newSchedule[day.value] || { time: '', session_duration: '' }),
                                      time: e.target.value,
                                    }
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
                                    newSchedule[day.value] = {
                                      ...newSchedule[day.value],
                                      session_duration: e.target.value,
                                    }
                                  }
                                  setEditForm({ ...editForm, weekly_schedule: newSchedule })
                                }}
                                className="w-20 px-2 py-2 border-2 border-primary-200 rounded-lg text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t-2 border-primary-200 pt-4">
                  <h3 className="text-lg font-bold text-primary-900 mb-4 text-right">بيانات الدفع والاشتراك</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-primary-900 font-semibold mb-2 text-right">حساب التحويل</label>
                      <select
                        value={editForm.payment_account_id}
                        onChange={(e) =>
                          setEditForm({ ...editForm, payment_account_id: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                        dir="rtl"
                      >
                        <option value="">بدون حساب محدد</option>
                        {paymentAccountSelectOptions.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {formatPaymentAccountOption(acc)}
                            {!acc.is_active ? ' (غير نشط)' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-primary-500 mt-1">
                        <Link href="/admin/payment-accounts" className="text-primary-700 underline">
                          إدارة حسابات التحويل
                        </Link>
                      </p>
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
                      <label className="block text-primary-900 font-semibold mb-2 text-right">سعر الاشتراك الشهري</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.monthly_subscription_price}
                        onChange={(e) => setEditForm({ ...editForm, monthly_subscription_price: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                        placeholder="0.00"
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
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border-2 border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscriptions-only Modal */}
      <AnimatePresence>
        {showSubscriptionsOnlyModal && selectedStudentForSubscriptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowSubscriptionsOnlyModal(false)
              setSelectedStudentForSubscriptions(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">
                  الاشتراكات — {selectedStudentForSubscriptions.name}
                </h2>
                <button
                  onClick={() => {
                    setShowSubscriptionsOnlyModal(false)
                    setSelectedStudentForSubscriptions(null)
                  }}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedStudentForSubscriptions.subscriptions && Array.isArray(selectedStudentForSubscriptions.subscriptions) && selectedStudentForSubscriptions.subscriptions.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border-2 border-primary-200">
                  <table className="w-full border-collapse bg-white" style={{ tableLayout: 'auto', minWidth: '100%' }}>
                    <thead className="bg-primary-100">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">رقم الاشتراك</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">تاريخ البدء</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">تاريخ الانتهاء</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الحصص</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">السعر / المتبقي</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الحالة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentForSubscriptions.subscriptions.map((subscription: any, index: number) => (
                        <tr key={subscription.id} className="border-b border-primary-100 hover:bg-primary-50 transition-colors">
                          <td className="px-4 py-3 text-primary-900 font-medium text-sm whitespace-nowrap">{subscription.subscription_number ?? index + 1}</td>
                          <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">{subscription.start_date}</td>
                          <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">{subscription.end_date}</td>
                          <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">
                            {subscription.completed_sessions_count ?? 0} / {subscription.total_sessions || '-'}
                          </td>
                          <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">
                            {subscription.subscription_price != null ? `السعر: ${subscription.subscription_price}` : ''}
                            {subscription.remaining_amount != null && subscription.remaining_amount > 0 && (
                              <span className="text-red-600 font-medium block">المتبقي: {subscription.remaining_amount}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {subscription.is_paid ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-semibold">
                                <CheckCircle className="w-4 h-4" /> مدفوع
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-xs font-semibold">
                                <X className="w-4 h-4" /> غير مدفوع
                              </span>
                            )}
                            {subscription.is_active && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mr-1">
                                <Clock className="w-3 h-3" /> نشط
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleSubscriptionPayment(subscription.id, subscription.is_paid)}
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                subscription.is_paid ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              title={subscription.is_paid ? 'تعيين كغير مدفوع' : 'تعيين كمدفوع'}
                            >
                              <CheckCircle className="w-4 h-4" />
                              {subscription.is_paid ? 'غير مدفوع' : 'مدفوع'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-primary-600 text-center py-8">لا توجد اشتراكات مسجلة</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sessions Modal */}
      <AnimatePresence>
        {showSessionsModal && selectedStudentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowSessionsModal(false)
              setSelectedStudentId(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">حصص الطالب</h2>
                <button
                  onClick={() => {
                    setShowSessionsModal(false)
                    setSelectedStudentId(null)
                  }}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : studentSessions.length === 0 ? (
                <div className="text-center py-12 text-primary-600">لا توجد حصص مسجلة</div>
              ) : (
                <div className="space-y-4">
                  {studentSessions.map((session: any, index: number) => (
                    <div
                      key={session.id}
                      className={`p-4 rounded-lg border-2 ${
                        session.is_completed
                          ? 'border-green-200 bg-green-50'
                          : 'border-primary-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {session.is_completed ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <Clock className="w-6 h-6 text-primary-600" />
                          )}
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white font-bold flex-shrink-0">
                                {(session as any).session_number || index + 1}
                              </span>
                              <p className="font-bold text-lg text-primary-900">
                                {session.session_date} - {session.session_time}
                              </p>
                            </div>
                            <p className="text-sm text-primary-600">
                              {session.day_of_week_label || session.day_of_week}
                              {session.teacher && ` - ${session.teacher.name}`}
                            </p>
                            {(session as any).student_joined_at && (
                              <p className="text-xs text-primary-500 mt-0.5">
                                دخول الطالب: {new Date((session as any).student_joined_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                            {session.notes && (
                              <p className="text-sm text-primary-700 mt-1">{session.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!session.is_completed && (
                            <button
                              onClick={() => handleCompleteSession(session.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              إتمام
                            </button>
                          )}
                          {session.is_completed && (
                            <button
                              onClick={() => handleRevertToPending(session.id)}
                              className="px-3 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg transition-colors text-sm"
                            >
                              إرجاع قيد الانتظار
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teacher Selection Modal for Trial Attendance */}
      <AnimatePresence>
        {showTeacherSelectModal && pendingTrialUpdate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => {
              setShowTeacherSelectModal(false)
              setPendingTrialUpdate(null)
              setSelectedTeacherId('')
              setTrialSessionDate('')
              setTrialSessionTime('')
              setTrialSessionDuration('')
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900 min-w-0">
                  {pendingTrialUpdate.newStatus === 'booked' ? 'حجز جلسة التجربة' : 'اختر المعلم'}
                </h2>
                <button
                  onClick={() => {
                    setShowTeacherSelectModal(false)
                    setPendingTrialUpdate(null)
                    setSelectedTeacherId('')
                    setTrialSessionDate('')
                    setTrialSessionTime('')
                    setTrialSessionDuration('')
                  }}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-primary-700 text-right">
                  {pendingTrialUpdate.newStatus === 'booked' 
                    ? 'يرجى اختيار المعلم وتاريخ ووقت جلسة التجربة'
                    : 'يجب اختيار معلم لتحديث حالة جلسة التجربة'}
                </p>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">المعلم</label>
                  <SearchableTeacherSelect
                    value={selectedTeacherId}
                    onChange={(value) => setSelectedTeacherId(value)}
                    teachers={teachers}
                    placeholder="اختر المعلم"
                  />
                </div>
                {pendingTrialUpdate.newStatus === 'booked' && (
                  <>
                    <div>
                      <label className="block text-primary-900 font-semibold mb-2 text-right">تاريخ جلسة التجربة</label>
                      <input
                        type="date"
                        value={trialSessionDate}
                        onChange={(e) => setTrialSessionDate(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-primary-900 font-semibold mb-2 text-right">وقت جلسة التجربة</label>
                      <input
                        type="time"
                        value={trialSessionTime}
                        onChange={(e) => setTrialSessionTime(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-primary-900 font-semibold mb-2 text-right">مدة الحصة (دقيقة)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={trialSessionDuration}
                        onChange={(e) => setTrialSessionDuration(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                        dir="rtl"
                        placeholder="مثال: 30"
                      />
                    </div>
                  </>
                )}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 pt-4">
                  <button
                    onClick={handleConfirmTeacherSelection}
                    disabled={
                      !selectedTeacherId || 
                      (pendingTrialUpdate.newStatus === 'booked' && (!trialSessionDate || !trialSessionTime))
                    }
                    className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    تأكيد
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeacherSelectModal(false)
                      setPendingTrialUpdate(null)
                      setSelectedTeacherId('')
                      setTrialSessionDate('')
                      setTrialSessionTime('')
                      setTrialSessionDuration('')
                    }}
                    className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
