'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'

interface Student {
  id: number
  name: string
  phone?: string
  email?: string
}

interface SearchableStudentSelectProps {
  value: string
  onChange: (value: string) => void
  students: Student[]
  placeholder?: string
  required?: boolean
}

export default function SearchableStudentSelect({
  value,
  onChange,
  students,
  placeholder = 'اختر الطالب',
  required = false,
}: SearchableStudentSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      student.name.toLowerCase().includes(search) ||
      student.phone?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search)
    )
  })

  // Get selected student name
  const selectedStudent = students.find((s) => s.id.toString() === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (studentId: string) => {
    onChange(studentId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right flex items-center justify-between ${
          isOpen ? 'border-primary-500' : ''
        }`}
        dir="rtl"
      >
        <span className={selectedStudent ? 'text-primary-900' : 'text-primary-400'}>
          {selectedStudent ? selectedStudent.name : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-primary-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-primary-500" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-primary-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-primary-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-primary-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن طالب..."
                className="w-full pr-10 pl-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right"
                dir="rtl"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredStudents.length === 0 ? (
              <div className="px-4 py-3 text-center text-primary-600 text-sm">
                لا توجد نتائج
              </div>
            ) : (
              filteredStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelect(student.id.toString())}
                  className={`w-full text-right px-4 py-2 hover:bg-primary-50 transition-colors ${
                    value === student.id.toString() ? 'bg-primary-100 font-semibold' : ''
                  }`}
                  dir="rtl"
                >
                  <div className="flex flex-col">
                    <span>{student.name}</span>
                    {student.phone && (
                      <span className="text-xs text-primary-500">{student.phone}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hidden select for form validation */}
      <select
        value={value}
        onChange={() => {}}
        required={required}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      >
        <option value="">{placeholder}</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name}
          </option>
        ))}
      </select>
    </div>
  )
}

