import type { Metadata } from 'next'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import RegisterForm from '@/components/register/RegisterForm'

export const metadata: Metadata = {
  title: 'سجل معانا | أكاديمية الحافظ - تسجيل الطلاب',
  description: 'سجل في أكاديمية الحافظ لتعلم القرآن الكريم واللغة العربية. برامج متخصصة لجميع الأعمار رجالاً ونساءً.',
  keywords: 'تسجيل طلاب, تسجيل أكاديمية الحافظ, تعليم Quran, تسجيل كورسات',
  openGraph: {
    title: 'سجل معانا | أكاديمية الحافظ',
    description: 'ابدأ رحلتك في حفظ القرآن الكريم واللغة العربية',
    type: 'website',
  },
  alternates: {
    canonical: '/register',
  },
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <section className="pt-32 pb-20">
        <RegisterForm />
      </section>
      <Footer />
    </div>
  )
}
