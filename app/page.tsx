import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Hero from '@/components/home/Hero'
import Features from '@/components/home/Features'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import AnimatedSection from '@/components/home/AnimatedSection'
import SectionWrapper from '@/components/home/SectionWrapper'

// Lazy load below-the-fold components for better performance
const PackagesList = dynamic(() => import('@/components/packages/PackagesList'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
  ssr: true,
})

const LessonsList = dynamic(() => import('@/components/lessons/LessonsList'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
  ssr: true,
})

const TeachersList = dynamic(() => import('@/components/teachers/TeachersList'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
  ssr: true,
})

const TestimonialsList = dynamic(() => import('@/components/testimonials/TestimonialsList'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
  ssr: true,
})

export const metadata: Metadata = {
  title: 'أكاديمية الحافظ | Al-Hafez Academy - تعليم القرآن الكريم',
  description: 'أكاديمية الحافظ لتأسيس وتحفيظ القرآن الكريم لجميع الأعمار رجالاً ونساءً. تعلم أحكام التجويد وتأسيس القراءة للأطفال.',
  keywords: 'حفظ القرآن, تعليم القرآن, تجويد, تعليم العربية, أكاديمية الحافظ, Quran academy, Arabic learning',
  openGraph: {
    title: 'أكاديمية الحافظ | Al-Hafez Academy',
    description: 'أكاديمية الحافظ لتأسيس وتحفيظ القرآن الكريم لجميع الأعمار',
    type: 'website',
    locale: 'ar_AR',
    alternateLocale: 'en_US',
  },
  alternates: {
    canonical: '/',
    languages: {
      'ar': '/',
      'en': '/en',
    },
  },
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      
      {/* Packages Section */}
      <AnimatedSection id="packages" className="py-20 bg-white" delay={0.2}>
        <div className="container-custom">
          <SectionWrapper delay={0.4}>
            <PackagesList headingLevel="h2" carousel={true} />
          </SectionWrapper>
        </div>
      </AnimatedSection>

      {/* Lessons Section */}
      <AnimatedSection id="lessons" className="py-20 bg-primary-50" delay={0.2}>
        <div className="container-custom">
          <SectionWrapper delay={0.4}>
            <LessonsList headingLevel="h2" limit={6} carousel={true} />
          </SectionWrapper>
        </div>
      </AnimatedSection>

      {/* Teachers Section */}
      <AnimatedSection id="teachers" className="py-20 bg-white" delay={0.2}>
        <div className="container-custom">
          <SectionWrapper delay={0.4}>
            <TeachersList headingLevel="h2" limit={4} carousel={true} />
          </SectionWrapper>
        </div>
      </AnimatedSection>

      {/* Testimonials Section */}
      <AnimatedSection id="testimonials" className="py-20 bg-white" delay={0.2}>
        <div className="container-custom">
          <SectionWrapper delay={0.4}>
            <TestimonialsList headingLevel="h2" carousel={true} />
          </SectionWrapper>
        </div>
      </AnimatedSection>

      <Footer />
    </main>
  )
}
