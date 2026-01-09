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
  LayoutGrid,
  List,
  RotateCcw,
  X,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'

export const Route = createFileRoute('/trash')({
  component: TrashPage,
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

function TrashPage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<Id<'users'> | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [restoreConfirmation, setRestoreConfirmation] = useState<{
    type: 'file' | 'folder'
    id: Id<'files'> | Id<'folders'>
    name: string
  } | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'file' | 'folder'
    id: Id<'files'> | Id<'folders'>
    name: string
  } | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [emptyTrashConfirmation, setEmptyTrashConfirmation] = useState(false)
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false)
  // New button state
  const [showNewDropdown, setShowNewDropdown] = useState(false)
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
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

  // Get trashed files
  const trashedFiles = useQuery(
    api.files.getTrashedFiles,
    userId ? { ownerId: userId } : 'skip'
  )

  // Get trashed folders
  const trashedFolders = useQuery(
    api.folders.getTrashedFolders,
    userId ? { ownerId: userId } : 'skip'
  )

  // Get storage info
  const storageInfo = useQuery(
    api.users.getStorageInfo,
    userId ? { userId } : 'skip'
  )

  // Restore mutations
  const restoreFileMutation = useMutation(api.files.restoreFile)
  const restoreFolderMutation = useMutation(api.folders.restoreFolder)

  // Permanent delete mutations
  const permanentDeleteFileMutation = useMutation(api.files.permanentDeleteFile)
  const permanentDeleteFolderMutation = useMutation(api.folders.permanentDeleteFolder)

  // Empty trash mutation
  const emptyTrashMutation = useMutation(api.files.emptyTrash)

  // New button mutations (for uploads and folder creation)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const createFileMutation = useMutation(api.files.createFile)
  const createFolderMutation = useMutation(api.folders.createFolder)

  // Handle file upload (to root My Drive folder)
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

        // Step 3: Create file record in database (at root folder)
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
      // Navigate to My Drive to see the uploaded files
      navigate({ to: '/', search: {} })
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

  // Handle folder creation (at root My Drive folder)
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !userId) return

    setIsCreatingFolder(true)
    try {
      await createFolderMutation({
        name: newFolderName.trim(),
        parentId: undefined, // Create at root
        ownerId: userId,
      })
      setShowCreateFolderModal(false)
      setNewFolderName('')
      // Navigate to My Drive to see the new folder
      navigate({ to: '/', search: {} })
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert('Failed to create folder. Please try again.')
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleRestoreRequest = (type: 'file' | 'folder', id: Id<'files'> | Id<'folders'>, name: string) => {
    setRestoreConfirmation({ type, id, name })
  }

  const handleConfirmRestore = async () => {
    if (!restoreConfirmation) return

    setIsRestoring(true)
    try {
      if (restoreConfirmation.type === 'folder') {
        await restoreFolderMutation({ folderId: restoreConfirmation.id as Id<'folders'> })
      } else {
        await restoreFileMutation({ fileId: restoreConfirmation.id as Id<'files'> })
      }
      setRestoreConfirmation(null)
    } catch (error) {
      console.error(`Failed to restore ${restoreConfirmation.type}:`, error)
      alert(`Failed to restore ${restoreConfirmation.type}. Please try again.`)
    } finally {
      setIsRestoring(false)
    }
  }

  const handleCancelRestore = () => {
    setRestoreConfirmation(null)
  }

  const handleDeleteRequest = (type: 'file' | 'folder', id: Id<'files'> | Id<'folders'>, name: string) => {
    setDeleteConfirmation({ type, id, name })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return

    setIsDeleting(true)
    try {
      if (deleteConfirmation.type === 'folder') {
        await permanentDeleteFolderMutation({ folderId: deleteConfirmation.id as Id<'folders'> })
      } else {
        await permanentDeleteFileMutation({ fileId: deleteConfirmation.id as Id<'files'> })
      }
      setDeleteConfirmation(null)
    } catch (error) {
      console.error(`Failed to permanently delete ${deleteConfirmation.type}:`, error)
      alert(`Failed to delete ${deleteConfirmation.type}. Please try again.`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmation(null)
  }

  const handleEmptyTrash = async () => {
    if (!userId) return

    setIsEmptyingTrash(true)
    try {
      await emptyTrashMutation({ ownerId: userId })
      setEmptyTrashConfirmation(false)
    } catch (error) {
      console.error('Failed to empty trash:', error)
      alert('Failed to empty trash. Please try again.')
    } finally {
      setIsEmptyingTrash(false)
    }
  }

  const storageUsed = storageInfo?.used ?? 0
  const storageLimit = storageInfo?.limit ?? (10 * 1024 * 1024 * 1024)
  const storagePercentage = storageInfo?.percentage ?? 0

  const foldersList = trashedFolders ?? []
  const filesList = trashedFiles ?? []
  const totalItems = foldersList.length + filesList.length

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

        {/* Search Bar (disabled on trash page) */}
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
                      setShowCreateFolderModal(true)
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
              active={true}
            />
          </nav>

          {/* Storage Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <NavItem
              icon={<Cloud className="w-5 h-5" />}
              label="Storage"
              onClick={() => navigate({ to: '/storage' })}
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
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto" data-testid="trash-view">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-3 px-2 py-1">
                <Trash2 className="w-6 h-6 text-gray-700" />
                <h1 className="text-2xl font-semibold text-gray-800">Trash</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Empty Trash Button */}
              {totalItems > 0 && (
                <button
                  onClick={() => setEmptyTrashConfirmation(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  data-testid="empty-trash-button"
                >
                  <Trash2 className="w-4 h-4" />
                  Empty Trash
                </button>
              )}
              {/* View Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 border-r border-gray-300 transition-colors ${
                    viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                  aria-label="Grid view"
                  data-testid="grid-view-button"
                >
                  <LayoutGrid className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                  aria-label="List view"
                  data-testid="list-view-button"
                >
                  <List className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-amber-800">
                  Items in trash will be permanently deleted after 30 days.
                </p>
              </div>
            </div>
          </div>

          {/* Trash Content */}
          <div className={viewMode === 'grid'
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            : "flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white"
          }>
            {/* List view header */}
            {viewMode === 'list' && totalItems > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
                <span className="w-5"></span>
                <span className="flex-1">Name</span>
                <span className="w-24">Type</span>
                <span className="w-20 text-right">Size</span>
                <span className="w-20 text-center">Actions</span>
              </div>
            )}

            {/* Folders */}
            {foldersList.map((folder) => (
              <TrashFolderCard
                key={folder._id}
                name={folder.name}
                viewMode={viewMode}
                onRestore={() => handleRestoreRequest('folder', folder._id, folder.name)}
                onDelete={() => handleDeleteRequest('folder', folder._id, folder.name)}
              />
            ))}

            {/* Files */}
            {filesList.map((file) => (
              <TrashFileCard
                key={file._id}
                name={file.name}
                type={file.type as FileTypeValue}
                size={file.size}
                viewMode={viewMode}
                onRestore={() => handleRestoreRequest('file', file._id, file.name)}
                onDelete={() => handleDeleteRequest('file', file._id, file.name)}
              />
            ))}

            {/* Empty state */}
            {trashedFiles !== undefined && trashedFolders !== undefined && totalItems === 0 && userId && (
              <div className={`${viewMode === 'list' ? '' : 'col-span-full'} flex flex-col items-center justify-center py-16 text-gray-500`}>
                <Trash2 className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Trash is empty</p>
                <p className="text-sm">Items you delete will appear here</p>
              </div>
            )}

            {/* Loading state */}
            {!userId && (
              <div className={`${viewMode === 'list' ? '' : 'col-span-full'} flex flex-col items-center justify-center py-16 text-gray-500`}>
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm">Loading...</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Restore Confirmation Modal */}
      {restoreConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Restore {restoreConfirmation.type}?
              </h2>
              <button
                onClick={handleCancelRestore}
                className="p-1 hover:bg-gray-100 rounded-full"
                disabled={isRestoring}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to restore{' '}
              <span className="font-medium text-gray-800">"{restoreConfirmation.name}"</span>?
              {restoreConfirmation.type === 'folder' && (
                <span className="block mt-2 text-sm text-gray-500">
                  This will also restore all files and subfolders inside it.
                </span>
              )}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelRestore}
                disabled={isRestoring}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRestoring ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Permanently delete {deleteConfirmation.type}?
              </h2>
              <button
                onClick={handleCancelDelete}
                className="p-1 hover:bg-gray-100 rounded-full"
                disabled={isDeleting}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              <span className="font-medium text-gray-800">"{deleteConfirmation.name}"</span>{' '}
              will be permanently deleted.
              <span className="block mt-2 text-sm text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {emptyTrashConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Empty trash?
              </h2>
              <button
                onClick={() => setEmptyTrashConfirmation(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
                disabled={isEmptyingTrash}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              All {totalItems} item{totalItems !== 1 ? 's' : ''} in the trash will be permanently deleted.
              <span className="block mt-2 text-sm text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEmptyTrashConfirmation(false)}
                disabled={isEmptyingTrash}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={isEmptyingTrash}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEmptyingTrash ? 'Emptying...' : 'Empty Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

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

function TrashFolderCard({
  name,
  viewMode,
  onRestore,
  onDelete,
}: {
  name: string
  viewMode: 'grid' | 'list'
  onRestore: () => void
  onDelete: () => void
}) {
  if (viewMode === 'list') {
    return (
      <div
        className="group flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors"
        data-testid="trash-folder-card"
      >
        <FolderOpen className="w-5 h-5 text-blue-500 shrink-0" />
        <p className="text-sm text-gray-700 truncate flex-1" title={name}>{name}</p>
        <span className="text-xs text-gray-400 w-24 shrink-0">Folder</span>
        <span className="text-xs text-gray-400 w-20 text-right shrink-0">-</span>
        <div className="flex items-center gap-1 w-20 justify-center shrink-0">
          <button
            onClick={onRestore}
            className="p-1.5 hover:bg-blue-100 rounded transition-colors"
            title="Restore"
          >
            <RotateCcw className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-100 rounded transition-colors"
            title="Delete forever"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group relative flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 shadow-sm aspect-square"
      data-testid="trash-folder-card"
    >
      {/* Action buttons - appears on hover */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onRestore}
          className="p-1.5 bg-white border border-gray-200 rounded-md hover:bg-blue-50 transition-all shadow-sm"
          title="Restore"
        >
          <RotateCcw className="w-4 h-4 text-blue-600" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 bg-white border border-gray-200 rounded-md hover:bg-red-50 transition-all shadow-sm"
          title="Delete forever"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
      <FolderOpen className="w-12 h-12 text-blue-500 mb-2" />
      <p className="text-sm font-medium text-gray-700 text-center w-full truncate" title={name}>{name}</p>
    </div>
  )
}

function TrashFileCard({
  name,
  type,
  size,
  viewMode,
  onRestore,
  onDelete,
}: {
  name: string
  type: FileTypeValue
  size?: number
  viewMode: 'grid' | 'list'
  onRestore: () => void
  onDelete: () => void
}) {
  if (viewMode === 'list') {
    return (
      <div
        className="group flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors"
        data-testid="trash-file-card"
      >
        {getFileIcon(type, 'small')}
        <p className="text-sm text-gray-700 truncate flex-1" title={name}>{name}</p>
        <FileBadge type={type} className="w-24 shrink-0" />
        {size !== undefined && (
          <span className="text-xs text-gray-400 w-20 text-right shrink-0">{formatBytes(size)}</span>
        )}
        <div className="flex items-center gap-1 w-20 justify-center shrink-0">
          <button
            onClick={onRestore}
            className="p-1.5 hover:bg-blue-100 rounded transition-colors"
            title="Restore"
          >
            <RotateCcw className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-100 rounded transition-colors"
            title="Delete forever"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group relative flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 shadow-sm aspect-square"
      data-testid="trash-file-card"
    >
      {/* Action buttons - appears on hover */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onRestore}
          className="p-1.5 bg-white border border-gray-200 rounded-md hover:bg-blue-50 transition-all shadow-sm"
          title="Restore"
        >
          <RotateCcw className="w-4 h-4 text-blue-600" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 bg-white border border-gray-200 rounded-md hover:bg-red-50 transition-all shadow-sm"
          title="Delete forever"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
      {getFileIcon(type)}
      <p className="text-sm font-medium text-gray-700 text-center w-full truncate" title={name}>
        {name}
      </p>
      <FileBadge type={type} className="absolute bottom-2 right-2" />
    </div>
  )
}
