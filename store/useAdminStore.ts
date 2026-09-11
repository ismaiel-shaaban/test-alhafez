import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as authAPI from '@/lib/api/auth'
import * as studentsAPI from '@/lib/api/students'
import * as teachersAPI from '@/lib/api/teachers'
import * as packagesAPI from '@/lib/api/packages'
import * as reviewsAPI from '@/lib/api/reviews'
import * as honorBoardsAPI from '@/lib/api/honor-boards'
import * as sessionsAPI from '@/lib/api/sessions'
import * as teacherSalaryAPI from '@/lib/api/teacher-salary'
import * as featuresAPI from '@/lib/api/features'
import * as lessonsAPI from '@/lib/api/lessons'
import { getCurrentLocale } from '@/lib/api-client'
import { canDeleteStudents } from '@/lib/admin-access'

// Re-export API types for convenience
export type Teacher = teachersAPI.Teacher
export type Package = packagesAPI.Package
export type Review = reviewsAPI.Review
export type HonorBoardEntry = honorBoardsAPI.HonorBoardEntry
export type Student = studentsAPI.Student
export type StudentSession = sessionsAPI.StudentSession
export type Feature = featuresAPI.Feature
export type Lesson = lessonsAPI.Lesson
export type TeacherSalaryResponse = teacherSalaryAPI.TeacherSalaryResponse
export type TeacherPayment = teacherSalaryAPI.TeacherPayment

export interface AdminUser {
  isAuthenticated: boolean
  username: string
  userType?: string
  user?: authAPI.User
}

interface AdminState {
  // Authentication
  admin: AdminUser
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>

  // Students
  students: studentsAPI.Student[]
  studentsMeta: {
    current_page: number
    total: number
    last_page: number
  } | null
  isLoadingStudents: boolean
  fetchStudents: (filters?: studentsAPI.StudentFilters) => Promise<void>
  getStudent: (id: number) => Promise<studentsAPI.Student>
  addStudent: (student: studentsAPI.CreateStudentRequest) => Promise<void>
  updateStudent: (id: number, student: Partial<studentsAPI.CreateStudentRequest>) => Promise<void>
  deleteStudent: (id: number) => Promise<void>
  forceDeleteStudent: (id: number) => Promise<void>
  updateSubscriptionPaymentStatus: (subscriptionId: number, isPaid: boolean) => Promise<void>

  // Student Sessions
  sessions: StudentSession[]
  sessionsMeta: {
    current_page: number
    total: number
    last_page: number
  } | null
  isLoadingSessions: boolean
  fetchSessions: (filters?: sessionsAPI.SessionFilters) => Promise<void>
  getSession: (id: number) => Promise<StudentSession>
  addSession: (session: sessionsAPI.CreateSessionRequest) => Promise<void>
  updateSession: (id: number, session: Partial<sessionsAPI.CreateSessionRequest & { is_completed?: boolean }>) => Promise<void>
  completeSession: (id: number, notes?: string) => Promise<void>
  revertSessionToPending: (id: number) => Promise<void>
  deleteSession: (id: number) => Promise<void>

  // Teachers
  teachers: Teacher[]
  teachersMeta: {
    current_page: number
    total: number
    last_page: number
  } | null
  isLoadingTeachers: boolean
  fetchTeachers: (page?: number, perPage?: number, search?: string, supervisorId?: number, withoutSupervisor?: boolean, month?: string, salaryStatus?: teachersAPI.TeacherSalaryStatusFilter, paymentMethodType?: teachersAPI.TeacherPaymentMethodTypeFilter) => Promise<void>
  getTeacher: (id: number) => Promise<Teacher>
  addTeacher: (teacher: teachersAPI.CreateTeacherRequest) => Promise<void>
  updateTeacher: (id: number, teacher: Partial<teachersAPI.CreateTeacherRequest>) => Promise<void>
  deleteTeacher: (id: number) => Promise<void>

