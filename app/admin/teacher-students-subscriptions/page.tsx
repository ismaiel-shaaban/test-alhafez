'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Eye,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useAdminStore } from '@/store/useAdminStore'
import SearchableTeacherSelect from '@/components/admin/SearchableTeacherSelect'
import {
  getTeacherStudentsBulkPreview,
  pauseTeacherStudentsSubscriptions,
  resumeTeacherStudentsSubscriptions,
  studentCanPause,
  studentCanResume,
  type BulkPreviewResponse,
  type BulkPreviewStudent,
  type TeacherStudentsPauseMode,
} from '@/lib/api/teacher-students-subscriptions'

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatActionResult(res: Record<string, unknown>): string {
  const parts: string[] = []
  if (res.message) parts.push(String(res.message))
  if (res.paused_count != null) parts.push(`تم إيقاف: ${res.paused_count}`)
  if (res.resumed_count != null) parts.push(`تم استئناف: ${res.resumed_count}`)
  if (res.affected_count != null) parts.push(`متأثرون: ${res.affected_count}`)
  if (res.failed_count != null && Number(res.failed_count) > 0) {
    parts.push(`فشل: ${res.failed_count}`)
  }
  return parts.length > 0 ? parts.join(' — ') : 'تمت العملية بنجاح'
}

