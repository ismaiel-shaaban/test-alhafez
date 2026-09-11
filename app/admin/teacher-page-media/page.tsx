'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2,
  X,
  RefreshCw,
  Filter,
  Eye,
  Image as ImageIcon,
  Video,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAdminStore } from '@/store/useAdminStore'
import {
  listTeacherPageMedia,
  deleteTeacherPageMedia,
  TEACHER_PAGE_MEDIA_TYPE_LABELS,
  type TeacherPageMedia,
  type TeacherPageMediaType,
} from '@/lib/api/teacher-page-media'

function formatCreatedAt(value?: string): string {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('ar-EG')
}

function formatFileSize(item: TeacherPageMedia): string {
  if (item.file_size_mb != null) return `${item.file_size_mb} م.ب`
  if (item.file_size != null) return `${(item.file_size / (1024 * 1024)).toFixed(2)} م.ب`
  return '—'
}

export default function TeacherPageMediaPage() {
  const { teachers, fetchTeachers } = useAdminStore()
  const [items, setItems] = useState<TeacherPageMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterTeacherId, setFilterTeacherId] = useState('')
  const [filterType, setFilterType] = useState<'' | TeacherPageMediaType>('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(12)
  const [pagination, setPagination] = useState<{
    total: number
    per_page: number
    current_page: number
    total_pages: number
  } | null>(null)
  const [viewedItem, setViewedItem] = useState<TeacherPageMedia | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchTeachers(1, 1000)
  }, [fetchTeachers])

  const loadMedia = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listTeacherPageMedia({
        teacher_id: filterTeacherId ? parseInt(filterTeacherId, 10) : undefined,
        type: filterType || undefined,
        page,
        per_page: perPage,
      })
      setItems(data.teacher_page_media ?? [])
      setPagination(data.pagination ?? null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تحميل المحتوى')
      setItems([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [filterTeacherId, filterType, page, perPage])

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  useEffect(() => {
    setPage(1)
  }, [filterTeacherId, filterType])

  const handleDelete = async (item: TeacherPageMedia) => {
    const label = item.title?.trim() || item.type_label || TEACHER_PAGE_MEDIA_TYPE_LABELS[item.type]
    if (!confirm(`هل أنت متأكد من حذف «${label}»؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return
    }
    setDeletingId(item.id)
    try {
      await deleteTeacherPageMedia(item.id)
      if (viewedItem?.id === item.id) setViewedItem(null)
      await loadMedia()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'فشل الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  const typeBadge = (item: TeacherPageMedia) => {
    const isVideo = item.type === 'video'
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold shrink-0 ${
          isVideo ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}
      >
        {isVideo ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
        {item.type_label ?? TEACHER_PAGE_MEDIA_TYPE_LABELS[item.type]}
      </span>
    )
  }

  const mediaPreview = (item: TeacherPageMedia, className = '') => {
    if (item.type === 'video') {
      return (
        <div
          className={`relative bg-primary-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}
        >
          <video
            src={item.file_url}
            className="w-full h-full object-contain max-h-48"
            controls
            preload="metadata"
          />
        </div>
      )
    }
    return (
      <img
        src={item.file_url}
        alt={item.title || 'صورة'}
        className={`w-full h-full object-cover rounded-lg ${className}`}
      />
    )
  }

  return (
    <div className="px-2 sm:px-0" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 flex items-center gap-2">
          <ImageIcon className="w-8 h-8 sm:w-9 sm:h-9 text-primary-600" />
          محتوي المعلمين
        </h1>
        <button
          type="button"
          onClick={loadMedia}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border-2 border-primary-200 rounded-lg hover:bg-primary-50 text-primary-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      <p className="text-sm text-primary-600 mb-4 max-w-3xl">
        عرض وإدارة الصور والفيديوهات التي يظهرون في صفحة المعلم. يمكنك الفلترة حسب المعلم أو النوع وحذف أي
        ملف.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border-2 border-primary-200 p-4 sm:p-6 mb-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-primary-900">فلترة</h3>
          </div>
          {pagination && (
            <p className="text-sm text-primary-600">
              إجمالي {pagination.total} عنصر
              {pagination.total_pages > 1 &&
                ` — صفحة ${pagination.current_page} من ${pagination.total_pages}`}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm text-primary-600 mb-1">المعلم</label>
            <select
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg text-right"
              dir="rtl"
            >
              <option value="">جميع المعلمين</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-primary-600 mb-1">النوع</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as '' | TeacherPageMediaType)}
              className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg text-right"
              dir="rtl"
            >
              <option value="">الكل</option>
              <option value="image">{TEACHER_PAGE_MEDIA_TYPE_LABELS.image}</option>
              <option value="video">{TEACHER_PAGE_MEDIA_TYPE_LABELS.video}</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-primary-200 text-primary-600">
          لا يوجد محتوى
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border-2 border-primary-200 overflow-hidden shadow-lg flex flex-col"
              >
                <div className="aspect-video bg-primary-100 relative">
                  {item.type === 'image' ? (
                    <img
                      src={item.file_url}
                      alt={item.title || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-900/90">
                      <Video className="w-12 h-12 text-white/80" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="font-bold text-primary-900 truncate flex-1">
                      {item.title?.trim() || '—'}
                    </h2>
                    {typeBadge(item)}
                  </div>
                  <p className="text-sm text-primary-600 mb-1">
                    {item.teacher?.name ?? `معلم #${item.teacher_id}`}
                  </p>
                  <p className="text-xs text-primary-500 mb-3">
                    {formatFileSize(item)} · {formatCreatedAt(item.created_at)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-primary-100">
                    <button
                      type="button"
                      onClick={() => setViewedItem(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="عرض"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                      title="فتح الرابط"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-4 py-2 border-2 border-primary-200 rounded-lg hover:bg-primary-50 disabled:opacity-40"
              >
                <ChevronRight className="w-5 h-5" />
                السابق
              </button>
              <span className="text-sm text-primary-700 tabular-nums">
                {pagination.current_page} / {pagination.total_pages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.total_pages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 px-4 py-2 border-2 border-primary-200 rounded-lg hover:bg-primary-50 disabled:opacity-40"
              >
                التالي
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {viewedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setViewedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-xl font-bold text-primary-900 truncate">
                  {viewedItem.title?.trim() || 'تفاصيل المحتوى'}
                </h2>
                <button
                  type="button"
                  onClick={() => setViewedItem(null)}
                  className="p-2 hover:bg-primary-50 rounded-lg shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">{mediaPreview(viewedItem, 'min-h-[200px]')}</div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <dt className="text-primary-600 text-xs mb-0.5">المعلم</dt>
                  <dd className="font-semibold text-primary-900">
                    {viewedItem.teacher?.name ?? `#${viewedItem.teacher_id}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-primary-600 text-xs mb-0.5">النوع</dt>
                  <dd>{typeBadge(viewedItem)}</dd>
                </div>
                <div>
                  <dt className="text-primary-600 text-xs mb-0.5">الحجم</dt>
                  <dd className="text-primary-900">{formatFileSize(viewedItem)}</dd>
                </div>
                <div>
                  <dt className="text-primary-600 text-xs mb-0.5">تاريخ الإضافة</dt>
                  <dd className="text-primary-900">{formatCreatedAt(viewedItem.created_at)}</dd>
                </div>
                {viewedItem.mime_type && (
                  <div className="sm:col-span-2">
                    <dt className="text-primary-600 text-xs mb-0.5">نوع الملف</dt>
                    <dd className="text-primary-900 font-mono text-xs" dir="ltr">
                      {viewedItem.mime_type}
                    </dd>
                  </div>
                )}
                {viewedItem.file_path && (
                  <div className="sm:col-span-2">
                    <dt className="text-primary-600 text-xs mb-0.5">المسار</dt>
                    <dd className="text-primary-700 font-mono text-xs break-all" dir="ltr">
                      {viewedItem.file_path}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-primary-100">
                <a
                  href={viewedItem.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary-200 rounded-lg hover:bg-primary-50 text-primary-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  فتح الملف
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(viewedItem)}
                  disabled={deletingId === viewedItem.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