  // Packages
  packages: Package[]
  packagesMeta: {
    current_page: number
    total: number
    last_page: number
  } | null
  isLoadingPackages: boolean
  fetchPackages: (isPopular?: boolean, page?: number) => Promise<void>
  getPackage: (id: number) => Promise<Package>
  addPackage: (pkg: packagesAPI.CreatePackageRequest) => Promise<void>
  updatePackage: (id: number, pkg: Partial<packagesAPI.CreatePackageRequest>) => Promise<void>
  deletePackage: (id: number) => Promise<void>

  // Reviews (Testimonials)
  reviews: Review[]
  reviewsMeta: {
    current_page: number
    total: number
    last_page: number
  } | null
  isLoadingReviews: boolean
  fetchReviews: (filters?: reviewsAPI.ReviewFilters) => Promise<void>
  getReview: (id: number) => Promise<Review>
  addReview: (review: reviewsAPI.CreateReviewRequest) => Promise<void>
  updateReview: (id: number, review: Partial<reviewsAPI.CreateReviewRequest>) => Promise<void>
  deleteReview: (id: number) => Promise<void>

  // Honor Board
  honorBoard: HonorBoardEntry[]
  honorBoardMeta: {
    current_page: number
    total: number
    last_page: number
  } | null
  isLoadingHonorBoard: boolean
  fetchHonorBoard: (studentId?: number, page?: number) => Promise<void>
  getHonorEntry: (id: number) => Promise<HonorBoardEntry>
  addHonorEntry: (entry: honorBoardsAPI.CreateHonorBoardRequest) => Promise<void>
  updateHonorEntry: (id: number, entry: Partial<honorBoardsAPI.CreateHonorBoardRequest>) => Promise<void>
  deleteHonorEntry: (id: number) => Promise<void>

  // Features
  features: featuresAPI.Feature[]
  featuresMeta: {
    current_page: number
    total: number
    last_page: number
  } | null
  isLoadingFeatures: boolean
  fetchFeatures: (filters?: featuresAPI.FeatureFilters) => Promise<void>
  getFeature: (id: number) => Promise<featuresAPI.Feature>
  addFeature: (feature: featuresAPI.CreateFeatureRequest) => Promise<void>
  updateFeature: (id: number, feature: Partial<featuresAPI.CreateFeatureRequest>) => Promise<void>
  deleteFeature: (id: number) => Promise<void>

  // Lessons
  lessons: lessonsAPI.Lesson[]
  lessonsMeta: {
    current_page: number
    total: number
    last_page: number
  } | null
  isLoadingLessons: boolean
  fetchLessons: (filters?: lessonsAPI.LessonFilters) => Promise<void>
  getLesson: (id: number) => Promise<lessonsAPI.Lesson>
  addLesson: (lesson: lessonsAPI.CreateLessonRequest) => Promise<void>
  updateLesson: (id: number, lesson: Partial<lessonsAPI.CreateLessonRequest>) => Promise<void>
  deleteLesson: (id: number) => Promise<void>

