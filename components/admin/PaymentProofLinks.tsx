import { getPaymentProofUrls } from '@/lib/api/teacher-salary'

export default function PaymentProofLinks({
  payment,
  className = '',
}: {
  payment: { files?: string[]; payment_proof_image?: string }
  className?: string
}) {
  const urls = getPaymentProofUrls(payment)
  if (urls.length === 0) return null

  return (
    <div className={className}>
      <p className="text-primary-600 text-sm mb-2">إثبات الدفع</p>
      <div className="flex flex-wrap gap-3">
        {urls.map((url, index) => (
          <a
            key={`${url}-${index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-2 underline break-all"
          >
            {urls.length === 1 ? 'عرض إثبات الدفع' : `عرض إثبات الدفع ${index + 1}`}
          </a>
        ))}
      </div>
    </div>
  )
}
