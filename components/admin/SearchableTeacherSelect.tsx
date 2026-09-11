'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown, X } from 'lucide-react'

interface Teacher {
  id: number
  name: string
}

interface SearchableTeacherSelectProps {
  value: string
  onChange: (value: string) => void
  teachers: Teacher[]
  placeholder?: string
  required?: boolean
}

export default function SearchableTeacherSelect({
  value,
  onChange,
  teachers,
  placeholder = 'اختر المعلم (اختياري)',
  required = false,
}: SearchableTeacherSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get selected teacher name
  const selectedTeacher = teachers.find((t) => t.id.toString() === value)

  // Calculate dropdown position relative to button
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom, // Use viewport position for fixed positioning
          left: rect.left,
          width: rect.width,
        })
      }
    }

    if (isOpen) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (teacherId: string) => {
    onChange(teacherId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  const dropdownContent = isOpen && typeof window !== 'undefined' ? (
    createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[9999] bg-white border-2 border-primary-300 rounded-lg shadow-xl max-h-[500px] sm:max-h-[600px] overflow-hidden mt-1"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
        }}
      >
        <div className="p-3 border-b border-primary-200 bg-primary-50">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن معلم..."
              className="w-full pr-11 pl-4 py-2.5 border-2 border-primary-300 rounded-lg focus:border-primary-500 outline-none text-right text-sm sm:text-base"
              dir="rtl"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-[400px] sm:max-h-[500px]">
          {filteredTeachers.length === 0 ? (
            <div className="px-4 py-6 text-center text-primary-600 text-sm sm:text-base">
              لا توجد نتائج
            </div>
          ) : (
            filteredTeachers.map((teacher) => (
              <button
                key={teacher.id}
                type="button"
                onClick={() => handleSelect(teacher.id.toString())}
                className={`w-full text-right px-4 py-3 hover:bg-primary-50 transition-colors text-sm sm:text-base ${
                  value === teacher.id.toString() ? 'bg-primary-100 font-semibold text-primary-900' : 'text-primary-700'
                }`}
                dir="rtl"
              >
                {teacher.name}
              </button>
            ))
          )}
        </div>
      </div>,
      document.body
    )
  ) : null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-500 outline-none text-right flex items-center justify-between ${
          isOpen ? 'border-primary-500' : ''
        }`}
        dir="rtl"
      >
        <span className={selectedTeacher ? 'text-primary-900' : 'text-primary-400'}>
          {selectedTeacher ? selectedTeacher.name : placeholder}
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

      {dropdownContent}

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
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.name}
          </option>
        ))}
      </select>
    </div>
  )
}

