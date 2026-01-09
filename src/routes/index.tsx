import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '../lib/hooks/useDebounce'
import { FileBadge } from '../components/FileBadge'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
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
  Home,
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
  ChevronDown,
  X,
  MoreVertical,
  Download,
  Pencil,
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

function getFileIcon(type: FileType, size: 'large' | 'small' = 'large') {
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

function DriveClone() {
  const { folderId } = Route.useSearch()
  const navigate = useNavigate()
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [userId, setUserId] = useState<Id<'users'> | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showNewDropdown, setShowNewDropdown] = useState(false)
  const [activeItemMenu, setActiveItemMenu] = useState<string | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'file' | 'folder'
    id: Id<'files'> | Id<'folders'>
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Rename state
  const [renameTarget, setRenameTarget] = useState<{
    type: 'file' | 'folder'
    id: Id<'files'> | Id<'folders'>
    currentName: string
  } | null>(null)
  const [newName, setNewName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  // Track if action was triggered from sidebar New button (for redirect behavior)
  const [isFromSidebarNew, setIsFromSidebarNew] = useState(false)

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

  // Search queries (using debounced search term to reduce API calls)
  const isSearching = debouncedSearchTerm.trim().length > 0

  const searchedFiles = useQuery(
    api.files.searchFiles,
    userId && isSearching ? { ownerId: userId, searchTerm: debouncedSearchTerm } : 'skip'
  )

  const searchedFolders = useQuery(
    api.folders.searchFolders,
    userId && isSearching ? { ownerId: userId, searchTerm: debouncedSearchTerm } : 'skip'
  )

  // Create folder mutation
  const createFolderMutation = useMutation(api.folders.createFolder)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  // Soft delete folder mutation
  const softDeleteFolderMutation = useMutation(api.folders.softDeleteFolder)
  // Soft delete file mutation
  const softDeleteFileMutation = useMutation(api.files.softDeleteFile)
  // Upload mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const createFileMutation = useMutation(api.files.createFile)
  // Rename mutations
  const renameFolderMutation = useMutation(api.folders.renameFolder)
  const renameFileMutation = useMutation(api.files.renameFile)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !userId) return

    const shouldRedirectToMyDrive = isFromSidebarNew
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

        // Step 3: Create file record in database
        await createFileMutation({
          name: file.name,
          mimeType: file.type,
          size: file.size,
          storageId: storageId as Id<'_storage'>,
          folderId: currentFolderId,
          ownerId: userId,
        })
      }

      setUploadProgress('')

      // Redirect to My Drive if triggered from sidebar New button
      if (shouldRedirectToMyDrive) {
        navigate({ to: '/', search: {} })
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress('')
      setIsFromSidebarNew(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !userId) return
    const shouldRedirectToMyDrive = isFromSidebarNew
    setIsCreatingFolder(true)
    try {
      await createFolderMutation({
        name: newFolderName.trim(),
        parentId: currentFolderId,
        ownerId: userId,
      })
      setShowCreateFolderModal(false)
      setNewFolderName('')

      // Redirect to My Drive if triggered from sidebar New button
      if (shouldRedirectToMyDrive) {
        navigate({ to: '/', search: {} })
      }
    } finally {
      setIsCreatingFolder(false)
      setIsFromSidebarNew(false)
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

  const handleFolderDeleteRequest = (folderId: Id<'folders'>, folderName: string) => {
    setDeleteConfirmation({ type: 'folder', id: folderId, name: folderName })
  }

  const handleFileDeleteRequest = (fileId: Id<'files'>, fileName: string) => {
    setDeleteConfirmation({ type: 'file', id: fileId, name: fileName })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return

    setIsDeleting(true)
    try {
      if (deleteConfirmation.type === 'folder') {
        await softDeleteFolderMutation({ folderId: deleteConfirmation.id as Id<'folders'> })
      } else {
        await softDeleteFileMutation({ fileId: deleteConfirmation.id as Id<'files'> })
      }
      setDeleteConfirmation(null)
    } catch (error) {
      console.error(`Failed to delete ${deleteConfirmation.type}:`, error)
      alert(`Failed to delete ${deleteConfirmation.type}. Please try again.`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmation(null)
  }

  // Rename handlers
  const handleRenameRequest = (type: 'file' | 'folder', id: Id<'files'> | Id<'folders'>, currentName: string) => {
    setRenameTarget({ type, id, currentName })
    setNewName(currentName)
  }

  const handleConfirmRename = async () => {
    if (!renameTarget || !newName.trim()) return

    setIsRenaming(true)
    try {
      if (renameTarget.type === 'folder') {
        await renameFolderMutation({ folderId: renameTarget.id as Id<'folders'>, newName: newName.trim() })
      } else {
        await renameFileMutation({ fileId: renameTarget.id as Id<'files'>, newName: newName.trim() })
      }
      setRenameTarget(null)
      setNewName('')
    } catch (error) {
      console.error(`Failed to rename ${renameTarget.type}:`, error)
      alert(`Failed to rename ${renameTarget.type}. Please try again.`)
    } finally {
      setIsRenaming(false)
    }
  }

  const handleCancelRename = () => {
    setRenameTarget(null)
    setNewName('')
  }

  const foldersList = isSearching ? (searchedFolders ?? []) : (folders ?? [])
  const filesList = isSearching ? (searchedFiles ?? []) : (files ?? [])
  const totalItems = foldersList.length + filesList.length
  const storageUsed = storageInfo?.used ?? 0
  const storageLimit = storageInfo?.limit ?? (10 * 1024 * 1024 * 1024)
  const storagePercentage = storageInfo?.percentage ?? 0
  const breadcrumbs = breadcrumbPath ?? []

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

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center bg-gray-100 rounded-full px-4 h-10 hover:bg-gray-200 hover:shadow-sm transition-all">
            <Search className="w-5 h-5 text-gray-500 mr-3 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="flex-1 bg-transparent border-none outline-none text-gray-700 text-sm placeholder-gray-500 min-w-0"
              data-testid="search-input"
            />
            <button
              onClick={() => setSearchTerm('')}
              className={`p-1 hover:bg-gray-300 rounded-full transition-colors shrink-0 ${searchTerm ? 'visible' : 'invisible'}`}
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
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
                      setIsFromSidebarNew(true)
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
                      setIsFromSidebarNew(true)
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
              active={!currentFolderId}
              onClick={() => handleBreadcrumbClick(undefined)}
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
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <main className={`flex-1 p-6 overflow-y-auto ${isSearching ? 'bg-amber-50' : 'bg-gray-50'}`} data-testid={isSearching ? 'search-results-view' : 'my-drive-view'}>
              {/* Search Results Header - shown when searching */}
              {isSearching && (
                <div className="mb-6 p-4 bg-amber-100 border border-amber-200 rounded-lg" data-testid="search-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-amber-700" />
                      <div>
                        <h2 className="text-lg font-semibold text-amber-900">Search Results</h2>
                        <p className="text-sm text-amber-700">
                          Found {totalItems} result{totalItems !== 1 ? 's' : ''} for "{searchTerm.trim()}"
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-amber-800 bg-amber-200 hover:bg-amber-300 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Clear search
                    </button>
                  </div>
                </div>
              )}

              {/* Page Header - shown when at root and not searching */}
              {!isSearching && !currentFolderId && (
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-3 px-2 py-1">
                      <Home className="w-6 h-6 text-gray-700" />
                      <h1 className="text-2xl font-semibold text-gray-800">My Drive</h1>
                    </div>
                  </div>
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
              )}

              {/* Breadcrumb and Toolbar - shown when inside a folder and not searching */}
              {!isSearching && currentFolderId && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleBreadcrumbClick(undefined)}
                    className="flex items-center gap-3 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                  >
                    <Home className="w-6 h-6 text-gray-700" />
                    <span className="text-2xl font-semibold text-gray-800">My Drive</span>
                  </button>

                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.id} className="flex items-center gap-1">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                      <button
                        onClick={() => handleBreadcrumbClick(crumb.id)}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          index === breadcrumbs.length - 1
                            ? 'text-2xl font-semibold text-gray-800'
                            : 'text-2xl font-semibold text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {crumb.name}
                      </button>
                    </div>
                  ))}
                </div>
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
              )}

              {/* File Grid/List Container */}
              <div className={viewMode === 'grid'
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                : "flex flex-col border border-gray-200 rounded-lg overflow-hidden"
              }>
                {/* List view header */}
                {viewMode === 'list' && (foldersList.length > 0 || filesList.length > 0) && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
                    <span className="w-5"></span>
                    <span className="flex-1">Name</span>
                    <span className="w-24">Type</span>
                    <span className="w-20 text-right">Size</span>
                    <span className="w-6"></span>
                  </div>
                )}

                {/* Folders */}
                {foldersList.map((folder) => (
                  <FolderCard
                    key={folder._id}
                    name={folder.name}
                    onClick={() => handleFolderClick(folder._id)}
                    isSearchResult={isSearching}
                    onDelete={() => handleFolderDeleteRequest(folder._id, folder.name)}
                    onRename={() => handleRenameRequest('folder', folder._id, folder.name)}
                    viewMode={viewMode}
                    isMenuOpen={activeItemMenu === `folder-${folder._id}`}
                    onMenuToggle={(isOpen) => setActiveItemMenu(isOpen ? `folder-${folder._id}` : null)}
                  />
                ))}

                {/* Files */}
                {filesList.map((file) => (
                  <FileCard
                    key={file._id}
                    name={file.name}
                    type={file.type}
                    size={file.size}
                    storageId={file.storageId}
                    isSearchResult={isSearching}
                    viewMode={viewMode}
                    onDelete={() => handleFileDeleteRequest(file._id, file.name)}
                    onRename={() => handleRenameRequest('file', file._id, file.name)}
                    isMenuOpen={activeItemMenu === `file-${file._id}`}
                    onMenuToggle={(isOpen) => setActiveItemMenu(isOpen ? `file-${file._id}` : null)}
                  />
                ))}

                {/* Empty state for search */}
                {isSearching && totalItems === 0 && searchedFiles !== undefined && searchedFolders !== undefined && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-amber-700" data-testid="no-search-results">
                    <Search className="w-16 h-16 mb-4 text-amber-300" />
                    <p className="text-lg font-medium">No results found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                )}

                {/* Empty state - only show when data has loaded AND is empty AND not searching */}
                {!isSearching && folders !== undefined && files !== undefined && totalItems === 0 && userId && (
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
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => setShowCreateFolderModal(true)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New folder</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
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
                  setIsFromSidebarNew(false)
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
                  setIsFromSidebarNew(false)
                }
              }}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateFolderModal(false)
                  setNewFolderName('')
                  setIsFromSidebarNew(false)
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Delete {deleteConfirmation.type}?
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
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-800">"{deleteConfirmation.name}"</span>?
              {deleteConfirmation.type === 'folder' && (
                <span className="block mt-2 text-sm text-gray-500">
                  This will also move all files and subfolders to trash.
                </span>
              )}
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
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Rename {renameTarget.type}
              </h2>
              <button
                onClick={handleCancelRename}
                className="p-1 hover:bg-gray-100 rounded-full"
                disabled={isRenaming}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={renameTarget.currentName}
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmRename()
                if (e.key === 'Escape') handleCancelRename()
              }}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelRename}
                disabled={isRenaming}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                disabled={!newName.trim() || newName.trim() === renameTarget.currentName || isRenaming}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRenaming ? 'Renaming...' : 'Rename'}
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
  onDelete,
  onRename,
  isSearchResult = false,
  viewMode = 'grid',
  isMenuOpen = false,
  onMenuToggle,
}: {
  name: string
  onClick: () => void
  onDelete: () => void
  onRename: () => void
  isSearchResult?: boolean
  viewMode?: 'grid' | 'list'
  isMenuOpen?: boolean
  onMenuToggle?: (isOpen: boolean) => void
}) {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMenuToggle?.(!isMenuOpen)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMenuToggle?.(false)
    onDelete()
  }

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMenuToggle?.(false)
    onRename()
  }

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className={`group relative flex items-center gap-3 px-4 py-2 border-b cursor-pointer transition-colors ${
          isSearchResult
            ? 'border-amber-200 bg-white hover:bg-amber-50'
            : 'border-gray-100 bg-white hover:bg-gray-50'
        }`}
        data-testid={isSearchResult ? 'search-result-folder' : 'folder-card'}
      >
        <FolderOpen className="w-5 h-5 text-blue-500 shrink-0" />
        <p className="text-sm text-gray-700 truncate flex-1" title={name}>{name}</p>
        <span className="text-xs text-gray-400 shrink-0">Folder</span>
        {/* More options button - appears on hover */}
        <div className="relative shrink-0">
          <button
            onClick={handleMenuClick}
            className={`p-1 rounded hover:bg-gray-200 transition-all ${isMenuOpen ? 'opacity-100 bg-gray-200' : 'opacity-0 group-hover:opacity-100'}`}
            title="More options"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {/* Dropdown menu */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => { e.stopPropagation(); onMenuToggle?.(false) }}
              />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                <button
                  onClick={handleRename}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors aspect-square ${
        isSearchResult
          ? 'border-amber-300 bg-white hover:bg-amber-50 shadow-sm'
          : 'border-gray-200 bg-white hover:bg-gray-50 shadow-sm'
      }`}
      data-testid={isSearchResult ? 'search-result-folder' : 'folder-card'}
    >
      {/* More options button - appears on hover */}
      <div className="absolute top-2 right-2">
        <button
          onClick={handleMenuClick}
          className={`p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-100 transition-all shadow-sm ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          title="More options"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>
        {/* Dropdown menu */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => { e.stopPropagation(); onMenuToggle?.(false) }}
            />
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
              <button
                onClick={handleRename}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                <span>Rename</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </>
        )}
      </div>
      <FolderOpen className="w-12 h-12 text-blue-500 mb-2" />
      <p className="text-sm font-medium text-gray-700 text-center w-full truncate" title={name}>{name}</p>
    </div>
  )
}

