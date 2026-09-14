'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/store/useAdminStore'
import { useAdminPermissions } from '@/hooks/useAdminPermissions'
import { Plus, Edit, Trash2, X, Eye, Calendar, CheckCircle, Clock, CreditCard, DollarSign, Image as ImageIcon, AlertTriangle, History } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchableTeacherSelect from '@/components/admin/SearchableTeacherSelect'
import {
  parseWeeklyScheduleFromApi,
  parseWeeklyDaysFromApi,
  toApiWeeklySchedule,
  toApiWeeklyDays,
  deriveSessionCountsFromSchedule,
  type WeeklyScheduleForm,
  type WeeklyDaysForm,
} from '@/lib/weekly-schedule-utils'
import {
  listPaymentAccounts,
  formatPaymentAccountOption,
  PAYMENT_ACCOUNT_TYPE_LABELS,
  type PaymentAccount,
  type PaymentAccountType,
} from '@/lib/api/payment-accounts'

let cachedPaymentAccounts: PaymentAccount[] | null = null
let paymentAccountsLoadPromise: Promise<PaymentAccount[]> | null = null

function loadPaymentAccountsOnce(): Promise<PaymentAccount[]> {
  if (cachedPaymentAccounts) return Promise.resolve(cachedPaymentAccounts)
  if (paymentAccountsLoadPromise) return paymentAccountsLoadPromise
  paymentAccountsLoadPromise = listPaymentAccounts({ is_active: 1, per_page: 500 })
    .then((data) => {
      cachedPaymentAccounts = data.payment_accounts ?? []
      return cachedPaymentAccounts
    })
    .catch(() => {
      paymentAccountsLoadPromise = null
      return []
    })
  return paymentAccountsLoadPromise
}

