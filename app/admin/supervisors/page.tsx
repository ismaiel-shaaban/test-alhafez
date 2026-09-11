'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Filter,
  RefreshCw,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  getSupervisors,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor,
  Supervisor,
  CreateSupervisorRequest,
  UpdateSupervisorRequest,
} from '@/lib/api/supervisors'
import {
  listSupervisorSalaries,
  createSupervisorSalary,
  updateSupervisorSalary,
  deleteSupervisorSalary,
  type SupervisorSalary,
  type CreateSupervisorSalaryRequest,
} from '@/lib/api/supervisor-salaries'
import {
  listSupervisorRewardsDeductions,
  createSupervisorRewardDeduction,
  updateSupervisorRewardDeduction,
  deleteSupervisorRewardDeduction,
  type SupervisorRewardDeduction,
  type CreateSupervisorRewardDeductionRequest,
  type SupervisorRewardDeductionType,
} from '@/lib/api/supervisor-rewards-deductions'
import { Pagination } from '@/lib/api-client'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, Award } from 'lucide-react'

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('') // '', 'true', 'false'

  // Form state
  const [formData, setFormData] = useState<CreateSupervisorRequest>({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Combined salaries + rewards/deductions modal
  const [financeSupervisor, setFinanceSupervisor] = useState<Supervisor | null>(null)
  const [salariesList, setSalariesList] = useState<SupervisorSalary[]>([])
  const [salariesPagination, setSalariesPagination] = useState<Pagination | null>(null)
  const [salariesPage, setSalariesPage] = useState(1)
  const [loadingSalaries, setLoadingSalaries] = useState(false)
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [editingSalary, setEditingSalary] = useState<SupervisorSalary | null>(null)
  const [salaryForm, setSalaryForm] = useState<CreateSupervisorSalaryRequest>({
    month: '',
    amount: 0,
    is_paid: false,
    notes: '',
  })
  const [salaryFormFile, setSalaryFormFile] = useState<File | null>(null)

  // Rewards/deductions (مكافآت وخصومات)
  const [rewardsList, setRewardsList] = useState<SupervisorRewardDeduction[]>([])
  const [rewardsPagination, setRewardsPagination] = useState<Pagination | null>(null)
  const [rewardsPage, setRewardsPage] = useState(1)
  const [loadingRewards, setLoadingRewards] = useState(false)
  const [showRewardForm, setShowRewardForm] = useState(false)
  const [editingReward, setEditingReward] = useState<SupervisorRewardDeduction | null>(null)
  const [rewardForm, setRewardForm] = useState<CreateSupervisorRewardDeductionRequest>({
    type: 'reward',
    title: '',
    description: '',
    amount: 0,
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    notes: '',
  })

  // Load supervisors
  useEffect(() => {
    loadSupervisors()
  }, [currentPage, searchTerm, isActiveFilter])

  const loadSupervisors = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: currentPage,
        per_page: 15,
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      if (isActiveFilter !== '') {
        params.is_active = isActiveFilter === 'true'
      }

      const data = await getSupervisors(params)
      setSupervisors(data?.supervisors || [])
      setPagination(data?.pagination || null)
    } catch (error: any) {
      console.error('Error loading supervisors:', error)
      alert(error.message || 'حدث خطأ أثناء تحميل المشرفين')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (supervisor?: Supervisor) => {
    if (supervisor) {
      setEditingSupervisor(supervisor)
      setFormData({
        name: supervisor.name,
        username: supervisor.username,
        email: supervisor.email,
        phone: supervisor.phone,
        password: '', // Keep empty for security
        is_active: supervisor.is_active,
      })
    } else {
      setEditingSupervisor(null)
      setFormData({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        is_active: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSupervisor(null)
    setFormData({
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      is_active: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingSupervisor) {
        // Update - only send password if it's provided
        const updateData: UpdateSupervisorRequest = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          is_active: formData.is_active,
        }
        if (formData.password.trim()) {
          updateData.password = formData.password
        }
        await updateSupervisor(editingSupervisor.id, updateData)
      } else {
        // Create - password is required
        await createSupervisor(formData)
      }
      handleCloseModal()
      loadSupervisors()
    } catch (error: any) {
      console.error('Error saving supervisor:', error)
      alert(error.message || 'حدث خطأ أثناء حفظ المشرف')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشرف؟')) return
    setDeletingId(id)
    try {
      await deleteSupervisor(id)
      loadSupervisors()
    } catch (error: any) {
      console.error('Error deleting supervisor:', error)
      alert(error.message || 'حدث خطأ أثناء حذف المشرف')
    } finally {
      setDeletingId(null)
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setIsActiveFilter('')
    setCurrentPage(1)
  }

  const openFinanceModal = async (supervisor: Supervisor) => {
    setFinanceSupervisor(supervisor)
    setSalariesList([])
    setSalariesPagination(null)
    setSalariesPage(1)
    setShowSalaryForm(false)
    setEditingSalary(null)
    const now = new Date()
    setSalaryForm({
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      amount: 0,
      is_paid: false,
      notes: '',
    })
    setSalaryFormFile(null)
    setRewardsList([])
    setRewardsPagination(null)
    setRewardsPage(1)
    setShowRewardForm(false)
    setEditingReward(null)
    setRewardForm({
      type: 'reward',
      title: '',
      description: '',
      amount: 0,
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      notes: '',
    })
    loadSalaries(supervisor.id, 1)
    loadRewards(supervisor.id, 1)
  }

  const loadRewards = async (supervisorId: number, page: number = 1) => {
    setLoadingRewards(true)
    try {
      const res = await listSupervisorRewardsDeductions(supervisorId, { page, per_page: 10 })
      setRewardsList(res.rewards_deductions || [])
      setRewardsPagination(res.pagination || null)
      setRewardsPage(page)
    } catch (err: any) {
      alert(err.message || 'فشل تحميل المكافآت والخصومات')
    } finally {
      setLoadingRewards(false)
    }
  }

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!financeSupervisor) return
    if (!rewardForm.title || rewardForm.amount <= 0 || !rewardForm.month) {
      alert('يرجى إدخال العنوان والمبلغ والشهر')
      return
    }
    try {
      if (editingReward) {
        await updateSupervisorRewardDeduction(financeSupervisor.id, editingReward.id, rewardForm)
        alert('تم التحديث بنجاح')
      } else {
        await createSupervisorRewardDeduction(financeSupervisor.id, rewardForm)
        alert('تمت الإضافة بنجاح')
      }
      setShowRewardForm(false)
      setEditingReward(null)
      loadRewards(financeSupervisor.id, rewardsPage)
    } catch (err: any) {
      alert(err.message || 'فشل الحفظ')
    }
  }

  const handleDeleteReward = async (id: number) => {
    if (!financeSupervisor || !confirm('هل أنت متأكد من الحذف؟')) return
    try {
      await deleteSupervisorRewardDeduction(financeSupervisor.id, id)
      loadRewards(financeSupervisor.id, rewardsPage)
    } catch (err: any) {
      alert(err.message || 'فشل الحذف')
    }
  }

  const openEditReward = (r: SupervisorRewardDeduction) => {
    setEditingReward(r)
    setRewardForm({
      type: r.type as SupervisorRewardDeductionType,
      title: r.title,
      description: r.description || '',
      amount: r.amount,
      month: r.month,
      notes: r.notes || '',
    })
    setShowRewardForm(true)
  }

  const loadSalaries = async (supervisorId: number, page: number = 1) => {
    setLoadingSalaries(true)
    try {
      const res = await listSupervisorSalaries(supervisorId, { page, per_page: 10 })
      setSalariesList(res.salaries || [])
      setSalariesPagination(res.pagination || null)
      setSalariesPage(page)
    } catch (err: any) {
      alert(err.message || 'فشل تحميل الرواتب')
    } finally {
      setLoadingSalaries(false)
    }
  }

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!financeSupervisor) return
    if (!salaryForm.month || salaryForm.amount <= 0) {
      alert('يرجى إدخال الشهر والمبلغ')
      return
    }
    try {
      if (editingSalary) {
        await updateSupervisorSalary(financeSupervisor.id, editingSalary.id, {
          ...salaryForm,
          payment_proof_image: salaryFormFile || undefined,
        })
        alert('تم تحديث الراتب بنجاح')
      } else {
        await createSupervisorSalary(financeSupervisor.id, {
          ...salaryForm,
          payment_proof_image: salaryFormFile || undefined,
        })
        alert('تم إضافة الراتب بنجاح')
      }
      setShowSalaryForm(false)
      setEditingSalary(null)
      loadSalaries(financeSupervisor.id, salariesPage)
    } catch (err: any) {
      alert(err.message || 'فشل الحفظ')
    }
  }

  const handleDeleteSalary = async (salaryId: number) => {
    if (!financeSupervisor || !confirm('هل أنت متأكد من حذف هذا الراتب؟')) return
    try {
      await deleteSupervisorSalary(financeSupervisor.id, salaryId)
      loadSalaries(financeSupervisor.id, salariesPage)
    } catch (err: any) {
      alert(err.message || 'فشل الحذف')
    }
  }

  const openEditSalary = (s: SupervisorSalary) => {
    setEditingSalary(s)
    setSalaryForm({
      month: s.month,
      amount: s.amount,
      is_paid: s.is_paid,
      notes: s.notes || '',
    })
    setSalaryFormFile(null)
    setShowSalaryForm(true)
  }

  return (
    <div className="px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 mb-6 sm:mb-8">المشرفين</h1>

      {/* Filters and Add Button */}
      <div className="bg-white rounded-xl border-2 border-primary-200 shadow-lg mb-6">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold text-primary-900">الفلترة</span>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>إضافة مشرف</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-3">
              <div className="relative min-w-0 flex-1 sm:flex-none sm:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-primary-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="ابحث عن مشرف..."
                  className="w-full pr-10 pl-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                  dir="rtl"
                />
              </div>
              <select
                value={isActiveFilter}
                onChange={(e) => {
                  setIsActiveFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-auto px-3 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                dir="rtl"
              >
                <option value="">جميع الحالات</option>
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </select>
              <button
                onClick={resetFilters}
                className="w-full sm:w-auto px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تعيين</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supervisors List */}
      <div className="bg-white rounded-xl border-2 border-primary-200 overflow-hidden shadow-lg">
        {loading ? (
          <div className="text-center py-12 text-primary-600">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm sm:text-base">جاري التحميل...</p>
          </div>
        ) : supervisors.length === 0 ? (
          <div className="text-center py-12 text-primary-600">
            <User className="w-16 h-16 mx-auto mb-4 text-primary-300" />
            <p className="text-base sm:text-lg">لا يوجد مشرفين</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-primary-200">
              {supervisors.map((supervisor) => (
                <motion.div
                  key={supervisor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 hover:bg-primary-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-primary-900">{supervisor.name}</h3>
                      <p className="text-sm text-primary-600">{supervisor.username}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        supervisor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {supervisor.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {supervisor.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm text-primary-700 mb-4">
                    {supervisor.email && (
                      <div className="flex justify-between gap-2">
                        <span className="text-primary-600">البريد:</span>
                        <span className="break-all text-left">{supervisor.email}</span>
                      </div>
                    )}
                    {supervisor.phone && (
                      <div className="flex justify-between gap-2">
                        <span className="text-primary-600">الهاتف:</span>
                        <span dir="ltr">{supervisor.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openFinanceModal(supervisor)}
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      title="رواتب ومكافآت وخصومات"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(supervisor)}
                      className="p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supervisor.id)}
                      disabled={deletingId === supervisor.id}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                      title="حذف"
                    >
                      {deletingId === supervisor.id ? (
                        <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-primary-200">
                <thead className="bg-primary-100">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-primary-900">الاسم</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-primary-900">اسم المستخدم</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-primary-900">البريد الإلكتروني</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-primary-900">الهاتف</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-primary-900">الحالة</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-primary-900">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-primary-200">
                  {supervisors.map((supervisor) => (
                    <motion.tr
                      key={supervisor.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-primary-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-primary-900 break-words font-medium">
                        {supervisor.name}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-primary-700 break-words">
                        {supervisor.username}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-primary-700 break-words">
                        {supervisor.email}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-primary-700 break-words">
                        {supervisor.phone}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            supervisor.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {supervisor.is_active ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {supervisor.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openFinanceModal(supervisor)}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            title="رواتب ومكافآت وخصومات"
                          >
                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(supervisor)}
                            className="p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(supervisor.id)}
                            disabled={deletingId === supervisor.id}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="حذف"
                          >
                            {deletingId === supervisor.id ? (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="p-4 sm:p-6 border-t border-primary-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm sm:text-base text-primary-600 text-center sm:text-right order-2 sm:order-1">
                  صفحة {pagination.current_page} من {pagination.total_pages} ({pagination.total} مشرف)
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.current_page === 1}
                    className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination!.total_pages, p + 1))}
                    disabled={pagination.current_page === pagination.total_pages}
                    className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 sm:p-6 border-b border-primary-200 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900">
                  {editingSupervisor ? 'تعديل مشرف' : 'إضافة مشرف'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <X className="w-5 h-5 text-primary-700" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-primary-900 mb-2">الاسم *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-primary-900 mb-2">اسم المستخدم *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-primary-900 mb-2">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-primary-900 mb-2">الهاتف *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold text-primary-900 mb-2">
                    كلمة المرور {editingSupervisor ? '(اتركها فارغة للاحتفاظ بالكلمة الحالية)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingSupervisor}
                    minLength={6}
                    className="w-full px-4 py-2 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-primary-600 border-2 border-primary-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm sm:text-base font-semibold text-primary-900">نشط</span>
                  </label>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-semibold"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : editingSupervisor ? 'تحديث' : 'إضافة'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-3 sm:py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm sm:text-base font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finance Modal: Salaries + Rewards/Deductions */}
      {financeSupervisor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setFinanceSupervisor(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-primary-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary-900">رواتب ومكافآت وخصومات: {financeSupervisor.name}</h2>
              <button type="button" onClick={() => setFinanceSupervisor(null)} className="p-2 hover:bg-primary-100 rounded-lg">✕</button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-6">
              {/* Section 1: Salaries */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-primary-900 mb-3">
                  <DollarSign className="w-5 h-5" />
                  الرواتب
                </h3>
                {!showSalaryForm ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSalary(null)
                        const now = new Date()
                        setSalaryForm({ month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, amount: 0, is_paid: false, notes: '' })
                        setSalaryFormFile(null)
                        setShowSalaryForm(true)
                      }}
                      className="mb-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                    >
                      إضافة راتب
                    </button>
                    {loadingSalaries ? (
                      <div className="text-center py-4 text-primary-600">جاري التحميل...</div>
                    ) : salariesList.length === 0 ? (
                      <p className="text-primary-600 py-2 text-sm">لا توجد رواتب مسجلة.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-primary-200">
                        <table className="w-full">
                          <thead className="bg-primary-100">
                            <tr>
                              <th className="p-2 text-right text-primary-900 font-semibold text-sm">الشهر</th>
                              <th className="p-2 text-right text-primary-900 font-semibold text-sm">المبلغ</th>
                              <th className="p-2 text-right text-primary-900 font-semibold text-sm">السداد</th>
                              <th className="p-2 text-center text-primary-900 font-semibold text-sm">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salariesList.map((s) => (
                              <tr key={s.id} className="border-t border-primary-200">
                                <td className="p-2 text-primary-900 text-sm">{s.month}</td>
                                <td className="p-2 font-semibold text-sm">{s.amount.toFixed(2)} ج</td>
                                <td className="p-2">{s.is_paid ? <CheckCircle className="w-4 h-4 text-green-600 inline" /> : <XCircle className="w-4 h-4 text-red-500 inline" />}</td>
                                <td className="p-2">
                                  <div className="flex justify-center gap-1">
                                    <button type="button" onClick={() => openEditSalary(s)} className="p-1.5 bg-primary-100 rounded text-xs">تعديل</button>
                                    <button type="button" onClick={() => handleDeleteSalary(s.id)} className="p-1.5 bg-red-100 text-red-700 rounded text-xs">حذف</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {salariesPagination && salariesPagination.total_pages > 1 && (
                      <div className="flex justify-center gap-2 mt-2">
                        <button type="button" disabled={salariesPage <= 1} onClick={() => loadSalaries(financeSupervisor.id, salariesPage - 1)} className="px-3 py-1.5 border rounded text-sm disabled:opacity-50">السابق</button>
                        <span className="py-1.5 text-primary-700 text-sm">ص {salariesPage} من {salariesPagination.total_pages}</span>
                        <button type="button" disabled={salariesPage >= salariesPagination.total_pages} onClick={() => loadSalaries(financeSupervisor.id, salariesPage + 1)} className="px-3 py-1.5 border rounded text-sm disabled:opacity-50">التالي</button>
                      </div>
                    )}
                  </>
                ) : (
                  <form onSubmit={handleSaveSalary} className="space-y-3 p-3 bg-primary-50 rounded-lg">
                    <h4 className="font-semibold text-primary-900 text-sm">{editingSalary ? 'تعديل راتب' : 'إضافة راتب'}</h4>
                    <div>
                      <label className="block text-xs font-medium text-primary-700 mb-1">الشهر *</label>
                      <input type="month" value={salaryForm.month} onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })} className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary-700 mb-1">المبلغ *</label>
                      <input type="number" step="0.01" min="0.01" value={salaryForm.amount || ''} onChange={(e) => setSalaryForm({ ...salaryForm, amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg text-sm" required />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={salaryForm.is_paid} onChange={(e) => setSalaryForm({ ...salaryForm, is_paid: e.target.checked })} />
                        <span className="text-primary-700">تم السداد</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary-700 mb-1">صورة إثبات الدفع (اختياري)</label>
                      <input type="file" accept="image/*" onChange={(e) => setSalaryFormFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary-700 mb-1">ملاحظات</label>
                      <input type="text" value={salaryForm.notes || ''} onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })} className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowSalaryForm(false)} className="flex-1 py-2 border-2 border-primary-300 rounded-lg text-primary-700 text-sm font-medium">إلغاء</button>
                      <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">حفظ</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Section 2: Rewards and Deductions */}
              <div className="border-t border-primary-200 pt-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-primary-900 mb-3">
                  <Award className="w-5 h-5" />
                  المكافآت والخصومات
                </h3>
                {!showRewardForm ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReward(null)
                        const now = new Date()
                        setRewardForm({
                          type: 'reward',
                          title: '',
                          description: '',
                          amount: 0,
                          month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
                          notes: '',
                        })
                        setShowRewardForm(true)
                      }}
                      className="mb-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      إضافة مكافأة/خصم
                    </button>
                    {loadingRewards ? (
                      <div className="text-center py-4 text-primary-600">جاري التحميل...</div>
                    ) : rewardsList.length === 0 ? (
                      <p className="text-primary-600 py-2 text-sm">لا توجد مكافآت أو خصومات.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-primary-200">
                        <table className="w-full">
                          <thead className="bg-primary-100">
                            <tr>
                              <th className="p-2 text-right text-primary-900 font-semibold text-sm">النوع</th>
                              <th className="p-2 text-right text-primary-900 font-semibold text-sm">العنوان</th>
                              <th className="p-2 text-right text-primary-900 font-semibold text-sm">الشهر</th>
                              <th className="p-2 text-right text-primary-900 font-semibold text-sm">المبلغ</th>
                              <th className="p-2 text-center text-primary-900 font-semibold text-sm">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rewardsList.map((r) => (
                              <tr key={r.id} className="border-t border-primary-200">
                                <td className="p-2 text-sm">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.type === 'reward' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {r.type_label}
                                  </span>
                                </td>
                                <td className="p-2 text-primary-900 text-sm">{r.title}</td>
                                <td className="p-2 text-primary-700 text-sm">{r.month}</td>
                                <td className={`p-2 font-semibold text-sm ${r.type === 'reward' ? 'text-green-700' : 'text-red-700'}`}>
                                  {r.type === 'reward' ? '+' : '-'}{r.amount.toFixed(2)} ج
                                </td>
                                <td className="p-2">
                                  <div className="flex justify-center gap-1">
                                    <button type="button" onClick={() => openEditReward(r)} className="p-1.5 bg-primary-100 rounded text-xs">تعديل</button>
                                    <button type="button" onClick={() => handleDeleteReward(r.id)} className="p-1.5 bg-red-100 text-red-700 rounded text-xs">حذف</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {rewardsPagination && rewardsPagination.total_pages > 1 && (
                      <div className="flex justify-center gap-2 mt-2">
                        <button type="button" disabled={rewardsPage <= 1} onClick={() => loadRewards(financeSupervisor.id, rewardsPage - 1)} className="px-3 py-1.5 border rounded text-sm disabled:opacity-50">السابق</button>
                        <span className="py-1.5 text-primary-700 text-sm">ص {rewardsPage} من {rewardsPagination.total_pages}</span>
                        <button type="button" disabled={rewardsPage >= rewardsPagination.total_pages} onClick={() => loadRewards(financeSupervisor.id, rewardsPage + 1)} className="px-3 py-1.5 border rounded text-sm disabled:opacity-50">التالي</button>
                      </div>
                    )}
                  </>
                ) : (
                  <form onSubmit={handleSaveReward} className="space-y-3 p-3 bg-primary-50 rounded-lg">
                    <h4 className="font-semibold text-primary-900 text-sm">{editingReward ? 'تعديل مكافأة/خصم' : 'إضافة مكافأة/خصم'}</h4>
                    <div>
                      <label className="block text-xs font-medium text-primary-700 mb-1">النوع *</label>
                      <select value={rewardForm.type} onChange={(e) => setRewardForm({ ...rewardForm, type: e.target.value as SupervisorRewardDeductionType })} className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg text-sm" required>
                        <option value="reward">مكافأة</option>
                        <option value="deduction">خصم</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary-700 mb-1">العنوان *</label>
                      <input type="text" value={rewardForm.title} onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })} className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary-700 mb-1">الوصف (اختياري)</label>
                      <input type="text" value={rewardForm.description || ''} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-primary-700 mb-1">الشهر *</label>
                        <input type="month" value={rewardForm.month} onChange={(e) => setRewardForm({ ...rewardForm, month: e.target.value })} className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg text-sm" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-primary-700 mb-1">المبلغ *</label>
                        <input type="number" step="0.01" min="0.01" value={rewardForm.amount || ''} onChange={(e) => setRewardForm({ ...rewardForm, amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg text-sm" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary-700 mb-1">ملاحظات</label>
                      <input type="text" value={rewardForm.notes || ''} onChange={(e) => setRewardForm({ ...rewardForm, notes: e.target.value })} className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowRewardForm(false)} className="flex-1 py-2 border-2 border-primary-300 rounded-lg text-primary-700 text-sm font-medium">إلغاء</button>
                      <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">حفظ</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
