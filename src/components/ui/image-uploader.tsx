"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  IconUpload, 
  IconX, 
  IconLoader2, 
  IconPhoto,
  IconRefresh,
} from "@tabler/icons-react"
import { toast } from "sonner"

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  label?: string
  hint?: string
  accept?: string
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
  uploadEndpoint?: string
}

export function ImageUploader({
  value,
  onChange,
  onRemove,
  label,
  hint,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  maxSize = 5,
  className,
  disabled = false,
  uploadEndpoint = "/api/documents",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!accept.split(',').some(type => file.type.match(type.trim()))) {
      toast.error("Invalid file type. Please upload an image file.")
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${maxSize}MB.`)
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'photo')
      formData.append('category', 'program_cover')

      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        onChange(data.url || data.file_url)
        toast.success("Image uploaded successfully")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to upload image")
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled) {
      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    }
  }

  const handleRemove = () => {
    onChange('')
    if (onRemove) {
      onRemove()
    }
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      {value ? (
        // Preview mode
        <div className="relative group">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <img
              src={value}
              alt="Cover image"
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                <IconRefresh className="h-4 w-4 mr-1" />
                Change
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || isUploading}
              >
                <IconX className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Upload mode
        <div
          className={cn(
            "relative aspect-video w-full border-2 border-dashed rounded-lg transition-colors",
            isDragging && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer hover:border-primary/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            {isUploading ? (
              <>
                <IconLoader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted">
                  <IconUpload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WebP, or GIF (max {maxSize}MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {hint && !value && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

// Compact version for avatars and small images
interface AvatarUploaderProps {
  value?: string
  onChange: (url: string) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}

export function AvatarUploader({
  value,
  onChange,
  size = 'md',
  className,
  disabled = false,
}: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }

  const handleFileSelect = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'photo')
      formData.append('category', 'avatar')

      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        onChange(data.url || data.file_url)
        toast.success("Avatar updated")
      } else {
        toast.error("Failed to upload avatar")
      }
    } catch {
      toast.error("Failed to upload avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && inputRef.current?.click()}
      disabled={disabled}
      className={cn(
        "relative rounded-full overflow-hidden border-2 border-muted bg-muted transition-colors",
        sizeClasses[size],
        !disabled && "hover:border-primary cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {value ? (
        <img src={value} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {isUploading ? (
            <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <IconPhoto className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      )}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
    </button>
  )
}