function applyDerivedSessionCounts(
  payload: Record<string, unknown>,
  form: {
    useWeeklySchedule: boolean
    weekly_schedule: WeeklyScheduleForm
    weekly_days: WeeklyDaysForm
  }
) {
  const counts = deriveSessionCountsFromSchedule(form)
  if (counts) {
    payload.weekly_sessions = counts.weekly_sessions
    payload.monthly_sessions = counts.monthly_sessions
  }
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

function formatStudentCreatedAt(value?: string | null): string {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-EG')
}

export default function StudentAdminActions({
  studentId,
  student: studentProp,
  hideDeleteActions = false,
  hideAuditLogs = false,
  className = '',
  onStudentChanged,
}: {
  studentId: number
  student?: { id: number; name?: string; unpaid_subscriptions_list?: any[] } | null
  hideDeleteActions?: boolean
  hideAuditLogs?: boolean
  className?: string
  onStudentChanged?: () => void
}) {
  const { canDeleteStudents } = useAdminPermissions()
  const {
    getStudent,
    deleteStudent,
    forceDeleteStudent,
    updateStudent,
    updateSubscriptionPaymentStatus,
    sessions,
    isLoadingSessions,
    fetchSessions,
    addSession,
    completeSession,
    revertSessionToPending,
    deleteSession,
    packages,
    fetchPackages,
    teachers,
    fetchTeachers,
  } = useAdminStore()

  // Student modals
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [viewedStudent, setViewedStudent] = useState<any>(null)
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
    country: '',
    currency: '',
    past_months_count: '',
    paid_months_count: '',
    subscription_start_date: '',
    paid_subscriptions_count: '',
    payment_account_id: '',
  })
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([])
  const [editLinkedPaymentAccount, setEditLinkedPaymentAccount] = useState<PaymentAccount | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const paymentAccountSelectOptions = useMemo(() => {
    const byId = new Map<number, PaymentAccount>()
    for (const acc of paymentAccounts) byId.set(acc.id, acc)
    if (editLinkedPaymentAccount && !byId.has(editLinkedPaymentAccount.id)) {
      byId.set(editLinkedPaymentAccount.id, editLinkedPaymentAccount)
    }
    return Array.from(byId.values())
  }, [paymentAccounts, editLinkedPaymentAccount])

  // Session modals
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [showAddSessionModal, setShowAddSessionModal] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [sessionForm, setSessionForm] = useState({
    student_id: '',
    teacher_id: '',
    session_date: '',
    session_time: '',
    session_duration: '',
    notes: '',
  })

  // Unpaid subscriptions modal
  const [showUnpaidSubscriptionsModal, setShowUnpaidSubscriptionsModal] = useState(false)
  const [selectedStudentForUnpaid, setSelectedStudentForUnpaid] = useState<any>(null)

  // Subscriptions-only modal (view just subscriptions table for a student)
  const [showSubscriptionsOnlyModal, setShowSubscriptionsOnlyModal] = useState(false)
  const [selectedStudentForSubscriptions, setSelectedStudentForSubscriptions] = useState<any>(null)

  // Pause subscription modal: 'choice' = choose type, 'form' = temporary pause dates form
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [pauseModalMode, setPauseModalMode] = useState<'choice' | 'form'>('choice')
  const [selectedSubscriptionForPause, setSelectedSubscriptionForPause] = useState<{ subscriptionId: number; subscriptionNumber?: number } | null>(null)
  const [pauseForm, setPauseForm] = useState({
    pause_from: '',
    pause_to: '',
    resume_date: '',
  })

  // Image viewer for receipt images (e.g. partial payment receipts)
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  // Partial payment modal
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false)
  const [selectedSubscriptionForPartialPayment, setSelectedSubscriptionForPartialPayment] = useState<{ subscriptionId: number; subscriptionNumber?: number } | null>(null)
  const [partialPaymentForm, setPartialPaymentForm] = useState({
    amount: '',
    payment_date: '',
    receiptImage: null as File | null,
  })
  const [isSubmittingPartialPayment, setIsSubmittingPartialPayment] = useState(false)

  const ensureEditSupportData = async () => {
    const tasks: Promise<unknown>[] = []
    if (!packages.length) tasks.push(fetchPackages())
    if (!teachers.length) tasks.push(fetchTeachers(1, 1000))
    tasks.push(loadPaymentAccountsOnce().then((accounts) => setPaymentAccounts(accounts)))
    await Promise.all(tasks)
  }

  const refreshOpenStudentViews = async () => {
    if (viewingId) {
      const updatedStudent = await getStudent(viewingId)
      setViewedStudent(updatedStudent)
    }
    if (selectedStudentForUnpaid) {
      const updatedStudent = await getStudent(selectedStudentForUnpaid.id)
      setSelectedStudentForUnpaid(updatedStudent)
    }
    if (selectedStudentForSubscriptions) {
      const updatedStudent = await getStudent(selectedStudentForSubscriptions.id)
      setSelectedStudentForSubscriptions(updatedStudent)
    }
    onStudentChanged?.()
  }

  const handleViewStudent = async (id: number) => {
    try {
      const student = await getStudent(id)
      setViewedStudent(student)
      setViewingId(id)
      setShowViewModal(true)
      // Load sessions for this student
      await fetchSessions({ student_id: id, per_page: 10000 })
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات الطالب')
    }
  }

  const handleToggleSubscriptionPayment = async (subscriptionId: number, currentPaidStatus: boolean) => {
    try {
      const newPaidStatus = !currentPaidStatus
      await updateSubscriptionPaymentStatus(subscriptionId, newPaidStatus)
      await refreshOpenStudentViews()
    } catch (error: any) {
      alert(error.message || 'فشل تحديث حالة الدفع')
    }
  }

  const handleViewUnpaidSubscriptions = async (student: any) => {
    try {
      const fullStudent = await getStudent(student.id)
      setSelectedStudentForUnpaid(fullStudent)
      setShowUnpaidSubscriptionsModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات الاشتراكات غير المدفوعة')
    }
  }

  const handleViewSubscriptionsOnly = async (student: any) => {
    try {
      const fullStudent = await getStudent(student.id)
      setSelectedStudentForSubscriptions(fullStudent)
      setShowSubscriptionsOnlyModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل الاشتراكات')
    }
  }

  const handlePauseImmediate = async () => {
    if (!selectedSubscriptionForPause) return
    if (!confirm('هل أنت متأكد من إيقاف هذا الاشتراك؟ سيتم حذف جميع الحصص المستقبلية غير المكتملة.')) return
    try {
      const { pauseSubscription } = await import('@/lib/api/students')
      await pauseSubscription(selectedSubscriptionForPause.subscriptionId)
      setShowPauseModal(false)
      setSelectedSubscriptionForPause(null)
      setPauseModalMode('choice')
      if (viewingId) {
        const updatedStudent = await getStudent(viewingId)
        setViewedStudent(updatedStudent)
      }
      if (selectedStudentForSubscriptions) {
        const updatedStudent = await getStudent(selectedStudentForSubscriptions.id)
        setSelectedStudentForSubscriptions(updatedStudent)
      }
    } catch (error: any) {
      alert(error.message || 'فشل إيقاف الاشتراك')
    }
  }

  const handlePauseTemporarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubscriptionForPause) return
    if (!pauseForm.pause_from || !pauseForm.pause_to || !pauseForm.resume_date) {
      alert('يرجى إدخال تاريخ بداية الإيقاف وتاريخ نهاية الإيقاف وتاريخ الاستئناف')
      return
    }
    try {
      const { pauseSubscriptionTemporary } = await import('@/lib/api/students')
      await pauseSubscriptionTemporary(selectedSubscriptionForPause.subscriptionId, {
        pause_from: pauseForm.pause_from,
        pause_to: pauseForm.pause_to,
        resume_date: pauseForm.resume_date,
      })
      setShowPauseModal(false)
      setSelectedSubscriptionForPause(null)
      setPauseModalMode('choice')
      setPauseForm({ pause_from: '', pause_to: '', resume_date: '' })
      if (viewingId) {
        const updatedStudent = await getStudent(viewingId)
        setViewedStudent(updatedStudent)
      }
      if (selectedStudentForSubscriptions) {
        const updatedStudent = await getStudent(selectedStudentForSubscriptions.id)
        setSelectedStudentForSubscriptions(updatedStudent)
      }
    } catch (error: any) {
      alert(error.message || 'فشل إيقاف الاشتراك')
    }
  }

  const handlePartialPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubscriptionForPartialPayment) return
    if (!partialPaymentForm.amount || !partialPaymentForm.payment_date) {
      alert('يرجى إدخال المبلغ وتاريخ الدفع')
      return
    }
    const amount = parseFloat(partialPaymentForm.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح')
      return
    }
    setIsSubmittingPartialPayment(true)
    try {
      const formData = new FormData()
      formData.append('subscription_id', selectedSubscriptionForPartialPayment.subscriptionId.toString())
      formData.append('amount', partialPaymentForm.amount)
      formData.append('payment_date', partialPaymentForm.payment_date)
      if (partialPaymentForm.receiptImage) {
        formData.append('payment_receipt_image', partialPaymentForm.receiptImage)
      }
      const { createSubscriptionPartialPayment } = await import('@/lib/api/students')
      await createSubscriptionPartialPayment(formData)
      setShowPartialPaymentModal(false)
      setSelectedSubscriptionForPartialPayment(null)
      setPartialPaymentForm({ amount: '', payment_date: '', receiptImage: null })
      if (viewingId) {
        const updatedStudent = await getStudent(viewingId)
        setViewedStudent(updatedStudent)
      }
      if (selectedStudentForSubscriptions) {
        const updatedStudent = await getStudent(selectedStudentForSubscriptions.id)
        setSelectedStudentForSubscriptions(updatedStudent)
      }
      if (selectedStudentForUnpaid) {
        const updatedStudent = await getStudent(selectedStudentForUnpaid.id)
        setSelectedStudentForUnpaid(updatedStudent)
      }
    } catch (error: any) {
      alert(error.message || 'فشل تسجيل الدفع الجزئي')
    } finally {
      setIsSubmittingPartialPayment(false)
    }
  }

  const [editingStudentHasSubscriptions, setEditingStudentHasSubscriptions] = useState(false)

  const handleEdit = async (student: any) => {
    try {
      await ensureEditSupportData()
      setEditingId(student.id)
      // Fetch fresh student data to get complete information
      const fullStudent = await getStudent(student.id)
      
      // Check if student has subscriptions
      const hasSubscriptions = !!(fullStudent.subscriptions && Array.isArray(fullStudent.subscriptions) && fullStudent.subscriptions.length > 0)
      setEditingStudentHasSubscriptions(hasSubscriptions)
      setEditLinkedPaymentAccount(fullStudent.payment_account ?? null)
      
      // Check if student has weekly_schedule (takes precedence)
      const hasWeeklySchedule = !!(fullStudent.weekly_schedule && typeof fullStudent.weekly_schedule === 'object' && Object.keys(fullStudent.weekly_schedule).length > 0)
      
      // Get subscription start date from earliest subscription if available
      let subscriptionStartDate = ''
      if (hasSubscriptions && Array.isArray(fullStudent.subscriptions)) {
        // Sort subscriptions by start_date and get the earliest one
        const sortedSubscriptions = [...fullStudent.subscriptions]
          .filter((sub: any) => sub.start_date) // Filter out subscriptions without start_date
          .sort((a: any, b: any) => {
            const dateA = new Date(a.start_date).getTime()
            const dateB = new Date(b.start_date).getTime()
            return dateA - dateB
          })
        if (sortedSubscriptions.length > 0) {
          subscriptionStartDate = sortedSubscriptions[0].start_date
        }
      }
      
      // Get subscription statistics
      const totalSubscriptions = fullStudent.subscriptions_statistics?.total_subscriptions || 0
      const pastMonthsCount = fullStudent.subscriptions_statistics?.past_months_count ?? fullStudent.past_months_count ?? totalSubscriptions
      
      setEditForm({
        name: fullStudent.name || '',
        email: fullStudent.email || '',
        phone: fullStudent.phone || '',
        age: fullStudent.age?.toString() || '',
        gender: fullStudent.gender || '',
        package_id: fullStudent.package_id?.toString() || '',
        teacher_id: fullStudent.teacher_id?.toString() || '',
        payment_account_id:
          fullStudent.payment_account_id?.toString() ||
          fullStudent.payment_account?.id?.toString() ||
          '',
        hour: fullStudent.hour || '',
        monthly_sessions: fullStudent.monthly_sessions?.toString() || '',
        weekly_sessions: fullStudent.weekly_sessions?.toString() || '',
        weekly_days: parseWeeklyDaysFromApi(fullStudent.weekly_days as any),
        weekly_schedule: hasWeeklySchedule ? parseWeeklyScheduleFromApi(fullStudent.weekly_schedule as any) : {},
        useWeeklySchedule: hasWeeklySchedule,
        session_duration: fullStudent.session_duration?.toString() || '',
        hourly_rate: fullStudent.hourly_rate?.toString() || '',
        notes: fullStudent.notes || '',
        password: '', // Don't populate password field for security
        trial_session_attendance: fullStudent.trial_session_attendance || '',
        monthly_subscription_price: fullStudent.monthly_subscription_price?.toString() || '',
        country: fullStudent.country || '',
        currency: fullStudent.currency || '',
        // past_months_count: always editable, from subscriptions_statistics.past_months_count
        past_months_count: String(pastMonthsCount ?? ''),
        paid_months_count:
          fullStudent.paid_months_count?.toString() ||
          fullStudent.subscriptions_statistics?.paid_subscriptions?.toString() ||
          '',
        subscription_start_date: hasSubscriptions ? '' : subscriptionStartDate,
        paid_subscriptions_count: '',
      })
      setShowEditModal(true)
    } catch (error: any) {
      alert(error.message || 'فشل تحميل بيانات الطالب')
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      setIsSubmitting(true)
      try {
        // Build request data - weekly_schedule takes precedence over hour and weekly_days
        const updateData: any = {
          name: editForm.name,
          phone: editForm.phone,
          gender: editForm.gender as 'male' | 'female',
          package_id: editForm.package_id ? parseInt(editForm.package_id) : undefined,
          teacher_id: editForm.teacher_id ? parseInt(editForm.teacher_id) : undefined,
          session_duration: editForm.session_duration ? parseInt(editForm.session_duration) : undefined,
          hourly_rate: editForm.hourly_rate ? parseFloat(editForm.hourly_rate) : undefined,
          password: editForm.password || undefined, // Optional, min: 6 characters
          trial_session_attendance: editForm.trial_session_attendance || undefined,
          monthly_subscription_price: editForm.monthly_subscription_price ? parseFloat(editForm.monthly_subscription_price) : undefined,
          country: editForm.country || undefined,
          currency: editForm.currency || undefined,
        }

        if (editForm.payment_account_id) {
          updateData.payment_account_id = parseInt(editForm.payment_account_id, 10)
        } else {
          updateData.payment_account_id = null
        }

        // If using weekly_schedule, send it (takes precedence) and set hour to null
        if (editForm.useWeeklySchedule && Object.keys(editForm.weekly_schedule).length > 0) {
          updateData.weekly_schedule = toApiWeeklySchedule(editForm.weekly_schedule)
          updateData.hour = null
        } else {
          if (editForm.hour) updateData.hour = editForm.hour
          if (editForm.weekly_days.length > 0) updateData.weekly_days = toApiWeeklyDays(editForm.weekly_days)
        }

        applyDerivedSessionCounts(updateData, editForm)

        // past_months_count: always send when provided (editable for all students)
        if (editForm.past_months_count !== '') {
          updateData.past_months_count = parseInt(editForm.past_months_count)
        }
        if (editForm.paid_months_count !== '') {
          updateData.paid_months_count = parseInt(editForm.paid_months_count)
        }
        if (!editingStudentHasSubscriptions) {
          if (editForm.subscription_start_date) {
            updateData.subscription_start_date = editForm.subscription_start_date
          }
          if (editForm.paid_subscriptions_count) {
            updateData.paid_subscriptions_count = parseInt(editForm.paid_subscriptions_count)
          }
        }

        await updateStudent(editingId, updateData)
        await refreshOpenStudentViews()
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
          country: '',
          currency: '',
          past_months_count: '',
          paid_months_count: '',
          subscription_start_date: '',
          paid_subscriptions_count: '',
          payment_account_id: '',
        })
        setShowEditModal(false)
        setEditingStudentHasSubscriptions(false)
        setEditLinkedPaymentAccount(null)
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء التحديث')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingStudentHasSubscriptions(false)
    setEditingId(null)
    setEditLinkedPaymentAccount(null)
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
        country: '',
        currency: '',
        past_months_count: '',
        paid_months_count: '',
        subscription_start_date: '',
        paid_subscriptions_count: '',
        payment_account_id: '',
      })
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      try {
        await deleteStudent(id)
        onStudentChanged?.()
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء الحذف')
      }
    }
  }

  const handleForceDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من الحذف النهائي لهذا الطالب؟ لا يمكن التراجع عن هذا الإجراء.')) {
      try {
        await forceDeleteStudent(id)
        onStudentChanged?.()
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء الحذف النهائي')
      }
    }
  }


  // Session handlers
  const handleViewSessions = async (studentId: number) => {
    setSelectedStudentId(studentId)
    await fetchSessions({ student_id: studentId, per_page: 10000 })
    setShowSessionsModal(true)
  }

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) return
    setIsSubmitting(true)
    try {
      await addSession({
        student_id: selectedStudentId,
        teacher_id: sessionForm.teacher_id ? parseInt(sessionForm.teacher_id) : undefined,
        session_date: sessionForm.session_date,
        session_time: sessionForm.session_time,
        session_duration: sessionForm.session_duration ? parseInt(sessionForm.session_duration) : undefined,
        notes: sessionForm.notes || undefined,
      })
      setSessionForm({
        student_id: '',
        teacher_id: '',
        session_date: '',
        session_time: '',
        session_duration: '',
        notes: '',
      })
      setShowAddSessionModal(false)
      await fetchSessions({ student_id: selectedStudentId, per_page: 10000 })
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء إضافة الحصة')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteSession = async (id: number) => {
    if (confirm('هل أنت متأكد من تسجيل إتمام هذه الحصة؟')) {
      try {
        await completeSession(id)
        if (selectedStudentId) {
          await fetchSessions({ student_id: selectedStudentId, per_page: 10000 })
        }
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء تسجيل إتمام الحصة')
      }
    }
  }

  const handleRevertToPending = async (id: number) => {
    if (!confirm('هل أنت متأكد من إرجاع الحصة إلى قيد الانتظار؟')) return
    try {
      await revertSessionToPending(id)
      if (selectedStudentId) {
        await fetchSessions({ student_id: selectedStudentId, per_page: 10000 })
      }
    } catch (error: any) {
      alert(error.message || 'فشل إرجاع الحصة قيد الانتظار')
    }
  }

  const handleDeleteSession = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
      try {
        await deleteSession(id)
        if (selectedStudentId) {
          await fetchSessions({ student_id: selectedStudentId, per_page: 10000 })
        }
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء حذف الحصة')
      }
    }
  }
  const studentSessions = selectedStudentId 
    ? sessions.filter(s => s.student_id === selectedStudentId)
    : []

  const studentForActions = studentProp ?? { id: studentId }

  return (
    <>
      <div className={className}>
        {studentProp?.unpaid_subscriptions_list && Array.isArray(studentProp.unpaid_subscriptions_list) && studentProp.unpaid_subscriptions_list.length > 0 && (
          <div className="mb-2">
            <button
              onClick={() => handleViewUnpaidSubscriptions(studentForActions)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              اشتراكات غير مدفوعة: {studentProp.unpaid_subscriptions_list.map((sub: any) => sub.subscription_number || sub.id).join('، ')}
            </button>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => handleViewStudent(studentId)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="عرض التفاصيل"
          >
            <Eye className="w-4 h-4" />
          </button>
          {!hideAuditLogs && (
            <Link
              href={`/admin/students/${studentId}/audit-logs`}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex"
              title="سجل العمليات"
            >
              <History className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => handleViewSubscriptionsOnly(studentForActions)}
            className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            title="الاشتراكات"
          >
            <CreditCard className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewSessions(studentId)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="عرض الحصص"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(studentForActions)}
            className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
            title="تعديل"
          >
            <Edit className="w-4 h-4" />
          </button>
          {!hideDeleteActions && canDeleteStudents && (
            <>
              <button
                onClick={() => handleDelete(studentId)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleForceDelete(studentId)}
                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="حذف نهائي"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Student Details Modal */}
      <AnimatePresence>
        {showViewModal && viewedStudent && (
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
                <h2 className="text-2xl font-bold text-primary-900">تفاصيل الطالب</h2>
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
                    <label className="block text-primary-600 text-sm mb-1">الاسم</label>
                    <p className="text-primary-900 font-semibold">{viewedStudent.name}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">البريد الإلكتروني</label>
                    <p className="text-primary-900">{viewedStudent.email}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الهاتف</label>
                    <p className="text-primary-900">{viewedStudent.phone}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">العمر</label>
                    <p className="text-primary-900">{viewedStudent.age}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الجنس</label>
                    <p className="text-primary-900">{viewedStudent.gender_label || (viewedStudent.gender === 'male' ? 'ذكر' : 'أنثى')}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الباقة</label>
                    <p className="text-primary-900">{viewedStudent.package?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">المعلم</label>
                    <p className="text-primary-900">{viewedStudent.teacher?.name || '-'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-primary-600 text-sm mb-1">حساب التحويل (للطالب)</label>
                    {viewedStudent.payment_account ? (
                      <div className="rounded-lg border border-primary-100 bg-primary-50/50 p-3 text-sm space-y-1">
                        <p className="font-semibold text-primary-900">{viewedStudent.payment_account.title}</p>
                        <p className="text-primary-700">
                          {viewedStudent.payment_account.type_label ??
                            PAYMENT_ACCOUNT_TYPE_LABELS[
                              viewedStudent.payment_account.type as PaymentAccountType
                            ]}
                        </p>
                        {viewedStudent.payment_account.phone && (
                          <p dir="ltr" className="font-mono text-primary-800">
                            {viewedStudent.payment_account.phone}
                          </p>
                        )}
                        {viewedStudent.payment_account.account_number && (
                          <p dir="ltr" className="font-mono break-all text-primary-800">
                            {viewedStudent.payment_account.account_number}
                          </p>
                        )}
                        {viewedStudent.payment_account.bank_name && (
                          <p className="text-primary-800">{viewedStudent.payment_account.bank_name}</p>
                        )}
                        {viewedStudent.payment_account.notes && (
                          <p className="text-primary-600 whitespace-pre-wrap">{viewedStudent.payment_account.notes}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-primary-900">—</p>
                    )}
                  </div>
                  {viewedStudent.hour !== null && viewedStudent.hour !== undefined && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">وقت الحصة</label>
                      <p className="text-primary-900">{viewedStudent.hour}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الحصص الشهرية</label>
                    <p className="text-primary-900">{viewedStudent.monthly_sessions || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">الحصص الأسبوعية</label>
                    <p className="text-primary-900">{viewedStudent.weekly_sessions || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">جدول الأسبوع</label>
                    {viewedStudent.weekly_schedule && typeof viewedStudent.weekly_schedule === 'object' && Object.keys(viewedStudent.weekly_schedule).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(viewedStudent.weekly_schedule).map(([day, val]) => {
                          const dayObj = DAYS_OF_WEEK.find(d => d.value === day || d.arName === day)
                          const timeStr = typeof val === 'string' ? val : (val as any)?.time
                          const dur = typeof val === 'object' && val && 'session_duration' in val ? (val as any).session_duration : null
                          return (
                            <p key={day} className="text-primary-900">
                              <span className="font-medium">{dayObj?.label || day}:</span> {timeStr || '-'}
                              {dur != null && <span className="text-primary-600"> ({dur} د)</span>}
                            </p>
                          )
                        })}
                      </div>
                    ) : viewedStudent.hour !== null && viewedStudent.hour !== undefined ? (
                      <div>
                        <p className="text-primary-900 mb-2">
                          <span className="font-medium">الوقت الافتراضي:</span> {viewedStudent.hour}
                        </p>
                        <p className="text-primary-900">
                          <span className="font-medium">الأيام:</span>{' '}
                          {Array.isArray(viewedStudent.weekly_days) && viewedStudent.weekly_days.length > 0
                            ? viewedStudent.weekly_days.map((item: any) => {
                                const day = typeof item === 'string' ? item : item?.day
                                const dayObj = DAYS_OF_WEEK.find(d => d.value === day)
                                const dur = typeof item === 'object' && item?.session_duration != null ? ` (${item.session_duration} د)` : ''
                                return dayObj ? dayObj.label + dur : day
                              }).filter(Boolean).join('، ')
                            : '-'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-primary-900">-</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">مدة الحصة (دقيقة)</label>
                    <p className="text-primary-900">{viewedStudent.session_duration || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">سعر الساعة</label>
                    <p className="text-primary-900">{viewedStudent.hourly_rate ? `${viewedStudent.hourly_rate} جنيه` : '-'}</p>
                  </div>
                  {viewedStudent.trial_session_attendance && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">حالة جلسة التجربة</label>
                      <p className="text-primary-900">
                        {viewedStudent.trial_session_attendance_label || 
                         (viewedStudent.trial_session_attendance === 'not_booked' ? 'غير محجوز' :
                          viewedStudent.trial_session_attendance === 'booked' ? 'محجوز' : 'حضر')}
                      </p>
                    </div>
                  )}
                  {viewedStudent.monthly_subscription_price && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">سعر الاشتراك الشهري</label>
                      <p className="text-primary-900">
                        {viewedStudent.monthly_subscription_price} {viewedStudent.currency || 'EGP'}
                      </p>
                    </div>
                  )}
                  {viewedStudent.country && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">البلد</label>
                      <p className="text-primary-900">{viewedStudent.country}</p>
                    </div>
                  )}
                  {viewedStudent.currency && (
                    <div>
                      <label className="block text-primary-600 text-sm mb-1">العملة</label>
                      <p className="text-primary-900">{viewedStudent.currency}</p>
                    </div>
                  )}
                </div>
                {viewedStudent.notes && (
                  <div>
                    <label className="block text-primary-600 text-sm mb-1">ملاحظات</label>
                    <p className="text-primary-900">{viewedStudent.notes}</p>
                  </div>
                )}
                
                {viewedStudent.subscriptions_statistics && (
                  <div className="border-t-2 border-primary-200 pt-4 mt-4">
                    <h3 className="text-lg font-bold text-primary-900 mb-4 text-right">إحصائيات الاشتراكات</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-primary-50 p-4 rounded-lg">
                        <label className="block text-primary-600 text-sm mb-1">إجمالي الاشتراكات</label>
                        <p className="text-2xl font-bold text-primary-900">{viewedStudent.subscriptions_statistics.total_subscriptions || 0}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <label className="block text-green-600 text-sm mb-1">الاشتراكات المدفوعة</label>
                        <p className="text-2xl font-bold text-green-700">{viewedStudent.subscriptions_statistics.paid_subscriptions || 0}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <label className="block text-red-600 text-sm mb-1">الاشتراكات غير المدفوعة</label>
                        <p className="text-2xl font-bold text-red-700">{viewedStudent.subscriptions_statistics.unpaid_subscriptions || 0}</p>
                      </div>
                      {viewedStudent.subscriptions_statistics.total_sessions_count !== undefined && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <label className="block text-blue-600 text-sm mb-1">إجمالي الحصص</label>
                          <p className="text-2xl font-bold text-blue-700">{viewedStudent.subscriptions_statistics.total_sessions_count || 0}</p>
                        </div>
                      )}
                    </div>
                    {(viewedStudent.subscriptions_statistics.completed_sessions_count !== undefined || 
                      viewedStudent.subscriptions_statistics.remaining_sessions_count !== undefined) && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {viewedStudent.subscriptions_statistics.completed_sessions_count !== undefined && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <label className="block text-green-600 text-sm mb-1">الحصص المكتملة</label>
                            <p className="text-2xl font-bold text-green-700">{viewedStudent.subscriptions_statistics.completed_sessions_count || 0}</p>
                          </div>
                        )}
                        {viewedStudent.subscriptions_statistics.remaining_sessions_count !== undefined && (
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <label className="block text-yellow-600 text-sm mb-1">الحصص المتبقية</label>
                            <p className="text-2xl font-bold text-yellow-700">{viewedStudent.subscriptions_statistics.remaining_sessions_count || 0}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {(viewedStudent.subscriptions_statistics.first_subscription_date || 
                      viewedStudent.subscriptions_statistics.last_subscription_date) && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {viewedStudent.subscriptions_statistics.first_subscription_date && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="block text-gray-600 text-sm mb-1">تاريخ أول اشتراك</label>
                            <p className="text-lg font-bold text-gray-700">{viewedStudent.subscriptions_statistics.first_subscription_date}</p>
                          </div>
                        )}
                        {viewedStudent.subscriptions_statistics.last_subscription_date && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="block text-gray-600 text-sm mb-1">تاريخ آخر اشتراك</label>
                            <p className="text-lg font-bold text-gray-700">{viewedStudent.subscriptions_statistics.last_subscription_date}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Subscriptions Table */}
                {viewedStudent.subscriptions && Array.isArray(viewedStudent.subscriptions) && viewedStudent.subscriptions.length > 0 && (
                  <div className="border-t-2 border-primary-200 pt-4 mt-4">
                    <h3 className="text-lg font-bold text-primary-900 mb-4 text-right">الاشتراكات</h3>
                    <div className="overflow-x-auto">
                      <table className="border-collapse bg-white rounded-lg overflow-hidden shadow-sm" style={{ tableLayout: 'auto', minWidth: '100%' }}>
                        <thead className="bg-primary-100">
                          <tr>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">رقم الاشتراك</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">كود الاشتراك</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">تاريخ البدء</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">تاريخ الانتهاء</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الحصص/الأسبوع</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">إجمالي الحصص</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">مكتملة</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">متبقية</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">السعر / المتبقي</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الدفوع الجزئية</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الحالة</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewedStudent.subscriptions.map((subscription: any , index: number) => (
                            <tr key={subscription.id} className="border-b border-primary-100 hover:bg-primary-50 transition-colors">
                              <td className="px-4 py-3 text-primary-900 font-medium text-sm whitespace-nowrap">{subscription.subscription_number ?? index + 1}</td>
                              <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap font-mono">{subscription.subscription_code || '-'}</td>
                              <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">{subscription.start_date}</td>
                              <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">{subscription.end_date}</td>
                              <td className="px-4 py-3 text-primary-700 text-sm text-center whitespace-nowrap">{subscription.sessions_per_week || '-'}</td>
                              <td className="px-4 py-3 text-primary-700 text-sm text-center whitespace-nowrap">{subscription.total_sessions || '-'}</td>
                              <td className="px-4 py-3 text-primary-700 text-sm text-center whitespace-nowrap">{subscription.completed_sessions_count ?? 0}</td>
                              <td className="px-4 py-3 text-primary-700 text-sm text-center whitespace-nowrap">{subscription.remaining_sessions_count ?? 0}</td>
                              <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">
                                <div className="flex flex-col gap-0.5 items-end">
                                  {subscription.subscription_price != null && subscription.subscription_price !== '' && (
                                    <span>السعر: {typeof subscription.subscription_price === 'number' ? subscription.subscription_price : subscription.subscription_price}</span>
                                  )}
                                  {subscription.remaining_amount != null && (
                                    <span className={subscription.remaining_amount > 0 ? 'text-red-600 font-medium' : 'text-primary-600'}>
                                      المتبقي: {subscription.remaining_amount}
                                    </span>
                                  )}
                                  {(subscription.subscription_price == null || subscription.subscription_price === '') && subscription.remaining_amount == null && (
                                    <span className="text-primary-400">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-col gap-1 items-end min-w-[120px] max-w-[180px]">
                                  {subscription.partial_payments && Array.isArray(subscription.partial_payments) && subscription.partial_payments.length > 0 ? (
                                    subscription.partial_payments.map((pp: any) => (
                                      <div key={pp.id} className="flex items-center gap-1.5 justify-end">
                                        <span className="text-xs text-primary-700">
                                          {pp.amount} في {pp.payment_date}
                                        </span>
                                        {(pp.payment_receipt_image || pp.receipt_image) && (
                                          <button
                                            type="button"
                                            onClick={() => setViewingImage(pp.payment_receipt_image || pp.receipt_image)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="عرض صورة الإيصال"
                                          >
                                            <ImageIcon className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-primary-400 text-sm">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-col gap-2 items-end min-w-[140px]">
                                  {subscription.is_paid ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-semibold shadow-sm">
                                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                      مدفوع
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-xs font-semibold shadow-sm">
                                      <X className="w-4 h-4 flex-shrink-0" />
                                      غير مدفوع
                                    </span>
                                  )}
                                  {subscription.is_active && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold shadow-sm">
                                      <Clock className="w-4 h-4 flex-shrink-0" />
                                      نشط
                                    </span>
                                  )}
                                  {subscription.is_upcoming && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold shadow-sm">
                                      <Clock className="w-4 h-4 flex-shrink-0" />
                                      قادم
                                    </span>
                                  )}
                                  {subscription.is_expired && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold shadow-sm">
                                      <X className="w-4 h-4 flex-shrink-0" />
                                      منتهي
                                    </span>
                                  )}
                                  {subscription.status === 'paused' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-xs font-semibold shadow-sm">
                                      <Clock className="w-4 h-4 flex-shrink-0" />
                                      مُوقّف
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-col gap-2 items-center min-w-[180px]">
                                  <button
                                    onClick={() => handleToggleSubscriptionPayment(subscription.id, subscription.is_paid)}
                                    className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                                      subscription.is_paid
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                    title={subscription.is_paid ? 'تعيين كغير مدفوع' : 'تعيين كمدفوع'}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    {subscription.is_paid ? 'غير مدفوع' : 'مدفوع'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedSubscriptionForPartialPayment({
                                        subscriptionId: subscription.id,
                                        subscriptionNumber: subscription.subscription_number ?? index + 1,
                                      })
                                      setPartialPaymentForm({ amount: '', payment_date: '', receiptImage: null })
                                      setShowPartialPaymentModal(true)
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-xs font-semibold transition-all shadow-sm"
                                    title="دفع جزئي"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                    دفع جزئي
                                  </button>
                                  {subscription.is_active && subscription.status !== 'paused' && (
                                    <button
                                      onClick={() => {
                                        setSelectedSubscriptionForPause({
                                          subscriptionId: subscription.id,
                                          subscriptionNumber: index + 1,
                                        })
                                        setPauseForm({ pause_from: '', pause_to: '', resume_date: '' })
                                        setPauseModalMode('choice')
                                        setShowPauseModal(true)
                                      }}
                                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg text-xs font-semibold transition-all shadow-sm"
                                      title="إيقاف الاشتراك"
                                    >
                                      <Clock className="w-4 h-4" />
                                      إيقاف
                                    </button>
                                  )}
                                  {subscription.status === 'paused' && (
                                    <button
                                      onClick={async () => {
                                        const resumeDate = prompt('أدخل تاريخ الاستئناف (YYYY-MM-DD) أو اتركه فارغاً لاستخدام التاريخ الحالي:')
                                        if (resumeDate === null) return
                                        try {
                                          const { resumeSubscription } = await import('@/lib/api/students')
                                          await resumeSubscription(subscription.id, resumeDate || undefined)
                                          if (viewingId) {
                                            const updatedStudent = await getStudent(viewingId)
                                            setViewedStudent(updatedStudent)
                                          }
                                          if (selectedStudentForSubscriptions) {
                                            const updatedStudent = await getStudent(selectedStudentForSubscriptions.id)
                                            setSelectedStudentForSubscriptions(updatedStudent)
                                          }
                                        } catch (error: any) {
                                          alert(error.message || 'فشل استئناف الاشتراك')
                                        }
                                      }}
                                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-semibold transition-all shadow-sm"
                                      title="استئناف الاشتراك"
                                    >
                                      <Clock className="w-4 h-4" />
                                      استئناف
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
                )}
              </div>
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

                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">إجمالي الحصص</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">مكتملة</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">متبقية</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">السعر / المتبقي</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الدفوع الجزئية</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الحالة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentForSubscriptions.subscriptions.map((subscription: any, index: number) => (
                        <tr key={subscription.id} className="border-b border-primary-100 hover:bg-primary-50 transition-colors">
                          <td className="px-4 py-3 text-primary-900 font-medium text-sm whitespace-nowrap">{subscription.subscription_number ?? index + 1}</td>

                          <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">{subscription.start_date}</td>
                          <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">{subscription.end_date}</td>

                          <td className="px-4 py-3 text-primary-700 text-sm text-center whitespace-nowrap">{subscription.total_sessions || '-'}</td>
                          <td className="px-4 py-3 text-primary-700 text-sm text-center whitespace-nowrap">{subscription.completed_sessions_count ?? 0}</td>
                          <td className="px-4 py-3 text-primary-700 text-sm text-center whitespace-nowrap">{subscription.remaining_sessions_count ?? 0}</td>
                          <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">
                            <div className="flex flex-col gap-0.5 items-end">
                              {subscription.subscription_price != null && subscription.subscription_price !== '' && (
                                <span>السعر: {typeof subscription.subscription_price === 'number' ? subscription.subscription_price : subscription.subscription_price}</span>
                              )}
                              {subscription.remaining_amount != null && (
                                <span className={subscription.remaining_amount > 0 ? 'text-red-600 font-medium' : 'text-primary-600'}>
                                  المتبقي: {subscription.remaining_amount}
                                </span>
                              )}
                              {(subscription.subscription_price == null || subscription.subscription_price === '') && subscription.remaining_amount == null && (
                                <span className="text-primary-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1 items-end min-w-[120px] max-w-[180px]">
                              {subscription.partial_payments && Array.isArray(subscription.partial_payments) && subscription.partial_payments.length > 0 ? (
                                subscription.partial_payments.map((pp: any) => (
                                  <div key={pp.id} className="flex items-center gap-1.5 justify-end">
                                    <span className="text-xs text-primary-700">
                                      {pp.amount} في {pp.payment_date}
                                    </span>
                                    {(pp.payment_receipt_image || pp.receipt_image) && (
                                      <button
                                        type="button"
                                        onClick={() => setViewingImage(pp.payment_receipt_image || pp.receipt_image)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="عرض صورة الإيصال"
                                      >
                                        <ImageIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span className="text-primary-400 text-sm">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-2 items-end min-w-[140px]">
                              {subscription.is_paid ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-semibold shadow-sm">
                                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> مدفوع
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-xs font-semibold shadow-sm">
                                  <X className="w-4 h-4 flex-shrink-0" /> غير مدفوع
                                </span>
                              )}
                              {subscription.is_active && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold shadow-sm">
                                  <Clock className="w-4 h-4 flex-shrink-0" /> نشط
                                </span>
                              )}
                              {subscription.is_upcoming && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold shadow-sm">
                                  <Clock className="w-4 h-4 flex-shrink-0" /> قادم
                                </span>
                              )}
                              {subscription.is_expired && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold shadow-sm">
                                  <X className="w-4 h-4 flex-shrink-0" /> منتهي
                                </span>
                              )}
                              {subscription.status === 'paused' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-xs font-semibold shadow-sm">
                                  <Clock className="w-4 h-4 flex-shrink-0" /> مُوقّف
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-2 items-center min-w-[180px]">
                              <button
                                onClick={() => handleToggleSubscriptionPayment(subscription.id, subscription.is_paid)}
                                className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                                  subscription.is_paid ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                                title={subscription.is_paid ? 'تعيين كغير مدفوع' : 'تعيين كمدفوع'}
                              >
                                <CheckCircle className="w-4 h-4" />
                                {subscription.is_paid ? 'غير مدفوع' : 'مدفوع'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSubscriptionForPartialPayment({
                                    subscriptionId: subscription.id,
                                    subscriptionNumber: subscription.subscription_number ?? index + 1,
                                  })
                                  setPartialPaymentForm({ amount: '', payment_date: '', receiptImage: null })
                                  setShowPartialPaymentModal(true)
                                }}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-xs font-semibold transition-all shadow-sm"
                                title="دفع جزئي"
                              >
                                <DollarSign className="w-4 h-4" /> دفع جزئي
                              </button>
                              {subscription.is_active && subscription.status !== 'paused' && (
                                <button
                                  onClick={() => {
                                    setSelectedSubscriptionForPause({ subscriptionId: subscription.id, subscriptionNumber: index + 1 })
                                    setPauseForm({ pause_from: '', pause_to: '', resume_date: '' })
                                    setPauseModalMode('choice')
                                    setShowPauseModal(true)
                                  }}
                                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg text-xs font-semibold transition-all shadow-sm"
                                  title="إيقاف الاشتراك"
                                >
                                  <Clock className="w-4 h-4" /> إيقاف
                                </button>
                              )}
                              {subscription.status === 'paused' && (
                                <button
                                  onClick={async () => {
                                    const resumeDate = prompt('أدخل تاريخ الاستئناف (YYYY-MM-DD) أو اتركه فارغاً لاستخدام التاريخ الحالي:')
                                    if (resumeDate === null) return
                                    try {
                                      const { resumeSubscription } = await import('@/lib/api/students')
                                      await resumeSubscription(subscription.id, resumeDate || undefined)
                                      const updatedStudent = await getStudent(selectedStudentForSubscriptions.id)
                                      setSelectedStudentForSubscriptions(updatedStudent)
                                    } catch (error: any) {
                                      alert(error.message || 'فشل استئناف الاشتراك')
                                    }
                                  }}
                                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-semibold transition-all shadow-sm"
                                  title="استئناف الاشتراك"
                                >
                                  <Clock className="w-4 h-4" /> استئناف
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-primary-600 rounded-xl border-2 border-primary-200">
                  لا توجد اشتراكات مسجلة
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Subscription Modal */}
      <AnimatePresence>
        {showPauseModal && selectedSubscriptionForPause && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowPauseModal(false)
              setSelectedSubscriptionForPause(null)
              setPauseModalMode('choice')
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">
                  {pauseModalMode === 'choice' ? 'اختر نوع الإيقاف' : 'إيقاف الاشتراك مؤقتاً'}
                  {selectedSubscriptionForPause.subscriptionNumber != null && (
                    <span className="text-primary-600 font-normal mr-2">(اشتراك رقم {selectedSubscriptionForPause.subscriptionNumber})</span>
                  )}
                </h2>
                <button
                  onClick={() => {
                    setShowPauseModal(false)
                    setSelectedSubscriptionForPause(null)
                    setPauseModalMode('choice')
                  }}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {pauseModalMode === 'choice' ? (
                <div className="space-y-4">
                  <p className="text-primary-600 text-sm mb-4">
                    إيقاف فوري: إيقاف الاشتراك فوراً (سيتم حذف الحصص المستقبلية غير المكتملة). إيقاف مؤقت: تحديد فترة إيقاف بتواريخ وموعد استئناف.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handlePauseImmediate}
                      className="w-full px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium"
                    >
                      إيقاف فوري
                    </button>
                    <button
                      type="button"
                      onClick={() => setPauseModalMode('form')}
                      className="w-full px-6 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all font-medium"
                    >
                      إيقاف مؤقت (بتواريخ)
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPauseModal(false)
                      setSelectedSubscriptionForPause(null)
                      setPauseModalMode('choice')
                    }}
                    className="w-full mt-4 px-6 py-2 border-2 border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePauseTemporarySubmit} className="space-y-4">
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">تاريخ بداية الإيقاف (pause_from)</label>
                    <input
                      type="date"
                      value={pauseForm.pause_from}
                      onChange={(e) => setPauseForm({ ...pauseForm, pause_from: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">تاريخ نهاية الإيقاف (pause_to)</label>
                    <input
                      type="date"
                      value={pauseForm.pause_to}
                      onChange={(e) => setPauseForm({ ...pauseForm, pause_to: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-primary-900 font-semibold mb-2 text-right">تاريخ الاستئناف (resume_date)</label>
                    <input
                      type="date"
                      value={pauseForm.resume_date}
                      onChange={(e) => setPauseForm({ ...pauseForm, resume_date: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all"
                    >
                      إيقاف مؤقت
                    </button>
                    <button
                      type="button"
                      onClick={() => setPauseModalMode('choice')}
                      className="flex-1 px-6 py-3 border-2 border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-all"
                    >
                      رجوع
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partial Payment Modal */}
      <AnimatePresence>
        {showPartialPaymentModal && selectedSubscriptionForPartialPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[999999] flex items-center justify-center p-4"
            onClick={() => {
              setShowPartialPaymentModal(false)
              setSelectedSubscriptionForPartialPayment(null)
              setPartialPaymentForm({ amount: '', payment_date: '', receiptImage: null })
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">
                  دفع جزئي
                  {selectedSubscriptionForPartialPayment.subscriptionNumber != null && (
                    <span className="text-primary-600 font-normal mr-2">(اشتراك رقم {selectedSubscriptionForPartialPayment.subscriptionNumber})</span>
                  )}
                </h2>
                <button
                  onClick={() => {
                    setShowPartialPaymentModal(false)
                    setSelectedSubscriptionForPartialPayment(null)
                    setPartialPaymentForm({ amount: '', payment_date: '', receiptImage: null })
                  }}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePartialPaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">المبلغ (amount)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={partialPaymentForm.amount}
                    onChange={(e) => setPartialPaymentForm({ ...partialPaymentForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">تاريخ الدفع (payment_date)</label>
                  <input
                    type="date"
                    value={partialPaymentForm.payment_date}
                    onChange={(e) => setPartialPaymentForm({ ...partialPaymentForm, payment_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">صورة إيصال الدفع (اختياري)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setPartialPaymentForm({ ...partialPaymentForm, receiptImage: file || null })
                    }}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right file:ml-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700"
                  />
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmittingPartialPayment}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingPartialPayment ? 'جاري الحفظ...' : 'تسجيل الدفع'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPartialPaymentModal(false)
                      setSelectedSubscriptionForPartialPayment(null)
                      setPartialPaymentForm({ amount: '', payment_date: '', receiptImage: null })
                    }}
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (!selectedStudentId) return
                      try {
                        const student = await getStudent(selectedStudentId)
                        setSessionForm({
                          student_id: selectedStudentId.toString(),
                          teacher_id: student?.teacher_id?.toString() || '',
                          session_date: '',
                          session_time: student?.hour || '',
                          session_duration: student?.session_duration?.toString() || '',
                          notes: '',
                        })
                        setShowAddSessionModal(true)
                      } catch (error: any) {
                        alert(error.message || 'فشل تحميل بيانات الطالب')
                      }
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline ml-2" />
                    إضافة حصة
                  </button>
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
              </div>

              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : studentSessions.length === 0 ? (
                <div className="text-center py-12 text-primary-600">لا توجد حصص مسجلة</div>
              ) : (
                <div className="space-y-4">
                  {studentSessions.map((session, index) => (
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
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white font-bold text-base sm:text-lg flex-shrink-0">
                                {(session as any).session_number || index + 1}
                              </span>
                              <p className="font-bold text-lg sm:text-xl text-primary-900">
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

      {/* Add Session Modal */}
      <AnimatePresence>
        {showAddSessionModal && selectedStudentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowAddSessionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">إضافة حصة جديدة</h2>
                <button
                  onClick={() => setShowAddSessionModal(false)}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSession} className="space-y-4">
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">تاريخ الحصة</label>
                  <input
                    type="date"
                    value={sessionForm.session_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">وقت الحصة</label>
                  <input
                    type="time"
                    value={sessionForm.session_time}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_time: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">مدة الحصة (بالدقائق)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={sessionForm.session_duration}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_duration: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                    placeholder="مثال: 30"
                  />
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">المعلم</label>
                  <select
                    value={sessionForm.teacher_id}
                    onChange={(e) => setSessionForm({ ...sessionForm, teacher_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                  >
                    <option value="">اختر المعلم (اختياري)</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-primary-900 font-semibold mb-2 text-right">ملاحظات</label>
                  <textarea
                    value={sessionForm.notes}
                    onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                    dir="rtl"
                  />
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'جاري الإضافة...' : 'إضافة حصة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSessionModal(false)}
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

      {/* Edit Student Modal - Keep existing code */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCloseEditModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">تعديل بيانات الطالب</h2>
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
                    <label className="block text-primary-900 font-semibold mb-2 text-right">
                      الاسم الكامل
                    </label>
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
                    <label className="block text-primary-900 font-semibold mb-2 text-right">
                      رقم الهاتف
                    </label>
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
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-primary-900 font-semibold">جدول الأسبوع</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.useWeeklySchedule}
                        onChange={(e) => setEditForm({ ...editForm, useWeeklySchedule: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-primary-700 text-sm">استخدام جدول متقدم (وقت مختلف لكل يوم)</span>
                    </label>
                  </div>
                  <p className="text-xs text-primary-500 mb-3">
                    يُحسب عدد الحصص الأسبوعية والشهرية تلقائياً من عدد أيام الجدول المختارة (شهري = أسبوعي × 4).
                  </p>
                  
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
                            placeholder="وقت"
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
                <div className="border-t-2 border-primary-200 pt-4 mt-4">
                  <h3 className="text-lg font-bold text-primary-900 mb-4 text-right">بيانات الدفع والاشتراك</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="md:col-span-2">
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
                
                <div className="border-t-2 border-primary-200 pt-4 mt-4">
                  <h3 className="text-lg font-bold text-primary-900 mb-4 text-right">إعدادات الاشتراكات</h3>
                  <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${editingStudentHasSubscriptions ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                    <div>
                      <label className="block text-primary-900 font-semibold mb-2 text-right">
                        عدد الأشهر السابقة (past_months_count)
                      </label>
                      <input
                        type="number"
                       
                        value={editForm.past_months_count}
                        onChange={(e) => setEditForm({ ...editForm, past_months_count: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                        placeholder="0-120"
                      />
                    </div>
                    <div>
                      <label className="block text-primary-900 font-semibold mb-2 text-right">
                        عدد الأشهر المدفوعة (paid_months_count)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={editForm.paid_months_count}
                        onChange={(e) => setEditForm({ ...editForm, paid_months_count: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                        placeholder="0-120"
                      />
                    </div>
                    {!editingStudentHasSubscriptions && (
                    <div>
                      <label className="block text-primary-900 font-semibold mb-2 text-right">
                        تاريخ بداية الاشتراك
                      </label>
                      <input
                        type="date"
                        value={editForm.subscription_start_date}
                        onChange={(e) => setEditForm({ ...editForm, subscription_start_date: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
                      />
                    </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
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

      {/* Unpaid Subscriptions Modal */}
      <AnimatePresence>
        {showUnpaidSubscriptionsModal && selectedStudentForUnpaid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowUnpaidSubscriptionsModal(false)
              setSelectedStudentForUnpaid(null)
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
                <h2 className="text-2xl font-bold text-primary-900">
                  الاشتراكات غير المدفوعة - {selectedStudentForUnpaid.name}
                </h2>
                <button
                  onClick={() => {
                    setShowUnpaidSubscriptionsModal(false)
                    setSelectedStudentForUnpaid(null)
                  }}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedStudentForUnpaid.unpaid_subscriptions_list &&
               Array.isArray(selectedStudentForUnpaid.unpaid_subscriptions_list) &&
               selectedStudentForUnpaid.unpaid_subscriptions_list.length > 0 ? (
                <div className="overflow-x-auto border border-primary-200 rounded-xl">
                  <table className="border-collapse bg-white w-full" style={{ tableLayout: 'auto', minWidth: '100%' }}>
                    <thead className="bg-primary-100">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">رقم الاشتراك</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">تاريخ البدء</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">تاريخ الانتهاء</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">إجمالي الحصص</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">مكتملة</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">متبقية</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">السعر / المتبقي</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الدفوع الجزئية</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الحالة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-primary-900 border-b-2 border-primary-200 whitespace-nowrap">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentForUnpaid.unpaid_subscriptions_list.map((unpaidSub: any) => {
                        const sub = selectedStudentForUnpaid.subscriptions?.find((s: any) => s.id === unpaidSub.id)
                        return (
                          <tr key={unpaidSub.id} className="border-b border-primary-100 hover:bg-red-50/50 transition-colors">
                            <td className="px-4 py-3 text-primary-900 font-medium text-sm whitespace-nowrap">{unpaidSub.subscription_number ?? unpaidSub.id}</td>
                            <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">{sub?.start_date ?? '-'}</td>
                            <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">{sub?.end_date ?? '-'}</td>
                            <td className="px-4 py-3 text-primary-700 text-sm text-center whitespace-nowrap">{sub?.total_sessions ?? '-'}</td>
                            <td className="px-4 py-3 text-primary-700 text-sm text-center whitespace-nowrap">{sub?.completed_sessions_count ?? 0}</td>
                            <td className="px-4 py-3 text-primary-700 text-sm text-center whitespace-nowrap">{sub?.remaining_sessions_count ?? 0}</td>
                            <td className="px-4 py-3 text-primary-700 text-sm whitespace-nowrap">
                              <div className="flex flex-col gap-0.5 items-end">
                                {sub && sub.subscription_price != null && sub.subscription_price !== '' && (
                                  <span>السعر: {typeof sub.subscription_price === 'number' ? sub.subscription_price : sub.subscription_price}</span>
                                )}
                                {sub && sub.remaining_amount != null && (
                                  <span className={sub.remaining_amount > 0 ? 'text-red-600 font-medium' : 'text-primary-600'}>
                                    المتبقي: {sub.remaining_amount}
                                  </span>
                                )}
                                {(!sub || ((sub.subscription_price == null || sub.subscription_price === '') && sub.remaining_amount == null)) && (
                                  <span className="text-primary-400">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="flex flex-col gap-1 items-end min-w-[100px] max-w-[160px]">
                                {sub?.partial_payments && Array.isArray(sub.partial_payments) && sub.partial_payments.length > 0 ? (
                                  sub.partial_payments.map((pp: any) => (
                                    <div key={pp.id} className="flex items-center gap-1.5 justify-end">
                                      <span className="text-xs text-primary-700">
                                        {pp.amount} في {pp.payment_date}
                                      </span>
                                      {(pp.payment_receipt_image || pp.receipt_image) && (
                                        <button
                                          type="button"
                                          onClick={() => setViewingImage(pp.payment_receipt_image || pp.receipt_image)}
                                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                          title="عرض صورة الإيصال"
                                        >
                                          <ImageIcon className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-primary-400 text-sm">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="flex flex-col gap-1.5 items-end min-w-[100px]">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-semibold">
                                  <X className="w-3.5 h-3.5 flex-shrink-0" />
                                  غير مدفوع
                                </span>
                                {sub?.is_active && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                                    <Clock className="w-3.5 h-3.5 flex-shrink-0" /> نشط
                                  </span>
                                )}
                                {sub?.is_upcoming && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold">
                                    <Clock className="w-3.5 h-3.5 flex-shrink-0" /> قادم
                                  </span>
                                )}
                                {sub?.is_expired && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                                    <X className="w-3.5 h-3.5 flex-shrink-0" /> منتهي
                                  </span>
                                )}
                                {sub?.status === 'paused' && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs font-semibold">
                                    <Clock className="w-3.5 h-3.5 flex-shrink-0" /> مُوقّف
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="flex flex-col gap-2 items-center min-w-[140px]">
                                <button
                                  onClick={() => {
                                    setSelectedSubscriptionForPartialPayment({
                                      subscriptionId: unpaidSub.id,
                                      subscriptionNumber: unpaidSub.subscription_number ?? unpaidSub.id,
                                    })
                                    setPartialPaymentForm({ amount: '', payment_date: '', receiptImage: null })
                                    setShowPartialPaymentModal(true)
                                  }}
                                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                                  title="دفع جزئي"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  دفع جزئي
                                </button>
                                <button
                                  onClick={() => handleToggleSubscriptionPayment(unpaidSub.id, false)}
                                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  تعيين كمدفوع
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-primary-600">
                  لا توجد اشتراكات غير مدفوعة
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image viewer for receipt images (e.g. partial payment receipts) */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[999999] flex items-center justify-center p-4"
            onClick={() => setViewingImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-[95vw] max-h-[95vh]"
            >
              <img src={viewingImage} alt="صورة الإيصال" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="absolute -top-10 left-0 p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}
