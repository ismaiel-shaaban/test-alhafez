'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/store/useAdminStore'
import { Lock, User, AlertCircle, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminLogin() {
  const router = useRouter()
  const { admin, login } = useAdminStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (admin.isAuthenticated) {
      router.push('/admin/dashboard')
    }
  }, [admin.isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await login(username, password)
      
      if (success) {
        router.push('/admin/dashboard')
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة')
        setIsLoading(false)
      }
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء تسجيل الدخول')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100/50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-green/20 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-primary-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-primary-200 p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-700 to-accent-green rounded-2xl shadow-lg mb-4">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primary-900 mb-2">تسجيل الدخول</h1>
            <p className="text-primary-600">لوحة تحكم الإدارة</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-primary-900 font-semibold mb-2 text-right">
                اسم المستخدم
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border-2 border-primary-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-right"
                  placeholder="أدخل اسم المستخدم"
                  required
                  dir="rtl"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-primary-900 font-semibold mb-2 text-right">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border-2 border-primary-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-right"
                  placeholder="أدخل كلمة المرور"
                  required
                  dir="rtl"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Demo Credentials Hint */}
          {/* <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-xs text-primary-600 text-center">
              <strong>تجريبي:</strong> admin / password
            </p>
          </div> */}
        </div>
      </motion.div>
    </div>
  )
}
