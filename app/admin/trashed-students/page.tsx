'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, RefreshCw, RotateCcw, AlertTriangle, User, Search, X } from 'lucide-react'
import { listTrashedStudents, restoreTrashedStudent, forceDeleteStudent, Student } from '@/lib/api/students'
import { useAdminPermissions } from '@/hooks/useAdminPermissions'

const PER_PAGE = 15

export default function TrashedStudentsPage() {
  const { canDeleteStudents } = useAdminPermissions()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<{ total: number; current_page: number; last_page: number; total_pages?: number } | null>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    loadTrashedStudents()
  }, [currentPage, searchTerm])

  const loadTrashedStudents = async () => {
    setLoading(true)
    try {
      const data = await listTrashedStudents({
        page: currentPage,
        per_page: PER_PAGE,
        search: searchTerm || undefined,
      })
      setStudents(data?.students || [])
      setPagination(data?.pagination || null)
    } catch (error: any) {
      console.error('Error loading trashed students:', error)
      setStudents([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (id: number) => {
    if (!confirm('هل أنت متأكد من إعادة تفعيل هذا الطالب؟')) return
    setProcessingId(id)
    try {
      await restoreTrashedStudent(id)
      await loadTrashedStudents()
    } catch (error: any) {
      alert(error.message || 'فشل إعادة التفعيل')
    } finally {
      setProcessingId(null)
    }
  }

  const handleForceDelete = async (id: number) => {
    if (!canDeleteStudents) {
      alert('ليس لديك صلاحية حذف الطلاب')
      return
    }
    if (!confirm('تحذير: الحذف النهائي لا يمكن التراجع عنه. سيتم حذف الطالب وجميع بياناته بشكل دائم. هل أنت متأكد؟')) return
    setProcessingId(id)
    try {
      await forceDeleteStudent(id)
      await loadTrashedStudents()
    } catch (error: any) {
      alert(error.message || 'فشل الحذف النهائي')
    } finally {
      setProcessingId(null)
    }
  }

  const lastPage = pagination?.last_page ?? pagination?.total_pages ?? 1
  const showPagination = lastPage > 1

  return (
    <div className="px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900">الطلاب المحذوفة</h1>
        <div className="flex items-center gap-2">
          <div className="text-primary-600 font-medium text-sm sm:text-base">إجمالي: {pagination?.total ?? students.length}</div>
          <button
            onClick={loadTrashedStudents}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            تحديث
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border-2 border-primary-200 p-4 mb-6 shadow-lg">
        <div className="relative">
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
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl border-2 border-primary-200 overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-primary-600">
            <Trash2 className="w-16 h-16 mx-auto mb-4 text-primary-300" />
            <p className="text-lg">{searchTerm ? 'لا توجد نتائج' : 'لا يوجد طلاب محذوفة'}</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-primary-200">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="p-4 bg-red-50/50 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-primary-600 shrink-0" />
                        <span className="font-bold text-primary-900 truncate">{student.name}</span>
                      </div>
                      <p className="text-sm text-primary-600 truncate" dir="ltr">{student.phone}</p>
                      {student.email && (
                        <p className="text-xs text-primary-500 truncate">{student.email}</p>
                      )}
                      {(student.package?.name || student.teacher?.name) && (
                        <p className="text-xs text-primary-500 mt-1">
                          {student.package?.name}{student.teacher?.name && ` - ${student.teacher.name}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRestore(student.id)}
                        disabled={processingId === student.id}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title="إعادة التفعيل"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                      {canDeleteStudents && (
                        <button
                          onClick={() => handleForceDelete(student.id)}
                          disabled={processingId === student.id}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                          title="حذف نهائي"
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-100">
                  <tr>
                    <th className="px-6 py-4 text-right text-primary-900 font-semibold">الاسم</th>
                    <th className="px-6 py-4 text-right text-primary-900 font-semibold">البريد</th>
                    <th className="px-6 py-4 text-right text-primary-900 font-semibold">الهاتف</th>
                    <th className="px-6 py-4 text-right text-primary-900 font-semibold">العمر</th>
                    <th className="px-6 py-4 text-right text-primary-900 font-semibold">الباقة</th>
                    <th className="px-6 py-4 text-right text-primary-900 font-semibold">المعلم</th>
                    <th className="px-6 py-4 text-center text-primary-900 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-primary-200 hover:bg-red-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-primary-900 font-medium">{student.name}</td>
                      <td className="px-6 py-4 text-primary-700">{student.email || '-'}</td>
                      <td className="px-6 py-4 text-primary-700" dir="ltr">{student.phone}</td>
                      <td className="px-6 py-4 text-primary-700">{student.age || '-'}</td>
                      <td className="px-6 py-4 text-primary-700">{student.package?.name || '-'}</td>
                      <td className="px-6 py-4 text-primary-700">{student.teacher?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleRestore(student.id)}
                            disabled={processingId === student.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            title="إعادة التفعيل"
                          >
                            <RotateCcw className="w-4 h-4" />
                            إعادة التفعيل
                          </button>
                          {canDeleteStudents && (
                            <button
                              onClick={() => handleForceDelete(student.id)}
                              disabled={processingId === student.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                              title="حذف نهائي"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              حذف نهائي
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {showPagination && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-primary-200 mt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                <span className="px-4 py-2 text-primary-700">
                  صفحة {currentPage} من {lastPage}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  disabled={currentPage >= lastPage}
                  className="px-4 py-2 border-2 border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
