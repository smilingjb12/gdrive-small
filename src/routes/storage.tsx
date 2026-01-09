import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { useState, useEffect, useRef } from 'react'
import { FileBadge } from '../components/FileBadge'
import {
  Search,
  Settings,
  User,
  Plus,
  Upload,
  FolderPlus,
  FolderClosed,
  Trash2,
  Cloud,
  FileText,
  Image,
  FolderOpen,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  FileType,
  Music,
  Video,
  ChevronDown,
  HardDrive,
} from 'lucide-react'

export const Route = createFileRoute('/storage')({
  component: StoragePage,
})

type FileTypeValue = 'folder' | 'document' | 'image' | 'video' | 'audio' | 'archive' | 'spreadsheet' | 'presentation' | 'pdf' | 'code' | 'other'

function getFileIcon(type: FileTypeValue, size: 'large' | 'small' = 'large') {
  const iconClass = size === 'large' ? 'w-12 h-12' : 'w-5 h-5'
  switch (type) {
    case 'folder':
      return <FolderOpen className={`${iconClass} text-blue-500`} />
    case 'document':
      return <FileText className={`${iconClass} text-gray-500`} />
    case 'image':
      return <Image className={`${iconClass} text-green-500`} />
    case 'video':
      return <Video className={`${iconClass} text-purple-400`} />
    case 'audio':
      return <Music className={`${iconClass} text-pink-500`} />
    case 'archive':
      return <FileArchive className={`${iconClass} text-yellow-500`} />
    case 'spreadsheet':
      return <FileSpreadsheet className={`${iconClass} text-green-600`} />
    case 'presentation':
      return <Presentation className={`${iconClass} text-orange-500`} />
    case 'pdf':
      return <FileType className={`${iconClass} text-red-500`} />
    case 'code':
      return <FileCode className={`${iconClass} text-amber-500`} />
    default:
      return <FileText className={`${iconClass} text-gray-400`} />
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Get color for each file type
function getTypeColor(type: string): string {
  switch (type) {
    case 'image':
      return 'bg-green-500'
    case 'video':
      return 'bg-purple-400'
    case 'audio':
      return 'bg-pink-500'
    case 'document':
      return 'bg-gray-500'
    case 'pdf':
      return 'bg-red-500'
    case 'archive':
      return 'bg-yellow-500'
    case 'spreadsheet':
      return 'bg-green-600'
    case 'presentation':
      return 'bg-orange-500'
    case 'code':
      return 'bg-amber-500'
    default:
      return 'bg-gray-400'
  }
}

// Get display name for file type
function getTypeDisplayName(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1) + 's'
}

function StoragePage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<Id<'users'> | null>(null)
  const [showNewDropdown, setShowNewDropdown] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get or create demo user
  const getOrCreateUser = useMutation(api.users.getOrCreateDemoUser)

  // Initialize demo user on mount
  useEffect(() => {
    getOrCreateUser({}).then((user) => {
      if (user) {
        setUserId(user._id)
      }
    })
  }, [getOrCreateUser])

  // Get storage info
  const storageInfo = useQuery(
    api.users.getStorageInfo,
    userId ? { userId } : 'skip'
  )

  // Get storage breakdown by file type
  const storageByType = useQuery(
    api.files.getStorageByFileType,
    userId ? { ownerId: userId } : 'skip'
  )

  // Get all files sorted by size
  const allFilesSorted = useQuery(
    api.files.getAllFilesSortedBySize,
    userId ? { ownerId: userId } : 'skip'
  )

  // Upload mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const createFileMutation = useMutation(api.files.createFile)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !userId) return

    setIsUploading(true)
    setShowNewDropdown(false)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`Uploading ${file.name}... (${i + 1}/${files.length})`)

        // Step 1: Generate upload URL
        const uploadUrl = await generateUploadUrl({})

        // Step 2: Upload the file to Convex storage
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const { storageId } = await response.json()

        // Step 3: Create file record in database (upload to root folder)
        await createFileMutation({
          name: file.name,
          mimeType: file.type,
          size: file.size,
          storageId: storageId as Id<'_storage'>,
          folderId: undefined, // Upload to root
          ownerId: userId,
        })
      }

      setUploadProgress('')
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress('')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const storageUsed = storageInfo?.used ?? 0
  const storageLimit = storageInfo?.limit ?? (10 * 1024 * 1024 * 1024)
  const storagePercentage = storageInfo?.percentage ?? 0

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
        data-testid="file-upload-input"
      />

      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="font-medium text-gray-800">Uploading files...</h3>
                <p className="text-sm text-gray-500">{uploadProgress}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - Fixed at top */}
      <header className="flex items-center px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2 mr-8">
          <Cloud className="w-8 h-8 text-gray-700" />
          <span className="text-xl font-normal text-gray-700">Drive Clone</span>
        </div>

        {/* Search Bar (disabled on storage page) */}
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center bg-gray-100 rounded-full px-4 h-10">
            <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search files..."
              disabled
              className="flex-1 bg-transparent border-none outline-none text-gray-400 text-sm placeholder-gray-400 min-w-0 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-2 ml-4">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <User className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Fixed width, scrollable if content overflows */}
        <aside className="w-60 p-4 flex flex-col shrink-0 overflow-y-auto bg-white">
          {/* New Button with Dropdown */}
          <div className="relative mb-6">
            <button
              onClick={() => setShowNewDropdown(!showNewDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 w-full justify-center transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showNewDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showNewDropdown && (
              <>
                {/* Backdrop to close dropdown when clicking outside */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNewDropdown(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2">
                  <button
                    onClick={() => {
                      setShowNewDropdown(false)
                      fileInputRef.current?.click()
                    }}
                    disabled={isUploading}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-5 h-5" />
                    <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowNewDropdown(false)
                      navigate({ to: '/' })
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FolderPlus className="w-5 h-5" />
                    <span>Folder</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavItem
              icon={<FolderClosed className="w-5 h-5" />}
              label="My Drive"
              onClick={() => navigate({ to: '/' })}
            />
            <NavItem
              icon={<Trash2 className="w-5 h-5" />}
              label="Trash"
              onClick={() => navigate({ to: '/trash' })}
            />
          </nav>

          {/* Storage Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <NavItem
              icon={<Cloud className="w-5 h-5" />}
              label="Storage"
              active={true}
            />
            {/* Storage Statistics */}
            <div className="px-3 mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">
                {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content - Scrollable area */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto" data-testid="storage-view">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-3 px-2 py-1">
                <HardDrive className="w-6 h-6 text-gray-700" />
                <h1 className="text-2xl font-semibold text-gray-800">Storage</h1>
              </div>
            </div>
          </div>

          {/* Storage Overview Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">Storage Used</h2>
              <span className="text-sm text-gray-500">
                {formatBytes(storageUsed)} of {formatBytes(storageLimit)}
              </span>
            </div>

            {/* Overall storage bar */}
            <div className="w-full bg-gray-100 rounded-full h-4 mb-6">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              ></div>
            </div>

            {/* Storage by file type */}
            <h3 className="text-sm font-medium text-gray-600 mb-4">Storage by file type</h3>

            {/* Loading state */}
            {!storageByType && userId && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Empty state */}
            {storageByType && storageByType.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Cloud className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No files uploaded yet</p>
              </div>
            )}

            {/* File type breakdown */}
            {storageByType && storageByType.length > 0 && (
              <div className="space-y-4">
                {storageByType
                  .sort((a, b) => b.size - a.size)
                  .map((item) => {
                    const percentage = storageUsed > 0 ? (item.size / storageUsed) * 100 : 0
                    return (
                      <div key={item.type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {getFileIcon(item.type as FileTypeValue, 'small')}
                            <span className="text-gray-700">{getTypeDisplayName(item.type)}</span>
                          </div>
                          <span className="text-gray-500">{formatBytes(item.size)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`${getTypeColor(item.type)} h-2 rounded-full transition-all`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Files List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">All Files</h2>
              <p className="text-sm text-gray-500">Sorted by size (largest first)</p>
            </div>

            {/* Loading state */}
            {!allFilesSorted && userId && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Empty state */}
            {allFilesSorted && allFilesSorted.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No files yet</p>
                <p className="text-sm">Upload some files to see them here</p>
              </div>
            )}

            {/* File list header */}
            {allFilesSorted && allFilesSorted.length > 0 && (
              <>
                <div className="flex items-center gap-3 px-6 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
                  <span className="w-5"></span>
                  <span className="flex-1">Name</span>
                  <span className="w-24">Type</span>
                  <span className="w-24 text-right">Size</span>
                </div>

                {/* File list */}
                <div className="divide-y divide-gray-100">
                  {allFilesSorted.map((file) => (
                    <div
                      key={file._id}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors"
                      data-testid="storage-file-item"
                    >
                      {getFileIcon(file.type as FileTypeValue, 'small')}
                      <p className="text-sm text-gray-700 truncate flex-1" title={file.name}>
                        {file.name}
                      </p>
                      <FileBadge type={file.type as FileTypeValue} className="shrink-0" />
                      <span className="text-sm text-gray-600 font-medium shrink-0 w-24 text-right">
                        {formatBytes(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Initial loading state */}
            {!userId && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm">Loading...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active = false,
  onClick
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm cursor-pointer ${
        active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}
