import { create } from 'zustand'

interface Student {
  id: string
  name: string
  email: string
  phone: string
  age: number
  gender: string
  package: string
  message?: string
}

interface AppState {
  students: Student[]
  isLoading: boolean
  addStudent: (student: Student) => void
  setLoading: (loading: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  students: [],
  isLoading: false,
  addStudent: (student) =>
    set((state) => ({
      students: [...state.students, student],
    })),
  setLoading: (loading) =>
    set(() => ({
      isLoading: loading,
    })),
}))