export default function TeacherStudentsSubscriptionsPage() {
  const { teachers, fetchTeachers } = useAdminStore()
  const [teacherId, setTeacherId] = useState('')
  const [preview, setPreview] = useState<BulkPreviewResponse | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [submittingPause, setSubmittingPause] = useState(false)
  const [submittingResume, setSubmittingResume] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pauseMode, setPauseMode] = useState<TeacherStudentsPauseMode>('immediate')
  const [pauseFrom, setPauseFrom] = useState(todayIsoDate())
  const [pauseTo, setPauseTo] = useState('')
  const [resumeDate, setResumeDate] = useState(todayIsoDate())

  useEffect(() => {
    fetchTeachers(1, 1000)
  }, [fetchTeachers])

  const students = preview?.students ?? []

  const pauseEligibleIds = useMemo(
    () => students.filter(studentCanPause).map((s) => s.id),
    [students]
  )
  const resumeEligibleIds = useMemo(
    () => students.filter(studentCanResume).map((s) => s.id),
    [students]
  )

  const loadPreview = useCallback(async () => {
    if (!teacherId) {
      alert('يرجى اختيار المعلم أولاً')
      return
    }
    setLoadingPreview(true)
    setError(null)
    try {
      const data = await getTeacherStudentsBulkPreview(parseInt(teacherId, 10))
      setPreview(data)
      setSelectedIds([])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تحميل المعاينة')
      setPreview(null)
      setSelectedIds([])
    } finally {
      setLoadingPreview(false)
    }
  }, [teacherId])

  const toggleStudent = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAllPauseEligible = () => setSelectedIds([...pauseEligibleIds])
  const selectAllResumeEligible = () => setSelectedIds([...resumeEligibleIds])
  const clearSelection = () => setSelectedIds([])

  const handlePause = async () => {
    if (!teacherId) {
      alert('يرجى اختيار المعلم')
      return
    }
    if (pauseMode === 'temporary') {
      if (!pauseFrom || !pauseTo) {
        alert('يرجى تحديد تاريخ بداية ونهاية الإيقاف المؤقت')
        return
      }
      if (pauseTo < pauseFrom) {
        alert('تاريخ النهاية يجب أن يكون بعد تاريخ البداية')
        return
      }
    }

    const scope =
      selectedIds.length > 0
        ? `${selectedIds.length} طالب محدد`
        : 'جميع طلاب المعلم المؤهلين'
    const modeLabel = pauseMode === 'immediate' ? 'إيقاف فوري' : 'إيقاف مؤقت'
    if (
      !confirm(
        `هل أنت متأكد من ${modeLabel} لـ ${scope}؟\nسيتم إيقاف الاشتراكات النشطة وحذف الحصص غير المكتملة في فترة الإيقاف.`
      )
    ) {
      return
    }

    setSubmittingPause(true)
    try {
      const body: Parameters<typeof pauseTeacherStudentsSubscriptions>[0] = {
        teacher_id: parseInt(teacherId, 10),
        mode: pauseMode,
      }
      if (pauseMode === 'temporary') {
        body.pause_from = pauseFrom
        body.pause_to = pauseTo
      }
      if (selectedIds.length > 0) body.student_ids = selectedIds

      const res = await pauseTeacherStudentsSubscriptions(body)
      alert(formatActionResult(res as Record<string, unknown>))
      await loadPreview()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'فشل إيقاف الاشتراكات')
    } finally {
      setSubmittingPause(false)
    }
  }

  const handleResume = async () => {
    if (!teacherId) {
      alert('يرجى اختيار المعلم')
      return
    }
    if (!resumeDate) {
      alert('يرجى تحديد تاريخ الاستئناف')
      return
    }

    const scope =
      selectedIds.length > 0
        ? `${selectedIds.length} طالب محدد`
        : 'جميع طلاب المعلم المؤهلين'
    if (
      !confirm(
        `هل أنت متأكد من استئناف اشتراكات ${scope} بتاريخ ${resumeDate}؟`
      )
    ) {
      return
    }

    setSubmittingResume(true)
    try {
      const body: Parameters<typeof resumeTeacherStudentsSubscriptions>[0] = {
        teacher_id: parseInt(teacherId, 10),
        resume_date: resumeDate,
      }
      if (selectedIds.length > 0) body.student_ids = selectedIds

      const res = await resumeTeacherStudentsSubscriptions(body)
      alert(formatActionResult(res as Record<string, unknown>))
      await loadPreview()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'فشل استئناف الاشتراكات')
    } finally {
      setSubmittingResume(false)
    }
  }

  const renderEligibility = (student: BulkPreviewStudent) => {
    const canPause = studentCanPause(student)
    const canResume = studentCanResume(student)
    if (canPause && canResume) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5" />
          إيقاف / استئناف
        </span>
      )
    }
    if (canPause) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-orange-100 text-orange-800">
          <PauseCircle className="w-3.5 h-3.5" />
          يمكن إيقافه
        </span>
      )
    }
    if (canResume) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-100 text-green-800">
          <PlayCircle className="w-3.5 h-3.5" />
          يمكن استئنافه
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
        <XCircle className="w-3.5 h-3.5" />
        غير متاح
      </span>
    )
  }

  return (
    <div className="px-2 sm:px-0" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 flex items-center gap-2">
          <PauseCircle className="w-8 h-8 sm:w-9 sm:h-9 text-primary-600" />
          إيقاف واستئناف طلاب المعلم
        </h1>
      </div>

      <p className="text-sm text-primary-600 mb-6 max-w-3xl">
        اختر المعلم، ثم اعمل معاينة لطلابه. يمكنك إيقاف الاشتراكات (فوري أو مؤقت) أو
        استئنافها لاحقاً. إذا لم تحدد طلاباً، تُطبَّق العملية على كل طلاب المعلم
        المؤهلين.
      </p>

      <div className="bg-white rounded-xl border-2 border-primary-200 p-4 sm:p-6 mb-6 shadow-lg space-y-4">
        <h2 className="font-bold text-primary-900 text-lg">1) اختيار المعلم والمعاينة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">المعلم *</label>
            <SearchableTeacherSelect
              value={teacherId}
              onChange={(value) => {
                setTeacherId(value)
                setPreview(null)
                setSelectedIds([])
                setError(null)
              }}
              teachers={teachers}
              placeholder="اختر المعلم"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={loadPreview}
              disabled={!teacherId || loadingPreview}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
            >
              {loadingPreview ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
              معاينة الطلاب
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {preview && (
        <>
          <div className="bg-white rounded-xl border-2 border-primary-200 p-4 sm:p-6 mb-6 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold text-primary-900 text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  2) معاينة الطلاب
                </h2>
                <p className="text-sm text-primary-600 mt-1">
                  {preview.teacher?.name && `${preview.teacher.name} — `}
                  إجمالي {preview.summary?.total ?? students.length} طالب
                  {(preview.summary?.can_pause ?? pauseEligibleIds.length) > 0 &&
                    ` · ${preview.summary?.can_pause ?? pauseEligibleIds.length} قابل للإيقاف`}
                  {(preview.summary?.can_resume ?? resumeEligibleIds.length) > 0 &&
                    ` · ${preview.summary?.can_resume ?? resumeEligibleIds.length} قابل للاستئناف`}
                </p>
              </div>
              <button
                type="button"
                onClick={loadPreview}
                disabled={loadingPreview}
                className="inline-flex items-center gap-2 px-3 py-2 border-2 border-primary-200 rounded-lg hover:bg-primary-50 text-primary-800 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPreview ? 'animate-spin' : ''}`} />
                تحديث
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={selectAllPauseEligible}
                className="text-xs px-3 py-1.5 rounded-lg border border-orange-200 text-orange-800 hover:bg-orange-50"
              >
                تحديد القابلين للإيقاف
              </button>
              <button
                type="button"
                onClick={selectAllResumeEligible}
                className="text-xs px-3 py-1.5 rounded-lg border border-green-200 text-green-800 hover:bg-green-50"
              >
                تحديد القابلين للاستئناف
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs px-3 py-1.5 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                إلغاء التحديد (الكل)
              </button>
              <span className="text-xs text-primary-500 self-center">
                {selectedIds.length > 0
                  ? `${selectedIds.length} طالب محدد`
                  : 'بدون تحديد = كل طلاب المعلم المؤهلين'}
              </span>
            </div>

            {students.length === 0 ? (
              <p className="text-center py-8 text-primary-600">لا يوجد طلاب لهذا المعلم</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-primary-100">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-primary-50 text-primary-900">
                    <tr>
                      <th className="px-3 py-2 text-right w-10"></th>
                      <th className="px-3 py-2 text-right">الطالب</th>
                      <th className="px-3 py-2 text-right">الهاتف</th>
                      <th className="px-3 py-2 text-right">حالة الاشتراك</th>
                      <th className="px-3 py-2 text-right">الإجراء المتاح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-t border-primary-100 hover:bg-primary-50/50">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            className="w-4 h-4 rounded border-primary-300"
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-primary-900">
                          {student.name || `#${student.id}`}
                        </td>
                        <td className="px-3 py-2 font-mono text-primary-700" dir="ltr">
                          {student.phone || '—'}
                        </td>
                        <td className="px-3 py-2 text-primary-700">
                          {student.subscription_status || student.status || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            {renderEligibility(student)}
                            {student.reason && (
                              <span className="text-xs text-primary-500">{student.reason}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-orange-200 p-4 sm:p-6 shadow-lg"
            >
              <h2 className="font-bold text-primary-900 text-lg flex items-center gap-2 mb-4">
                <PauseCircle className="w-5 h-5 text-orange-600" />
                3) إيقاف الاشتراكات
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">نوع الإيقاف</label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pauseMode"
                        checked={pauseMode === 'immediate'}
                        onChange={() => setPauseMode('immediate')}
                      />
                      <span>إيقاف فوري</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pauseMode"
                        checked={pauseMode === 'temporary'}
                        onChange={() => setPauseMode('temporary')}
                      />
                      <span>إيقاف مؤقت</span>
                    </label>
                  </div>
                </div>
                {pauseMode === 'temporary' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">من تاريخ</label>
                      <input
                        type="date"
                        value={pauseFrom}
                        onChange={(e) => setPauseFrom(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">إلى تاريخ</label>
                      <input
                        type="date"
                        value={pauseTo}
                        onChange={(e) => setPauseTo(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg"
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-primary-500">
                  الإيقاف الفوري يوقف كل الطلاب ذوي الاشتراك النشط. يمكن تحديد طلاب معيّنين من
                  الجدول أعلاه.
                </p>
                <button
                  type="button"
                  onClick={handlePause}
                  disabled={submittingPause || pauseEligibleIds.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-semibold"
                >
                  {submittingPause ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PauseCircle className="w-5 h-5" />
                  )}
                  تنفيذ الإيقاف
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-green-200 p-4 sm:p-6 shadow-lg"
            >
              <h2 className="font-bold text-primary-900 text-lg flex items-center gap-2 mb-4">
                <PlayCircle className="w-5 h-5 text-green-600" />
                4) استئناف الاشتراكات
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    تاريخ الاستئناف *
                  </label>
                  <input
                    type="date"
                    value={resumeDate}
                    onChange={(e) => setResumeDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg"
                  />
                </div>
                <p className="text-xs text-primary-500">
                  يُستأنف الاشتراك من التاريخ المحدد. بدون تحديد طلاب تُطبَّق على كل المؤهلين
                  للاستئناف.
                </p>
                <button
                  type="button"
                  onClick={handleResume}
                  disabled={submittingResume || resumeEligibleIds.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                >
                  {submittingResume ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  تنفيذ الاستئناف
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
}
