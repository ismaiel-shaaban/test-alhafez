'use client'

import { X } from 'lucide-react'

export default function PaymentProofFilesField({
  files,
  onChange,
}: {
  files: File[]
  onChange: (files: File[]) => void
}) {
  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
    if (selected.length === 0) return
    onChange([...files, ...selected])
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    onChange(files.filter((_, fileIndex) => fileIndex !== index))
  }

  return (
    <div>
      <label className="block text-primary-900 font-semibold mb-2 text-right">ملفات إثبات الدفع *</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none"
      />
      <p className="text-xs text-primary-600 mt-1">
        يمكن رفع أكثر من صورة (jpeg, png, jpg, gif، الحد الأقصى: 5MB لكل ملف)
      </p>
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg text-sm"
            >
              <span className="text-primary-800 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-600 hover:text-red-800 shrink-0"
                aria-label={`حذف ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
