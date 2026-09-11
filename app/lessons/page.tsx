import type { Metadata } from 'next'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import LessonsList from '@/components/lessons/LessonsList'

export const metadata: Metadata = {
  title: 'فيديوهات من الحصص | أكاديمية الحافظ',
  description: 'شاهد فيديوهات من حصصنا المسجلة في أكاديمية الحافظ لتعليم القرآن الكريم',
  keywords: 'دروس القرآن, فيديوهات الحصص, تعليم القرآن, تجويد, أكاديمية الحافظ',
}

export default function LessonsPage() {
  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="container-custom">
          <LessonsList headingLevel="h1" />
        </div>
      </section>
      <Footer />
    </div>
  )
}

