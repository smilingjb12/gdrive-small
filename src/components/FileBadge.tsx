import { cn } from '../lib/utils'

type FileType = 'folder' | 'document' | 'image' | 'video' | 'audio' | 'archive' | 'spreadsheet' | 'presentation' | 'pdf' | 'code' | 'other'

interface FileBadgeProps {
  type: FileType
  size?: 'sm' | 'md'
  className?: string
}

// Background and text color mapping for each file type
function getBadgeColors(type: FileType): { bg: string; text: string } {
  switch (type) {
    case 'folder':
      return { bg: 'bg-blue-100', text: 'text-blue-700' }
    case 'document':
      return { bg: 'bg-gray-100', text: 'text-gray-700' }
    case 'image':
      return { bg: 'bg-green-100', text: 'text-green-700' }
    case 'video':
      return { bg: 'bg-purple-100', text: 'text-purple-700' }
    case 'audio':
      return { bg: 'bg-pink-100', text: 'text-pink-700' }
    case 'archive':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' }
    case 'spreadsheet':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700' }
    case 'presentation':
      return { bg: 'bg-orange-100', text: 'text-orange-700' }
    case 'pdf':
      return { bg: 'bg-red-100', text: 'text-red-700' }
    case 'code':
      return { bg: 'bg-amber-100', text: 'text-amber-700' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600' }
  }
}

// Get display name for file type
function getTypeDisplayName(type: FileType): string {
  switch (type) {
    case 'pdf':
      return 'PDF'
    default:
      return type.charAt(0).toUpperCase() + type.slice(1)
  }
}

export function FileBadge({ type, size = 'sm', className }: FileBadgeProps) {
  const colors = getBadgeColors(type)

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        colors.bg,
        colors.text,
        sizeClasses[size],
        className
      )}
      data-testid="file-type-badge"
    >
      {getTypeDisplayName(type)}
    </span>
  )
}
