import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import { Mail, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'سياسة الاسترجاع والاسترداد | أكاديمية الحافظ',
  description:
    'سياسة الاسترجاع والاسترداد في أكاديمية الحافظ للتأسيس وتحفيظ القرآن الكريم — شروط الاسترداد قبل وبعد بدء الخدمة ومدة المعالجة.',
  alternates: {
    canonical: '/refund-policy',
  },
}

const sections = [
  {
    title: 'الاسترداد قبل بدء الخدمة',
    body: 'يحق للطالب أو ولي الأمر طلب استرداد كامل قيمة الاشتراك إذا تم إلغاء الاشتراك قبل حضور أول حصة مدفوعة.',
  },
  {
    title: 'بعد بدء الخدمة',
    body: 'بعد حضور أول حصة مدفوعة، لا يمكن استرداد قيمة الاشتراك عن الشهر الحالي، نظرًا لبدء تقديم الخدمة التعليمية.',
  },
  {
    title: 'تعذر تقديم الخدمة',
    body: 'إذا تعذر على الأكاديمية تقديم الحصة لأي سبب، يتم إعادة جدولتها في موعد مناسب، وإذا تعذر ذلك يتم رد قيمة الحصة أو إضافتها إلى الاشتراك.',
  },
  {
    title: 'مدة الاسترداد',
    body: 'تتم معالجة طلبات الاسترداد خلال 7 إلى 14 يوم عمل من تاريخ الموافقة على الطلب، ويكون رد المبلغ بنفس وسيلة الدفع المستخدمة قدر الإمكان.',
  },
  {
    title: 'التواصل',
    body: 'للاستفسارات المتعلقة بالمدفوعات أو طلبات الاسترداد، يرجى التواصل عبر البريد الإلكتروني:',
  },
]

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="container-custom max-w-4xl">
          <div className="bg-white rounded-2xl border-2 border-primary-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-l from-primary-700 to-primary-900 px-6 sm:px-10 py-10 text-white">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3">سياسة الاسترجاع والاسترداد</h1>
                  <p className="text-primary-100 leading-relaxed text-sm sm:text-base">
                    ترحب بكم أكاديمية الحافظ للتأسيس وتحفيظ القرآن الكريم، ونحرص على تقديم خدمة تعليمية
                    عالية الجودة مع توضيح سياسة الاسترداد الخاصة بنا.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-10 py-10 space-y-8">
              {sections.map((section, index) => (
                <article key={section.title} className="flex gap-4 sm:gap-5">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-primary-900 mb-2">{section.title}</h2>
                    <p className="text-primary-700 leading-relaxed">{section.body}</p>
                    {index === sections.length - 1 && (
                      <a
                        href="mailto:hafezacademy84@gmail.com"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-primary-50 border border-primary-200 text-primary-800 hover:bg-primary-100 transition-colors"
                      >
                        <Mail className="w-4 h-4 shrink-0" />
                        <span>hafezacademy84@gmail.com</span>
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="px-6 sm:px-10 py-6 bg-primary-50 border-t border-primary-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-primary-600">
                لأي استفسار إضافي، فريق الدعم جاهز لمساعدتك.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary-700 text-white font-medium hover:bg-primary-800 transition-colors"
              >
                سجّل معنا
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
