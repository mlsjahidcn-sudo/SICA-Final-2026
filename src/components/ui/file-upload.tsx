"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  IconUpload,
  IconFile,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconFileTypePdf,
  IconPhoto,
  IconFileText
} from "@tabler/icons-react"

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
  accept?: string
  maxSize?: number // in MB
  disabled?: boolean
  className?: string
  documentType?: string
}

interface UploadState {
  file: File | null
  uploading: boolean
  progress: number
  error: string | null
  success: boolean
}

export function FileUpload({
  onUpload,
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  maxSize = 10,
  disabled = false,
  className,
  documentType
}: FileUploadProps) {
  const [state, setState] = React.useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    error: null,
    success: false
  })
  
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dragRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX'
    }

    return null
  }

  const handleFileSelect = async (file: File) => {
    const error = validateFile(file)
    if (error) {
      setState({ ...state, error, file: null })
      return
    }

    setState({ file, uploading: false, progress: 0, error: null, success: false })
  }

  const handleUpload = async () => {
    if (!state.file) return

    setState(prev => ({ ...prev, uploading: true, progress: 0, error: null, success: false }))

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }))
      }, 100)

      await onUpload(state.file)

      clearInterval(progressInterval)
      setState(prev => ({ ...prev, progress: 100, uploading: false, success: true }))
      
      // Reset after success
      setTimeout(() => {
        setState({ file: null, uploading: false, progress: 0, error: null, success: false })
      }, 2000)
    } catch (err) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: err instanceof Error ? err.message : 'Upload failed'
      }))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const clearFile = () => {
    setState({ file: null, uploading: false, progress: 0, error: null, success: false })
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <IconPhoto className="h-8 w-8 text-blue-500" />
    }
    if (file.type === 'application/pdf') {
      return <IconFileTypePdf className="h-8 w-8 text-red-500" />
    }
    return <IconFileText className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn("w-full", className)}>
      {!state.file ? (
        <div
          ref={dragRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragging && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed",
            !isDragging && !disabled && "hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-4 rounded-full bg-muted">
              <IconUpload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {documentType ? `Upload ${documentType}` : "Click or drag file to upload"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, JPG, PNG, DOC, DOCX (max {maxSize}MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-muted flex-shrink-0">
              {getFileIcon(state.file)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{state.file.name}</p>
                {!state.uploading && !state.success && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    className="flex-shrink-0"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(state.file.size)}
              </p>
              
              {state.uploading && (
                <div className="mt-3">
                  <Progress value={state.progress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Uploading... {state.progress}%
                  </p>
                </div>
              )}
              
              {state.success && (
                <div className="mt-3 flex items-center gap-2 text-green-600">
                  <IconCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">Upload successful!</span>
                </div>
              )}
              
              {state.error && (
                <div className="mt-3 flex items-center gap-2 text-red-600">
                  <IconAlertCircle className="h-4 w-4" />
                  <span className="text-sm">{state.error}</span>
                </div>
              )}
            </div>
          </div>

          {!state.uploading && !state.success && (
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={clearFile}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={state.uploading}>
                <IconUpload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Document type selector component
interface DocumentTypeSelectProps {
  value: string
  onChange: (value: string) => void
  requiredTypes?: string[]
  disabled?: boolean
}

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'diploma', label: 'Diploma/Degree Certificate' },
  { value: 'transcript', label: 'Academic Transcript' },
  { value: 'language_certificate', label: 'Language Test Certificate (IELTS/TOEFL/HSK)' },
  { value: 'photo', label: 'Passport Photo' },
  { value: 'recommendation', label: 'Recommendation Letter' },
  { value: 'cv', label: 'CV/Resume' },
  { value: 'study_plan', label: 'Study Plan/Personal Statement' },
  { value: 'financial_proof', label: 'Financial Support Proof' },
  { value: 'medical_exam', label: 'Medical Examination Report' },
  { value: 'police_clearance', label: 'Police Clearance Certificate' },
  { value: 'other', label: 'Other Document' }
]

export function DocumentTypeSelect({ 
  value, 
  onChange, 
  requiredTypes,
  disabled = false 
}: DocumentTypeSelectProps) {
  const types = requiredTypes 
    ? DOCUMENT_TYPES.filter(t => requiredTypes.includes(t.value))
    : DOCUMENT_TYPES

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="">Select document type...</option>
      {types.map(type => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  )
}
