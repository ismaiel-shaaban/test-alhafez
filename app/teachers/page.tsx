import type { Metadata } from 'next'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import TeachersList from '@/components/teachers/TeachersList'

export const metadata: Metadata = {
  title: 'المعلمين | أكاديمية الحافظ - فريقنا التعليمي',
  description: 'تعرف على فريقنا من المعلمين المؤهلين والمرخصين في تعليم القرآن الكريم والتجويد واللغة العربية.',
  keywords: 'معلمو القرآن, معلمين مؤهلين, أساتذة تجويد, تعليم عربي',
  openGraph: {
    title: 'المعلمين | أكاديمية الحافظ',
    description: 'فريقنا من المعلمين المؤهلين',
    type: 'website',
  },
  alternates: {
    canonical: '/teachers',
  },
}

export default function TeachersPage() {
  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="container-custom">
          <TeachersList />
        </div>
      </section>
      <Footer />
    </div>
  )
}