  // Teacher Salary & Payments
  getTeacherSalary: (teacherId: number, month: string) => Promise<teacherSalaryAPI.TeacherSalaryResponse>
  markPaymentAsPaid: (teacherId: number, data: teacherSalaryAPI.MarkPaymentRequest) => Promise<void>
  getTeacherPayments: (teacherId: number, page?: number) => Promise<{ payments: teacherSalaryAPI.TeacherPayment[]; pagination: any }>
  getTeacherPaymentMethods: (teacherId: number) => Promise<teacherSalaryAPI.TeacherPaymentMethod[]>
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Authentication
      admin: {
        isAuthenticated: false,
        username: '',
      },
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authAPI.login({ username, password })
          set({
            admin: {
              isAuthenticated: true,
              username: response.user.username,
              userType: response.type,
              user: response.user,
            },
            isLoading: false,
            error: null,
          })
          return true
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تسجيل الدخول',
            admin: {
              isAuthenticated: false,
              username: '',
            },
          })
          return false
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await authAPI.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            admin: {
              isAuthenticated: false,
              username: '',
              user: undefined,
            },
            isLoading: false,
          })
        }
      },

      checkAuth: async () => {
        try {
          const currentState = get()
          const user = await authAPI.getCurrentUser()
          set({
            admin: {
              isAuthenticated: true,
              username: user.username,
              userType:
                currentState.admin.userType ??
                (user.supervisor?.id != null ? 'supervisor' : 'admin'),
              user,
            },
          })
        } catch (error) {
        set({
          admin: {
            isAuthenticated: false,
            username: '',
            userType: undefined,
              user: undefined,
          },
        })
        }
      },

      // Students
      students: [],
      studentsMeta: null,
      isLoadingStudents: false,
      fetchStudents: async (filters = {}) => {
        set({ isLoadingStudents: true, error: null })
        try {
          const locale = getCurrentLocale()
          const response = await studentsAPI.listStudents(filters, locale)
          set({
            students: response.students || [],
            studentsMeta: response.pagination ? {
              current_page: response.pagination.current_page || 1,
              total: response.pagination.total || 0,
              last_page: response.pagination.total_pages || 1,
            } : null,
            isLoadingStudents: false,
          })
        } catch (error: any) {
          set({
            isLoadingStudents: false,
            error: error.message || 'فشل تحميل الطلاب',
          })
        }
      },
      addStudent: async (student) => {
        set({ isLoading: true, error: null })
        try {
          await studentsAPI.createStudent(student)
          await get().fetchStudents()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل إضافة الطالب',
          })
          throw error
        }
      },
      updateStudent: async (id, student) => {
        set({ isLoading: true, error: null })
        try {
          await studentsAPI.updateStudent(id, student)
          await get().fetchStudents()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحديث الطالب',
          })
          throw error
        }
      },
      deleteStudent: async (id) => {
        const { admin } = get()
        if (!canDeleteStudents(admin.username, admin.userType, admin.user)) {
          const message = 'ليس لديك صلاحية حذف الطلاب'
          set({ error: message })
          throw new Error(message)
        }
        set({ isLoading: true, error: null })
        try {
          await studentsAPI.deleteStudent(id)
          await get().fetchStudents()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل حذف الطالب',
          })
          throw error
        }
      },
      forceDeleteStudent: async (id) => {
        const { admin } = get()
        if (!canDeleteStudents(admin.username, admin.userType, admin.user)) {
          const message = 'ليس لديك صلاحية حذف الطلاب'
          set({ error: message })
          throw new Error(message)
        }
        set({ isLoading: true, error: null })
        try {
          await studentsAPI.forceDeleteStudent(id)
          await get().fetchStudents()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل الحذف النهائي للطالب',
          })
          throw error
        }
      },
      updateSubscriptionPaymentStatus: async (subscriptionId, isPaid) => {
        set({ isLoading: true, error: null })
        try {
          await studentsAPI.updateSubscriptionPaymentStatus(subscriptionId, isPaid)
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحديث حالة الدفع',
          })
          throw error
        }
      },
      getStudent: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const locale = getCurrentLocale()
          const student = await studentsAPI.getStudent(id, locale)
          set({ isLoading: false })
          return student
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحميل بيانات الطالب',
          })
          throw error
        }
      },

      // Student Sessions
      sessions: [],
      sessionsMeta: null,
      isLoadingSessions: false,
      fetchSessions: async (filters = {}) => {
        set({ isLoadingSessions: true, error: null })
        try {
          const locale = getCurrentLocale()
          const response = await sessionsAPI.listSessions(filters, locale)
          set({
            sessions: response.sessions || [],
            sessionsMeta: response.pagination ? {
              current_page: response.pagination.current_page || 1,
              total: response.pagination.total || 0,
              last_page: response.pagination.total_pages || 1,
            } : null,
            isLoadingSessions: false,
          })
        } catch (error: any) {
          set({
            isLoadingSessions: false,
            error: error.message || 'فشل تحميل الحصص',
          })
        }
      },
      getSession: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const session = await sessionsAPI.getSession(id)
          set({ isLoading: false })
          return session
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحميل بيانات الحصة',
          })
          throw error
        }
      },
      addSession: async (session) => {
        set({ isLoading: true, error: null })
        try {
          await sessionsAPI.createSession(session)
          await get().fetchSessions()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل إضافة الحصة',
          })
          throw error
        }
      },
      updateSession: async (id, session) => {
        set({ isLoading: true, error: null })
        try {
          await sessionsAPI.updateSession(id, session)
          await get().fetchSessions()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحديث الحصة',
          })
          throw error
        }
      },
      completeSession: async (id, notes) => {
        set({ isLoading: true, error: null })
        try {
          await sessionsAPI.completeSession(id, notes)
          await get().fetchSessions()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تسجيل إتمام الحصة',
          })
          throw error
        }
      },
      revertSessionToPending: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await sessionsAPI.revertSessionToPending(id)
          await get().fetchSessions()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل إرجاع الحصة قيد الانتظار',
          })
          throw error
        }
      },
      deleteSession: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await sessionsAPI.deleteSession(id)
          await get().fetchSessions()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل حذف الحصة',
          })
          throw error
        }
      },

      // Teachers
      teachers: [],
      teachersMeta: null,
      isLoadingTeachers: false,
      fetchTeachers: async (page = 1, perPage = 15, search?: string, supervisorId?: number, withoutSupervisor?: boolean, month?: string, salaryStatus?: teachersAPI.TeacherSalaryStatusFilter, paymentMethodType?: teachersAPI.TeacherPaymentMethodTypeFilter) => {
        set({ isLoadingTeachers: true, error: null })
        try {
          const locale = getCurrentLocale()
          const response = await teachersAPI.listTeachers(page, perPage, search, supervisorId, withoutSupervisor, locale, month, salaryStatus, paymentMethodType)
          set({
            teachers: response.teachers || [],
            teachersMeta: response.pagination ? {
              current_page: response.pagination.current_page || 1,
              total: response.pagination.total || 0,
              last_page: response.pagination.total_pages || 1,
            } : null,
            isLoadingTeachers: false,
          })
        } catch (error: any) {
          set({
            isLoadingTeachers: false,
            error: error.message || 'فشل تحميل المعلمين',
          })
        }
      },
      getTeacher: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const teacher = await teachersAPI.getTeacher(id)
          set({ isLoading: false })
          return teacher
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحميل بيانات المعلم',
          })
          throw error
        }
      },
      addTeacher: async (teacher) => {
        set({ isLoading: true, error: null })
        try {
          await teachersAPI.createTeacher(teacher)
          await get().fetchTeachers()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل إضافة المعلم',
          })
          throw error
        }
      },
      updateTeacher: async (id, teacher) => {
        set({ isLoading: true, error: null })
        try {
          await teachersAPI.updateTeacher(id, teacher)
          await get().fetchTeachers()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحديث المعلم',
          })
          throw error
        }
      },
      deleteTeacher: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await teachersAPI.deleteTeacher(id)
          await get().fetchTeachers()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل حذف المعلم',
          })
          throw error
        }
      },

      // Packages
      packages: [],
      packagesMeta: null,
      isLoadingPackages: false,
      fetchPackages: async (isPopular, page = 1) => {
        set({ isLoadingPackages: true, error: null })
        try {
          const locale = getCurrentLocale()
          const response = await packagesAPI.listPackages(isPopular, 15, page, locale)
          set({
            packages: response.packages || [],
            packagesMeta: response.pagination ? {
              current_page: response.pagination.current_page || 1,
              total: response.pagination.total || 0,
              last_page: response.pagination.total_pages || 1,
            } : null,
            isLoadingPackages: false,
          })
        } catch (error: any) {
          set({
            isLoadingPackages: false,
            error: error.message || 'فشل تحميل الباقات',
          })
        }
      },
      addPackage: async (pkg) => {
        set({ isLoading: true, error: null })
        try {
          await packagesAPI.createPackage(pkg)
          await get().fetchPackages()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل إضافة الباقة',
          })
          throw error
        }
      },
      updatePackage: async (id, pkg) => {
        set({ isLoading: true, error: null })
        try {
          await packagesAPI.updatePackage(id, pkg)
          await get().fetchPackages()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحديث الباقة',
          })
          throw error
        }
      },
      deletePackage: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await packagesAPI.deletePackage(id)
          await get().fetchPackages()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل حذف الباقة',
          })
          throw error
        }
      },
      getPackage: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const pkg = await packagesAPI.getPackage(id)
          set({ isLoading: false })
          return pkg
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحميل بيانات الباقة',
          })
          throw error
        }
      },

      // Reviews (Testimonials)
      reviews: [],
      reviewsMeta: null,
      isLoadingReviews: false,
      fetchReviews: async (filters = {}) => {
        set({ isLoadingReviews: true, error: null })
        try {
          const locale = getCurrentLocale()
          const response = await reviewsAPI.listReviews(filters, locale)
          set({
            reviews: response.reviews || [],
            reviewsMeta: response.pagination ? {
              current_page: response.pagination.current_page || 1,
              total: response.pagination.total || 0,
              last_page: response.pagination.total_pages || 1,
            } : null,
            isLoadingReviews: false,
          })
        } catch (error: any) {
          set({
            isLoadingReviews: false,
            error: error.message || 'فشل تحميل الآراء',
          })
        }
      },
      addReview: async (review) => {
        set({ isLoading: true, error: null })
        try {
          await reviewsAPI.createReview(review)
          await get().fetchReviews()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل إضافة الرأي',
          })
          throw error
        }
      },
      updateReview: async (id, review) => {
        set({ isLoading: true, error: null })
        try {
          await reviewsAPI.updateReview(id, review)
          await get().fetchReviews()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحديث الرأي',
          })
          throw error
        }
      },
      deleteReview: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await reviewsAPI.deleteReview(id)
          await get().fetchReviews()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل حذف الرأي',
          })
          throw error
        }
      },
      getReview: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const review = await reviewsAPI.getReview(id)
          set({ isLoading: false })
          return review
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحميل بيانات الرأي',
          })
          throw error
        }
      },

      // Honor Board
      honorBoard: [],
      honorBoardMeta: null,
      isLoadingHonorBoard: false,
      fetchHonorBoard: async (studentId, page = 1) => {
        set({ isLoadingHonorBoard: true, error: null })
        try {
          const locale = getCurrentLocale()
          const response = await honorBoardsAPI.listHonorBoards(studentId, 15, page, locale)
          set({
            honorBoard: response.honor_boards || [],
            honorBoardMeta: response.pagination ? {
              current_page: response.pagination.current_page || 1,
              total: response.pagination.total || 0,
              last_page: response.pagination.total_pages || 1,
            } : null,
            isLoadingHonorBoard: false,
          })
        } catch (error: any) {
          set({
            isLoadingHonorBoard: false,
            error: error.message || 'فشل تحميل لوحة الشرف',
          })
        }
      },
      addHonorEntry: async (entry) => {
        set({ isLoading: true, error: null })
        try {
          await honorBoardsAPI.createHonorBoard(entry)
          await get().fetchHonorBoard()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل إضافة إدخال',
          })
          throw error
        }
      },
      updateHonorEntry: async (id, entry) => {
        set({ isLoading: true, error: null })
        try {
          await honorBoardsAPI.updateHonorBoard(id, entry)
          await get().fetchHonorBoard()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحديث الإدخال',
          })
          throw error
        }
      },
      deleteHonorEntry: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await honorBoardsAPI.deleteHonorBoard(id)
          await get().fetchHonorBoard()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل حذف الإدخال',
          })
          throw error
        }
      },
      getHonorEntry: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const entry = await honorBoardsAPI.getHonorBoard(id)
          set({ isLoading: false })
          return entry
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحميل بيانات الإدخال',
          })
          throw error
        }
      },

      // Features
      features: [],
      featuresMeta: null,
      isLoadingFeatures: false,
      fetchFeatures: async (filters = {}) => {
        set({ isLoadingFeatures: true, error: null })
        try {
          const locale = getCurrentLocale()
          const response = await featuresAPI.listFeatures(filters, locale)
          set({
            features: response.features || [],
            featuresMeta: response.pagination ? {
              current_page: response.pagination.current_page || 1,
              total: response.pagination.total || 0,
              last_page: response.pagination.total_pages || 1,
            } : null,
            isLoadingFeatures: false,
          })
        } catch (error: any) {
          set({
            isLoadingFeatures: false,
            error: error.message || 'فشل تحميل المميزات',
          })
        }
      },
      getFeature: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const locale = getCurrentLocale()
          const feature = await featuresAPI.getFeature(id, locale)
          set({ isLoading: false })
          return feature
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحميل بيانات الميزة',
          })
          throw error
        }
      },
      addFeature: async (feature) => {
        set({ isLoading: true, error: null })
        try {
          await featuresAPI.createFeature(feature)
          await get().fetchFeatures()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل إضافة الميزة',
          })
          throw error
        }
      },
      updateFeature: async (id, feature) => {
        set({ isLoading: true, error: null })
        try {
          await featuresAPI.updateFeature(id, feature)
          await get().fetchFeatures()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحديث الميزة',
          })
          throw error
        }
      },
      deleteFeature: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await featuresAPI.deleteFeature(id)
          await get().fetchFeatures()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل حذف الميزة',
          })
          throw error
        }
      },

      // Lessons
      lessons: [],
      lessonsMeta: null,
      isLoadingLessons: false,
      fetchLessons: async (filters = {}) => {
        set({ isLoadingLessons: true, error: null })
        try {
          const locale = getCurrentLocale()
          const response = await lessonsAPI.listLessons(filters, locale)
          set({
            lessons: response.lessons || [],
            lessonsMeta: response.pagination ? {
              current_page: response.pagination.current_page || 1,
              total: response.pagination.total || 0,
              last_page: response.pagination.total_pages || 1,
            } : null,
            isLoadingLessons: false,
          })
        } catch (error: any) {
          set({
            isLoadingLessons: false,
            error: error.message || 'فشل تحميل الدروس',
          })
        }
      },
      getLesson: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const locale = getCurrentLocale()
          const lesson = await lessonsAPI.getLesson(id, locale)
          set({ isLoading: false })
          return lesson
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحميل بيانات الدرس',
          })
          throw error
        }
      },
      addLesson: async (lesson) => {
        set({ isLoading: true, error: null })
        try {
          await lessonsAPI.createLesson(lesson)
          await get().fetchLessons()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل إضافة الدرس',
          })
          throw error
        }
      },
      updateLesson: async (id, lesson) => {
        set({ isLoading: true, error: null })
        try {
          await lessonsAPI.updateLesson(id, lesson)
          await get().fetchLessons()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحديث الدرس',
          })
          throw error
        }
      },
      deleteLesson: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await lessonsAPI.deleteLesson(id)
          await get().fetchLessons()
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل حذف الدرس',
          })
          throw error
        }
      },

      // Teacher Salary & Payments
      getTeacherSalary: async (teacherId, month) => {
        set({ isLoading: true, error: null })
        try {
          const locale = getCurrentLocale()
          const response = await teacherSalaryAPI.getTeacherSalary(teacherId, month, locale)
          set({ isLoading: false })
          return response
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحميل حساب الراتب',
          })
          throw error
        }
      },
      markPaymentAsPaid: async (teacherId, data) => {
        set({ isLoading: true, error: null })
        try {
          await teacherSalaryAPI.markPaymentAsPaid(teacherId, data)
          set({ isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تسجيل السداد',
          })
          throw error
        }
      },
      getTeacherPayments: async (teacherId, page = 1) => {
        set({ isLoading: true, error: null })
        try {
          const locale = getCurrentLocale()
          const response = await teacherSalaryAPI.getTeacherPayments(teacherId, page, 15, locale)
          set({ isLoading: false })
          return response
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحميل سجل المدفوعات',
          })
          throw error
        }
      },
      getTeacherPaymentMethods: async (teacherId) => {
        set({ isLoading: true, error: null })
        try {
          const locale = getCurrentLocale()
          const response = await teacherSalaryAPI.getTeacherPaymentMethods(teacherId, locale)
          set({ isLoading: false })
          return response
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'فشل تحميل طرق الدفع',
          })
          throw error
        }
      },
    }),
    {
      name: 'admin-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        admin: state.admin,
      }),
    }
  )
)
