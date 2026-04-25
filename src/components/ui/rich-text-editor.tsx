"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconList,
  IconListNumbers,
  IconQuote,
  IconLink,
  IconCode,
} from "@tabler/icons-react"

// Format buttons configuration - defined outside component to avoid ref issues
const FORMAT_BUTTONS = [
  { icon: IconBold, label: 'Bold', before: '**', after: '**' },
  { icon: IconItalic, label: 'Italic', before: '*', after: '*' },
  { icon: IconUnderline, label: 'Underline', before: '__', after: '__' },
  { icon: IconList, label: 'Bullet List', before: '\n• ', after: '' },
  { icon: IconListNumbers, label: 'Numbered List', before: '\n1. ', after: '' },
  { icon: IconQuote, label: 'Quote', before: '\n> ', after: '' },
  { icon: IconCode, label: 'Code', before: '`', after: '`' },
  { icon: IconLink, label: 'Link', before: '[', after: '](url)' },
] as const

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
  maxLength?: number
  showWordCount?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder,
  hint,
  error,
  required = false,
  disabled = false,
  rows = 6,
  className,
  maxLength,
  showWordCount = false,
}: RichTextEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const insertFormatting = React.useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = 
      value.substring(0, start) + 
      before + 
      selectedText + 
      after + 
      value.substring(end)

    onChange(newText)

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }, [value, onChange])

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0
  const charCount = value.length

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 border rounded-t-lg bg-muted/30 border-b-0">
        {FORMAT_BUTTONS.map((btn) => (
          <Button
            key={btn.label}
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => insertFormatting(btn.before, btn.after)}
            disabled={disabled}
            title={btn.label}
          >
            <btn.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={cn(
          "rounded-t-none",
          error && "border-destructive"
        )}
      />

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {error && <span className="text-destructive">{error}</span>}
          {hint && !error && <span>{hint}</span>}
        </div>
        {(showWordCount || maxLength) && (
          <div className="flex items-center gap-2">
            {showWordCount && <span>{wordCount} words</span>}
            {maxLength && (
              <span className={cn(charCount > maxLength * 0.9 && "text-amber-500")}>
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Simple version without toolbar
interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
}

export function SimpleEditor({
  value,
  onChange,
  label,
  placeholder,
  hint,
  error,
  required = false,
  disabled = false,
  rows = 4,
  className,
}: SimpleEditorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(error && "border-destructive")}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// Preview component for markdown-like content
interface ContentPreviewProps {
  content: string
  className?: string
}

export function ContentPreview({ content, className }: ContentPreviewProps) {
  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h4 key={index} className="text-sm font-semibold mt-3 mb-1">{line.slice(4)}</h4>
        }
        if (line.startsWith('## ')) {
          return <h3 key={index} className="text-base font-semibold mt-4 mb-2">{line.slice(3)}</h3>
        }
        if (line.startsWith('# ')) {
          return <h2 key={index} className="text-lg font-bold mt-4 mb-2">{line.slice(2)}</h2>
        }
        
        // Lists
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <li key={index} className="ml-4 list-disc">{line.slice(2)}</li>
        }
        if (line.match(/^\d+\.\s/)) {
          return <li key={index} className="ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>
        }
        
        // Blockquote
        if (line.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-2 border-primary pl-3 my-2 text-muted-foreground">
              {line.slice(2)}
            </blockquote>
          )
        }
        
        // Code
        if (line.startsWith('`') && line.endsWith('`')) {
          return (
            <code key={index} className="bg-muted px-1 rounded text-sm">
              {line.slice(1, -1)}
            </code>
          )
        }
        
        // Empty lines
        if (!line.trim()) {
          return <br key={index} />
        }
        
        // Regular text with inline formatting
        return <p key={index} className="my-1">{renderInlineFormatting(line)}</p>
      })
  }

  const renderInlineFormatting = (text: string) => {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Underline
    text = text.replace(/__(.+?)__/g, '<u>$1</u>')
    // Code
    text = text.replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
    
    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      {renderContent(content)}
    </div>
  )
}
