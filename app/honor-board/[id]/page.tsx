import type { Metadata } from 'next'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import HonorBoardDetail from '@/components/honor-board/HonorBoardDetail'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'تفاصيل الإنجاز | أكاديمية الحافظ',
  description: 'عرض تفاصيل الإنجاز وشهادات التقدير للطلاب المتميزين',
}

export default async function HonorBoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="container-custom">
          <HonorBoardDetail id={id} />
        </div>
      </section>
      <Footer />
    </div>
  )
}