function FileCard({
  name,
  type,
  size,
  storageId,
  isSearchResult = false,
  viewMode = 'grid',
  onDelete,
  onRename,
  isMenuOpen = false,
  onMenuToggle,
}: {
  name: string
  type: FileType
  size?: number
  storageId?: Id<'_storage'>
  isSearchResult?: boolean
  viewMode?: 'grid' | 'list'
  onDelete: () => void
  onRename: () => void
  isMenuOpen?: boolean
  onMenuToggle?: (isOpen: boolean) => void
}) {
  // Query for download URL when storageId is available
  const downloadUrl = useQuery(
    api.files.getDownloadUrl,
    storageId ? { storageId } : 'skip'
  )

  // State for image thumbnail loading
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  // State for download in progress
  const [isDownloading, setIsDownloading] = useState(false)

  // Reset image states when downloadUrl changes
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [downloadUrl])

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMenuToggle?.(!isMenuOpen)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMenuToggle?.(false)
    onDelete()
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onMenuToggle?.(false)
    if (downloadUrl && !isDownloading) {
      setIsDownloading(true)
      try {
        // Fetch the file as a blob to avoid cross-origin redirect issues
        const response = await fetch(downloadUrl)
        const blob = await response.blob()

        // Create a blob URL and trigger download
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl)
      } catch (error) {
        console.error('Download failed:', error)
        // Fallback to direct navigation if fetch fails
        window.open(downloadUrl, '_blank')
      } finally {
        setIsDownloading(false)
      }
    }
  }

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMenuToggle?.(false)
    onRename()
  }

  if (viewMode === 'list') {
    return (
      <div
        className={`group relative flex items-center gap-3 px-4 py-2 border-b transition-colors ${
          isSearchResult
            ? 'border-amber-200 bg-white hover:bg-amber-50'
            : 'border-gray-100 bg-white hover:bg-gray-50'
        }`}
        data-testid={isSearchResult ? 'search-result-file' : 'file-card'}
      >
        {getFileIcon(type, 'small')}
        <p className="text-sm text-gray-700 truncate flex-1" title={name}>{name}</p>
        <FileBadge type={type} className="shrink-0" />
        {size !== undefined && (
          <span className="text-xs text-gray-400 shrink-0 w-20 text-right">{formatBytes(size)}</span>
        )}
        {/* More options button - appears on hover */}
        <div className="relative shrink-0">
          <button
            onClick={handleMenuClick}
            className={`p-1 rounded hover:bg-gray-200 transition-all ${isMenuOpen ? 'opacity-100 bg-gray-200' : 'opacity-0 group-hover:opacity-100'}`}
            title="More options"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {/* Dropdown menu */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => { e.stopPropagation(); onMenuToggle?.(false) }}
              />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                {downloadUrl && (
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className={`w-4 h-4 ${isDownloading ? 'animate-pulse' : ''}`} />
                    <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                  </button>
                )}
                <button
                  onClick={handleRename}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Check if this is an image with a valid preview
  const isImageWithPreview = type === 'image' && downloadUrl && !imageError

  return (
    <div
      className={`group relative flex flex-col items-center justify-center p-4 border rounded-lg aspect-square overflow-hidden ${
        isSearchResult
          ? 'border-amber-300 bg-white shadow-sm'
          : 'border-gray-200 bg-white hover:bg-gray-50 shadow-sm'
      }`}
      data-testid={isSearchResult ? 'search-result-file' : 'file-card'}
    >
      {/* Image thumbnail displayed like an icon (centered) or file icon */}
      {isImageWithPreview ? (
        <div className="w-12 h-12 rounded overflow-hidden flex items-center justify-center bg-gray-100">
          {/* Loading spinner while image is loading */}
          {!imageLoaded && (
            <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          )}
          <img
            src={downloadUrl}
            alt={name}
            className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        getFileIcon(type)
      )}

      {/* File name - centered for all files including images */}
      <p className="text-sm font-medium text-gray-700 text-center w-full truncate mt-2" title={name}>
        {name}
      </p>

      {/* More options button - appears on hover, overlayed on top */}
      <div className="absolute top-2 right-2 z-20">
        <button
          onClick={handleMenuClick}
          className={`p-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md hover:bg-white transition-all shadow-sm ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          title="More options"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>
        {/* Dropdown menu */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => { e.stopPropagation(); onMenuToggle?.(false) }}
            />
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 min-w-[140px]">
              {downloadUrl && (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className={`w-4 h-4 ${isDownloading ? 'animate-pulse' : ''}`} />
                  <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                </button>
              )}
              <button
                onClick={handleRename}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                <span>Rename</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* File type badge - positioned in bottom right corner */}
      <FileBadge type={type} className="absolute z-10 bottom-2 right-2" />
    </div>
  )
}