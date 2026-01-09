import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { useState, useEffect } from 'react'
import {
  Search,
  Settings,
  User,
  Plus,
  Upload,
  FolderPlus,
  FolderClosed,
  Clock,
  Star,
  Trash2,
  Cloud,
  Home,
  Info,
  LayoutGrid,
  List,
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
  ChevronRight,
  X,
} from 'lucide-react'

type SearchParams = {
  folderId?: string
}

export const Route = createFileRoute('/')({
  component: DriveClone,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      folderId: typeof search.folderId === 'string' ? search.folderId : undefined,
    }
  },
})

type FileType = 'folder' | 'document' | 'image' | 'video' | 'audio' | 'archive' | 'spreadsheet' | 'presentation' | 'pdf' | 'code' | 'other'

function getFileIcon(type: FileType) {
  const iconClass = 'w-12 h-12'
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

function DriveClone() {
  const { folderId } = Route.useSearch()
  const navigate = useNavigate()
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [userId, setUserId] = useState<Id<'users'> | null>(null)

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

  // Parse folderId from search params
  const currentFolderId = folderId as Id<'folders'> | undefined

  // Get folders in current directory
  const folders = useQuery(
    api.folders.getFoldersInParent,
    userId ? { ownerId: userId, parentId: currentFolderId } : 'skip'
  )

  // Get files in current directory
  const files = useQuery(
    api.files.getFilesInFolder,
    userId ? { ownerId: userId, folderId: currentFolderId } : 'skip'
  )

  // Get breadcrumb path
  const breadcrumbPath = useQuery(
    api.folders.getFolderPath,
    currentFolderId ? { folderId: currentFolderId } : 'skip'
  )

  // Get storage info
  const storageInfo = useQuery(
    api.users.getStorageInfo,
    userId ? { userId } : 'skip'
  )

  // Create folder mutation
  const createFolderMutation = useMutation(api.folders.createFolder)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !userId) return
    setIsCreatingFolder(true)
    try {
      await createFolderMutation({
        name: newFolderName.trim(),
        parentId: currentFolderId,
        ownerId: userId,
      })
      setShowCreateFolderModal(false)
      setNewFolderName('')
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleFolderClick = (folderId: string) => {
    navigate({
      to: '/',
      search: { folderId },
    })
  }

  const handleBreadcrumbClick = (folderId?: string) => {
    navigate({
      to: '/',
      search: folderId ? { folderId } : {},
    })
  }

  const foldersList = folders ?? []
  const filesList = files ?? []
  const totalItems = foldersList.length + filesList.length
  const storageUsed = storageInfo?.used ?? 0
  const storageLimit = storageInfo?.limit ?? (10 * 1024 * 1024 * 1024)
  const storagePercentage = storageInfo?.percentage ?? 0
  const breadcrumbs = breadcrumbPath ?? []

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2 mr-8">
          <Cloud className="w-8 h-8 text-gray-700" />
          <span className="text-xl font-normal text-gray-700">Drive Clone</span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2.5 hover:bg-gray-200 hover:shadow-sm transition-all">
            <Search className="w-5 h-5 text-gray-500 mr-3" />
            <span className="text-gray-500 text-sm">Search files...</span>
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

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-60 p-4 flex flex-col">
          {/* New Button */}
          <button className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium hover:bg-blue-700 hover:shadow-md transition-all mb-4 w-full justify-center">
            <Plus className="w-5 h-5" />
            <span>New</span>
          </button>

          {/* Upload / Folder buttons */}
          <div className="flex gap-2 mb-6">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex-1">
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex-1"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Folder</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavItem
              icon={<FolderClosed className="w-5 h-5" />}
              label="My Drive"
              active={!currentFolderId}
              onClick={() => handleBreadcrumbClick(undefined)}
            />
            <NavItem icon={<Clock className="w-5 h-5" />} label="Recent" />
            <NavItem icon={<Star className="w-5 h-5" />} label="Starred" />
            <NavItem icon={<Trash2 className="w-5 h-5" />} label="Trash" />
          </nav>

          {/* Storage Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <NavItem icon={<Cloud className="w-5 h-5" />} label="Storage" />
          </div>

          {/* Storage indicator at bottom */}
          <div className="mt-auto pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Cloud className="w-4 h-4" />
              <span>Storage</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs text-blue-600">
              {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
            </span>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-white">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 text-gray-700">
              <button
                onClick={() => handleBreadcrumbClick(undefined)}
                className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">My Drive</span>
              </button>

              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => handleBreadcrumbClick(crumb.id)}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      index === breadcrumbs.length - 1
                        ? 'font-medium text-gray-900'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Info className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
              <span className="text-sm text-gray-600">{totalItems} items</span>
            </div>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button className="p-2 bg-gray-100 border-r border-gray-300">
                <LayoutGrid className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-50">
                <List className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* File Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Folders */}
            {foldersList.map((folder) => (
              <FolderCard
                key={folder._id}
                name={folder.name}
                onClick={() => handleFolderClick(folder._id)}
              />
            ))}

            {/* Files */}
            {filesList.map((file) => (
              <FileCard
                key={file._id}
                name={file.name}
                type={file.type}
size={formatBytes(file.size)}
              />
            ))}

            {/* Empty state - only show when data has loaded AND is empty */}
            {folders !== undefined && files !== undefined && totalItems === 0 && userId && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500">
                <FolderOpen className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">This folder is empty</p>
                <p className="text-sm">Drop files here or click "Folder" to create a new folder</p>
              </div>
            )}

            {/* Loading state */}
            {!userId && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm">Loading...</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">New folder</h2>
              <button
                onClick={() => {
                  setShowCreateFolderModal(false)
                  setNewFolderName('')
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Untitled folder"
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder()
                if (e.key === 'Escape') {
                  setShowCreateFolderModal(false)
                  setNewFolderName('')
                }
              }}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateFolderModal(false)
                  setNewFolderName('')
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingFolder ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
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

function FolderCard({
  name,
  onClick,
}: {
  name: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <FolderOpen className="w-12 h-12 text-blue-500 mb-2" />
      <p className="text-sm font-medium text-gray-700 text-center line-clamp-2">{name}</p>
    </div>
  )
}

function FileCard({
  name,
  type,
  size,
}: {
  name: string
  type: FileType
  size: string
}) {
  return (
    <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg">
      {getFileIcon(type)}
      <p className="text-sm font-medium text-gray-700 text-center line-clamp-2 mt-2">
        {name}
      </p>
      <p className="text-xs text-gray-500 mt-1">{size}</p>
    </div>
  )
}