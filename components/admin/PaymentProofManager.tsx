'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import {
  addTeacherPaymentFiles,
  deleteTeacherPaymentFile,
  getPaymentProofUrls,
  type TeacherPayment,
} from '@/lib/api/teacher-salary'

export default function PaymentProofManager({
  teacherId,
  payment,
  className = '',
  onUpdated,
}: {
  teacherId: number
  payment: TeacherPayment
  className?: string
  onUpdated?: (payment: TeacherPayment) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentPayment, setCurrentPayment] = useState(payment)
  const [isAdding, setIsAdding] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)

  useEffect(() => {
    setCurrentPayment(payment)
  }, [payment])

  const urls = getPaymentProofUrls(currentPayment)

  const handleUpdated = (updated: TeacherPayment) => {
    setCurrentPayment(updated)
    onUpdated?.(updated)
  }

  const handleAddFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
    event.target.value = ''
    if (selected.length === 0) return

    setIsAdding(true)
    try {
      const updated = await addTeacherPaymentFiles(teacherId, currentPayment.id, selected)
      handleUpdated(updated)
    } catch (error: any) {
      alert(error.message || 'فشل إضافة صور إثبات الدفع')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteFile = async (fileIndex: number) => {
    if (urls.length <= 1) {
      alert('لا يمكن حذف آخر صورة متبقية')
      return
    }
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return

    setDeletingIndex(fileIndex)
    try {
      const updated = await deleteTeacherPaymentFile(teacherId, currentPayment.id, fileIndex)
      handleUpdated(updated)
    } catch (error: any) {
      alert(error.message || 'فشل حذف الصورة')
    } finally {
      setDeletingIndex(null)
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-primary-600 text-sm">إثبات الدفع</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAdding}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-100 text-primary-800 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'جاري الإضافة...' : 'إضافة صور'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleAddFiles}
        />
      </div>

      {urls.length === 0 ? (
        <p className="text-sm text-primary-500">لا توجد صور إثبات</p>
      ) : (
        <ul className="space-y-2">
          {urls.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg"
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-2 text-sm break-all min-w-0"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                {urls.length === 1 ? 'عرض إثبات الدفع' : `عرض إثبات الدفع ${index + 1}`}
              </a>
              <button
                type="button"
                onClick={() => handleDeleteFile(index)}
                disabled={urls.length <= 1 || deletingIndex === index}
                title={urls.length <= 1 ? 'لا يمكن حذف آخر صورة' : 'حذف الصورة'}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {deletingIndex === index ? (
                  <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
