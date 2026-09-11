import { create } from 'zustand'
import * as websiteAPI from '@/lib/api/website'
import { getCurrentLocale } from '@/lib/website-api-client'

interface WebsiteState {
  // Website Data
  features: websiteAPI.WebsiteFeature[]
  packages: websiteAPI.WebsitePackage[]
  teachers: websiteAPI.WebsiteTeacher[]
  reviews: websiteAPI.WebsiteReview[]
  
  // Honor Boards
  honorBoards: websiteAPI.WebsiteHonorBoard[]
  honorBoardsPagination: {
    current_page: number
    total: number
    total_pages: number
  } | null
  
  // Lessons
  lessons: websiteAPI.WebsiteLesson[]
  lessonsPagination: {
    current_page: number
    total: number
    total_pages: number
  } | null
  
  // Loading states
  isLoading: boolean
  isLoadingHonorBoards: boolean
  isLoadingLessons: boolean
  error: string | null
  
  // Actions
  fetchWebsiteData: () => Promise<void>
  fetchHonorBoards: (studentId?: number, page?: number) => Promise<void>
  getHonorBoard: (id: number) => Promise<websiteAPI.WebsiteHonorBoard>
  fetchTeachers: (page?: number) => Promise<void>
  fetchPackages: (isPopular?: boolean, page?: number) => Promise<void>
  fetchReviews: (rating?: number, packageId?: number, page?: number) => Promise<void>
  fetchLessons: (page?: number) => Promise<void>
  registerStudent: (data: websiteAPI.RegisterStudentRequest) => Promise<websiteAPI.RegisterStudentResponse>
  createReview: (data: websiteAPI.CreateReviewRequest) => Promise<websiteAPI.CreateReviewResponse>
}

export const useWebsiteStore = create<WebsiteState>((set, get) => ({
  // Initial state
  features: [],
  packages: [],
  teachers: [],
  reviews: [],
  honorBoards: [],
  honorBoardsPagination: null,
  lessons: [],
  lessonsPagination: null,
  isLoading: false,
  isLoadingHonorBoards: false,
  isLoadingLessons: false,
  error: null,

  // Fetch all website data
  fetchWebsiteData: async () => {
    set({ isLoading: true, error: null })
    try {
      const locale = getCurrentLocale()
      const data = await websiteAPI.getWebsiteData(locale)
      // Remove duplicates based on id
      const uniquePackages = Array.from(
        new Map((data.packages || []).map((pkg) => [pkg.id, pkg])).values()
      )
      const uniqueFeatures = Array.from(
        new Map((data.features || []).map((feature) => [feature.id, feature])).values()
      )
      const uniqueTeachers = Array.from(
        new Map((data.teachers || []).map((teacher) => [teacher.id, teacher])).values()
      )
      const uniqueReviews = Array.from(
        new Map((data.reviews || []).map((review) => [review.id, review])).values()
      )
      
      set({
        features: uniqueFeatures,
        packages: uniquePackages,
        teachers: uniqueTeachers,
        reviews: uniqueReviews,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'فشل تحميل بيانات الموقع',
      })
    }
  },

  // Fetch honor boards
  fetchHonorBoards: async (studentId, page = 1) => {
    set({ isLoadingHonorBoards: true, error: null })
    try {
      const locale = getCurrentLocale()
      const response = await websiteAPI.listHonorBoards(studentId, page, 15, locale)
      set({
        honorBoards: response.honor_boards || [],
        honorBoardsPagination: response.pagination ? {
          current_page: response.pagination.current_page || 1,
          total: response.pagination.total || 0,
          total_pages: response.pagination.total_pages || 1,
        } : null,
        isLoadingHonorBoards: false,
      })
    } catch (error: any) {
      set({
        isLoadingHonorBoards: false,
        error: error.message || 'فشل تحميل لوحة الشرف',
      })
    }
  },
  getHonorBoard: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const locale = getCurrentLocale()
      const entry = await websiteAPI.getHonorBoard(id, locale)
      set({ isLoading: false })
      return entry
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'فشل تحميل بيانات السجل',
      })
      throw error
    }
  },

  // Fetch teachers
  fetchTeachers: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const locale = getCurrentLocale()
      const response = await websiteAPI.listTeachers(page, 15, locale)
      set({
        teachers: response.teachers || [],
        isLoading: false,
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'فشل تحميل المعلمين',
      })
    }
  },

  // Fetch packages
  fetchPackages: async (isPopular, page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const locale = getCurrentLocale()
      const response = await websiteAPI.listPackages(isPopular, page, 15, locale)
      set({
        packages: response.packages || [],
        isLoading: false,
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'فشل تحميل الباقات',
      })
    }
  },

  // Fetch reviews
  fetchReviews: async (rating, packageId, page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const locale = getCurrentLocale()
      const response = await websiteAPI.listReviews(rating, packageId, page, 15, locale)
      set({
        reviews: response.reviews || [],
        isLoading: false,
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'فشل تحميل الآراء',
      })
    }
  },

  // Fetch lessons
  fetchLessons: async (page = 1) => {
    set({ isLoadingLessons: true, error: null })
    try {
      const locale = getCurrentLocale()
      const response = await websiteAPI.listLessons(page, 15, locale)
      // Remove duplicates based on id
      const uniqueLessons = Array.from(
        new Map((response.lessons || []).map((lesson) => [lesson.id, lesson])).values()
      )
      set({
        lessons: uniqueLessons,
        lessonsPagination: response.pagination ? {
          current_page: response.pagination.current_page || 1,
          total: response.pagination.total || 0,
          total_pages: response.pagination.total_pages || 1,
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

  // Register student
  registerStudent: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const locale = getCurrentLocale()
      const response = await websiteAPI.registerStudent(data, locale)
      set({ isLoading: false })
      return response
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'فشل تسجيل الطالب',
      })
      throw error
    }
  },

  // Create review
  createReview: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const locale = getCurrentLocale()
      const response = await websiteAPI.createReview(data, locale)
      set({ isLoading: false })
      return response
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'فشل إرسال الرأي',
      })
      throw error
    }
  },
}))

