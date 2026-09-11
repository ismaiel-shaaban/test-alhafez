import type { Metadata } from 'next'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import HonorBoardList from '@/components/honor-board/HonorBoardList'

export const metadata: Metadata = {
  title: 'لوحة الشرف | أكاديمية الحافظ - الطلاب المتميزون',
  description: 'تعرف على طلابنا المتميزين في حفظ القرآن الكريم والتفوق في تعلم اللغة العربية.',
  keywords: 'لوحة الشرف, طلاب متميزون, حفظ القرآن, إنجازات الطلاب',
  openGraph: {
    title: 'لوحة الشرف | أكاديمية الحافظ',
    description: 'طلابنا المتميزون في حفظ القرآن الكريم',
    type: 'website',
  },
  alternates: {
    canonical: '/honor-board',
  },
}

export default function HonorBoardPage() {
  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="container-custom">
          <HonorBoardList />
        </div>
      </section>
      <Footer />
    </div>
  )
}
