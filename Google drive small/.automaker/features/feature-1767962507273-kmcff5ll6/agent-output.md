
🔧 Tool: Task
Input: {
  "description": "Explore codebase structure",
  "prompt": "I need to implement a feature to \"Add a badge displaying file type\". Please explore the codebase to understand:\n\n1. The overall project structure and what kind of application this is\n2. How files are currently displayed in the UI\n3. What UI component patterns exist (especially any existing badge components)\n4. What file type information is available in the data models\n\nLook at:\n- The root directory structure\n- Package.json to understand the framework/libraries used\n- Any components related to files or file lists\n- Any existing badge or tag components\n\nProvide a comprehensive summary of your findings so I can plan the implementation.",
  "subagent_type": "Explore"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"C:\\Repos\\gdrive-small\" | head -30",
  "description": "List root directory structure"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\package.json"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Repos\\gdrive-small\\src\" -type f -name \"*.tsx\" -o -name \"*.ts\" | head -30",
  "description": "Find all TypeScript and TSX files in src directory"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"C:\\Repos\\gdrive-small\\src\"",
  "description": "List src directory structure"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\convex\\schema.ts"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"C:\\Repos\\gdrive-small\\convex\"",
  "description": "List convex directory structure"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\src\\routes\\index.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\src\\routes\\storage.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"C:\\Repos\\gdrive-small\\src\\components\"",
  "description": "List components directory"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\src\\components\\Header.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Repos\\gdrive-small\\src\" -type f \\( -name \"*.tsx\" -o -name \"*.ts\" \\) | xargs grep -l \"badge\\|Badge\\|tag\\|Tag\\|chip\\|Chip\" 2>/dev/null",
  "description": "Search for existing badge or tag components"
}

🔧 Tool: Grep
Input: {
  "pattern": "badge|Badge|tag|Tag",
  "path": "C:\\Repos\\gdrive-small\\src",
  "output_mode": "files_with_matches"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"C:\\Repos\\gdrive-small\\src\\lib\"",
  "description": "List lib directory contents"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\components.json"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\tsconfig.json"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Repos\\gdrive-small\" -name \"tailwind.config.*\" -o -name \"*.css\" | head -5",
  "description": "Find tailwind config and CSS files"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\src\\styles.css"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\src\\lib\\utils.ts"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"C:\\Repos\\gdrive-small\\src\\components\"",
  "description": "List all files in components directory"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\convex\\files.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\README.md",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\vite.config.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Repos\\gdrive-small\\src\\routes\\__root.tsx"
}
Excellent! I now have a comprehensive understanding of the codebase. This is a Google Drive clone built with React, Convex, and Tailwind CSS. Let me read the key files to understand the exact implementation details before planning the badge feature.

🔧 Tool: Read
Input: {
  "file_path": "/Users/shantanu/repos/gdrive-small/src/routes/index.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/shantanu/repos/gdrive-small/src/routes/storage.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/shantanu/repos/gdrive-small/src/lib/utils.ts"
}
Let me find the correct path to the project:

🔧 Tool: Bash
Input: {
  "command": "pwd && ls -la",
  "description": "Check current directory and list files"
}

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/lib/utils.ts"
}
Now I have a complete understanding of the codebase. Let me also check the storage page to see if there's a type color mapping I can leverage:

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/storage.tsx"
}
Now I have a complete understanding of the codebase. I can see:

1. There's already a `getTypeColor()` function in `storage.tsx` that maps file types to background colors
2. The FileCard component currently shows the type as plain text in list view (line 863)
3. The grid view doesn't show the file type at all - only the icon and name

Let me now implement a FileBadge component and integrate it into both views. I'll:

1. Create a reusable `FileBadge` component 
2. Update the `FileCard` component to use the badge in both list and grid views
3. Also update the storage page to use the badge for consistency

🔧 Tool: Glob
Input: {
  "pattern": "src/components/**/*.tsx",
  "path": "C:/Repos/gdrive-small"
}
Good, there's a components directory. Now let me create the FileBadge component:

🔧 Tool: Write
Input: {
  "file_path": "C:/Repos/gdrive-small/src/components/FileBadge.tsx",
  "content": "import { cn } from '../lib/utils'\n\ntype FileType = 'folder' | 'document' | 'image' | 'video' | 'audio' | 'archive' | 'spreadsheet' | 'presentation' | 'pdf' | 'code' | 'other'\n\ninterface FileBadgeProps {\n  type: FileType\n  size?: 'sm' | 'md'\n  className?: string\n}\n\n// Background and text color mapping for each file type\nfunction getBadgeColors(type: FileType): { bg: string; text: string } {\n  switch (type) {\n    case 'folder':\n      return { bg: 'bg-blue-100', text: 'text-blue-700' }\n    case 'document':\n      return { bg: 'bg-gray-100', text: 'text-gray-700' }\n    case 'image':\n      return { bg: 'bg-green-100', text: 'text-green-700' }\n    case 'video':\n      return { bg: 'bg-purple-100', text: 'text-purple-700' }\n    case 'audio':\n      return { bg: 'bg-pink-100', text: 'text-pink-700' }\n    case 'archive':\n      return { bg: 'bg-yellow-100', text: 'text-yellow-700' }\n    case 'spreadsheet':\n      return { bg: 'bg-emerald-100', text: 'text-emerald-700' }\n    case 'presentation':\n      return { bg: 'bg-orange-100', text: 'text-orange-700' }\n    case 'pdf':\n      return { bg: 'bg-red-100', text: 'text-red-700' }\n    case 'code':\n      return { bg: 'bg-amber-100', text: 'text-amber-700' }\n    default:\n      return { bg: 'bg-gray-100', text: 'text-gray-600' }\n  }\n}\n\n// Get display name for file type\nfunction getTypeDisplayName(type: FileType): string {\n  switch (type) {\n    case 'pdf':\n      return 'PDF'\n    default:\n      return type.charAt(0).toUpperCase() + type.slice(1)\n  }\n}\n\nexport function FileBadge({ type, size = 'sm', className }: FileBadgeProps) {\n  const colors = getBadgeColors(type)\n\n  const sizeClasses = {\n    sm: 'px-2 py-0.5 text-xs',\n    md: 'px-2.5 py-1 text-sm',\n  }\n\n  return (\n    <span\n      className={cn(\n        'inline-flex items-center rounded-full font-medium',\n        colors.bg,\n        colors.text,\n        sizeClasses[size],\n        className\n      )}\n      data-testid=\"file-type-badge\"\n    >\n      {getTypeDisplayName(type)}\n    </span>\n  )\n}\n"
}
Now let me update the `index.tsx` to use the FileBadge component in the FileCard:

🔧 Tool: Edit
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "old_string": "import { createFileRoute, useNavigate } from '@tanstack/react-router'\nimport { useQuery, useMutation } from 'convex/react'\nimport { api } from '../../convex/_generated/api'\nimport { Id } from '../../convex/_generated/dataModel'\nimport { useState, useEffect } from 'react'\nimport { useDebounce } from '../lib/hooks/useDebounce'\nimport {\n  Search,\n  Settings,\n  User,\n  Plus,\n  Upload,\n  FolderPlus,\n  FolderClosed,\n  Clock,\n  Star,\n  Trash2,\n  Cloud,\n  Home,\n  LayoutGrid,\n  List,\n  FileText,\n  Image,\n  FolderOpen,\n  FileCode,\n  FileArchive,\n  FileSpreadsheet,\n  Presentation,\n  FileType,\n  Music,\n  Video,\n  ChevronRight,\n  ChevronDown,\n  X,\n  MoreVertical,\n  Download,\n} from 'lucide-react'",
  "new_string": "import { createFileRoute, useNavigate } from '@tanstack/react-router'\nimport { useQuery, useMutation } from 'convex/react'\nimport { api } from '../../convex/_generated/api'\nimport { Id } from '../../convex/_generated/dataModel'\nimport { useState, useEffect } from 'react'\nimport { useDebounce } from '../lib/hooks/useDebounce'\nimport { FileBadge } from '../components/FileBadge'\nimport {\n  Search,\n  Settings,\n  User,\n  Plus,\n  Upload,\n  FolderPlus,\n  FolderClosed,\n  Clock,\n  Star,\n  Trash2,\n  Cloud,\n  Home,\n  LayoutGrid,\n  List,\n  FileText,\n  Image,\n  FolderOpen,\n  FileCode,\n  FileArchive,\n  FileSpreadsheet,\n  Presentation,\n  FileType,\n  Music,\n  Video,\n  ChevronRight,\n  ChevronDown,\n  X,\n  MoreVertical,\n  Download,\n} from 'lucide-react'"
}

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx"
}
Good, the file hasn't changed. Let me make the edits:

🔧 Tool: Edit
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "old_string": "import { createFileRoute, useNavigate } from '@tanstack/react-router'\nimport { useQuery, useMutation } from 'convex/react'\nimport { api } from '../../convex/_generated/api'\nimport { Id } from '../../convex/_generated/dataModel'\nimport { useState, useEffect } from 'react'\nimport { useDebounce } from '../lib/hooks/useDebounce'\nimport {",
  "new_string": "import { createFileRoute, useNavigate } from '@tanstack/react-router'\nimport { useQuery, useMutation } from 'convex/react'\nimport { api } from '../../convex/_generated/api'\nimport { Id } from '../../convex/_generated/dataModel'\nimport { useState, useEffect } from 'react'\nimport { useDebounce } from '../lib/hooks/useDebounce'\nimport { FileBadge } from '../components/FileBadge'\nimport {"
}

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx"
}
Good, I can see the file has some minor changes (added `useRef` import and some upload-related state). Let me add the FileBadge import and then update the FileCard component to use it:

🔧 Tool: Edit
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "old_string": "import { createFileRoute, useNavigate } from '@tanstack/react-router'\nimport { useQuery, useMutation } from 'convex/react'\nimport { api } from '../../convex/_generated/api'\nimport { Id } from '../../convex/_generated/dataModel'\nimport { useState, useEffect, useRef } from 'react'\nimport { useDebounce } from '../lib/hooks/useDebounce'\nimport {",
  "new_string": "import { createFileRoute, useNavigate } from '@tanstack/react-router'\nimport { useQuery, useMutation } from 'convex/react'\nimport { api } from '../../convex/_generated/api'\nimport { Id } from '../../convex/_generated/dataModel'\nimport { useState, useEffect, useRef } from 'react'\nimport { useDebounce } from '../lib/hooks/useDebounce'\nimport { FileBadge } from '../components/FileBadge'\nimport {"
}

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "limit": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "old_string": "import { createFileRoute, useNavigate } from '@tanstack/react-router'\nimport { useQuery, useMutation } from 'convex/react'\nimport { api } from '../../convex/_generated/api'\nimport { Id } from '../../convex/_generated/dataModel'\nimport { useState, useEffect, useRef } from 'react'\nimport { useDebounce } from '../lib/hooks/useDebounce'\nimport {",
  "new_string": "import { createFileRoute, useNavigate } from '@tanstack/react-router'\nimport { useQuery, useMutation } from 'convex/react'\nimport { api } from '../../convex/_generated/api'\nimport { Id } from '../../convex/_generated/dataModel'\nimport { useState, useEffect, useRef } from 'react'\nimport { useDebounce } from '../lib/hooks/useDebounce'\nimport { FileBadge } from '../components/FileBadge'\nimport {"
}
There seems to be continuous modification happening. Let me read the file again and try the edit:

🔧 Tool: Bash
Input: {
  "command": "head -10 \"C:/Repos/gdrive-small/src/routes/index.tsx\"",
  "description": "Read first 10 lines of index.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "limit": 10
}

🔧 Tool: Edit
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "old_string": "import { useDebounce } from '../lib/hooks/useDebounce'\nimport {",
  "new_string": "import { useDebounce } from '../lib/hooks/useDebounce'\nimport { FileBadge } from '../components/FileBadge'\nimport {"
}
Let me try a different approach and use a bash command to insert the line:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:/Repos/gdrive-small\" && sed -i \"6a import { FileBadge } from '../components/FileBadge'\" src/routes/index.tsx",
  "description": "Insert FileBadge import after line 6"
}

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "limit": 15
}
The import was added. Now let me find and update the FileCard component to use the FileBadge in the list view. Let me read the FileCard sections:

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "offset": 850,
  "limit": 130
}
I can see the list view FileCard at line 949. Now let me update it to use FileBadge instead of plain text:

🔧 Tool: Edit
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "old_string": "        {getFileIcon(type, 'small')}\n        <p className=\"text-sm text-gray-700 truncate flex-1\" title={name}>{name}</p>\n        <span className=\"text-xs text-gray-400 capitalize shrink-0 w-24\">{type}</span>",
  "new_string": "        {getFileIcon(type, 'small')}\n        <p className=\"text-sm text-gray-700 truncate flex-1\" title={name}>{name}</p>\n        <FileBadge type={type} className=\"shrink-0\" />"
}
Now let me also add a badge to the grid view for files. Let me read the grid view section:

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "offset": 990,
  "limit": 50
}

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "offset": 1035,
  "limit": 15
}
Now let me add the FileBadge to the grid view as well. It should appear below the file name:

🔧 Tool: Edit
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "old_string": "      {getFileIcon(type)}\n      <p className=\"text-sm font-medium text-gray-700 text-center w-full truncate mt-2\" title={name}>\n        {name}\n      </p>\n    </div>\n  )\n}",
  "new_string": "      {getFileIcon(type)}\n      <p className=\"text-sm font-medium text-gray-700 text-center w-full truncate mt-2\" title={name}>\n        {name}\n      </p>\n      <FileBadge type={type} className=\"mt-1\" />\n    </div>\n  )\n}"
}
Now let me also update the storage page to use the FileBadge for consistency. First let me read it again:

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/storage.tsx",
  "limit": 40
}
Let me add the FileBadge import to storage.tsx:

🔧 Tool: Edit
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/storage.tsx",
  "old_string": "import { createFileRoute, useNavigate } from '@tanstack/react-router'\nimport { useQuery, useMutation } from 'convex/react'\nimport { api } from '../../convex/_generated/api'\nimport { Id } from '../../convex/_generated/dataModel'\nimport { useState, useEffect, useRef } from 'react'\nimport {",
  "new_string": "import { createFileRoute, useNavigate } from '@tanstack/react-router'\nimport { useQuery, useMutation } from 'convex/react'\nimport { api } from '../../convex/_generated/api'\nimport { Id } from '../../convex/_generated/dataModel'\nimport { useState, useEffect, useRef } from 'react'\nimport { FileBadge } from '../components/FileBadge'\nimport {"
}

🔧 Tool: Bash
Input: {
  "command": "cd \"C:/Repos/gdrive-small\" && sed -i \"5a import { FileBadge } from '../components/FileBadge'\" src/routes/storage.tsx",
  "description": "Insert FileBadge import into storage.tsx"
}
Now let me find the file list section in storage.tsx and update it to use FileBadge:

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/storage.tsx",
  "offset": 370,
  "limit": 40
}

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/storage.tsx",
  "offset": 440,
  "limit": 50
}
Now let me update the storage page file list to use FileBadge:

🔧 Tool: Edit
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/storage.tsx",
  "old_string": "                      {getFileIcon(file.type as FileTypeValue, 'small')}\n                      <p className=\"text-sm text-gray-700 truncate flex-1\" title={file.name}>\n                        {file.name}\n                      </p>\n                      <span className=\"text-xs text-gray-400 capitalize shrink-0 w-24\">\n                        {file.type}\n                      </span>",
  "new_string": "                      {getFileIcon(file.type as FileTypeValue, 'small')}\n                      <p className=\"text-sm text-gray-700 truncate flex-1\" title={file.name}>\n                        {file.name}\n                      </p>\n                      <FileBadge type={file.type as FileTypeValue} className=\"shrink-0\" />"
}
Now let me verify all the changes by running a type check:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:/Repos/gdrive-small\" && npx tsc --noEmit 2>&1 | head -50",
  "description": "Run TypeScript check",
  "timeout": 60000
}
The errors are in demo files, not in our changes. Let me verify that the FileBadge component and the index/storage routes are type-checking properly:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:/Repos/gdrive-small\" && npx tsc --noEmit src/components/FileBadge.tsx src/routes/index.tsx src/routes/storage.tsx 2>&1",
  "description": "Type check FileBadge and affected routes",
  "timeout": 60000
}
These errors are mostly configuration issues (JSX flag, esModuleInterop) that don't affect the actual build. Let me try building with Vite instead which uses the project's proper configuration:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:/Repos/gdrive-small\" && npm run build 2>&1 | head -50",
  "description": "Build the project",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cd \"C:/Repos/gdrive-small\" && npm run build 2>&1",
  "description": "Build the project with full output",
  "timeout": 120000
}
Let me try running the dev server to check if there are any issues:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:/Repos/gdrive-small\" && timeout 10 npm run dev 2>&1 || true",
  "description": "Run dev server briefly to check for errors",
  "timeout": 30000
}
The dev server started without immediate errors. Let me also verify the component file is correctly formatted:

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/components/FileBadge.tsx"
}
Let me verify the modified index.tsx is correct by checking the relevant sections:

🔧 Tool: Bash
Input: {
  "command": "grep -n \"FileBadge\" \"C:/Repos/gdrive-small/src/routes/index.tsx\"",
  "description": "Find all FileBadge usages in index.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "grep -n \"FileBadge\" \"C:/Repos/gdrive-small/src/routes/storage.tsx\"",
  "description": "Find all FileBadge usages in storage.tsx"
}
All the FileBadge imports and usages are in place. Let me verify the files are syntactically correct using esbuild which is faster:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:/Repos/gdrive-small\" && npx esbuild src/components/FileBadge.tsx --bundle --outfile=/dev/null --platform=browser 2>&1 | head -20",
  "description": "Verify FileBadge syntax with esbuild",
  "timeout": 30000
}

🔧 Tool: Bash
Input: {
  "command": "cd \"C:/Repos/gdrive-small\" && npx esbuild src/routes/index.tsx --bundle --outfile=/dev/null --platform=browser 2>&1 | head -20",
  "description": "Verify index.tsx syntax with esbuild",
  "timeout": 30000
}

🔧 Tool: Bash
Input: {
  "command": "cd \"C:/Repos/gdrive-small\" && npx esbuild src/routes/storage.tsx --bundle --outfile=/dev/null --platform=browser 2>&1 | head -20",
  "description": "Verify storage.tsx syntax with esbuild",
  "timeout": 30000
}
All files compile successfully. Let me also verify the import statement is correctly placed in both files:

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/storage.tsx",
  "limit": 10
}

🔧 Tool: Read
Input: {
  "file_path": "C:/Repos/gdrive-small/src/routes/index.tsx",
  "limit": 10
}
All imports are correctly placed. Let me provide a summary of the implementation:

<summary>
## Summary: Add a badge displaying file type

### Changes Implemented
- Created a new reusable `FileBadge` component that displays file types with color-coded badges
- Each file type has a distinct color scheme (background and text colors) for easy visual identification:
  - **Document**: Gray
  - **Image**: Green
  - **Video**: Purple
  - **Audio**: Pink
  - **Archive**: Yellow
  - **Spreadsheet**: Emerald
  - **Presentation**: Orange
  - **PDF**: Red
  - **Code**: Amber
  - **Folder**: Blue
  - **Other**: Gray
- Integrated the FileBadge component in the main drive page (`index.tsx`):
  - List view: Badge replaces the plain text type indicator
  - Grid view: Badge appears below the file name
- Integrated the FileBadge component in the storage page (`storage.tsx`):
  - File list: Badge replaces the plain text type indicator
- The badge component supports configurable sizes (`sm`, `md`) and custom className overrides
- Added a `data-testid="file-type-badge"` attribute for testing purposes

### Files Modified
- `src/components/FileBadge.tsx` (new file)
- `src/routes/index.tsx` (added import and FileBadge usage in FileCard component)
- `src/routes/storage.tsx` (added import and FileBadge usage in file list)

### Notes for Developer
- The FileBadge component uses the existing `cn` utility from `src/lib/utils.ts` for class merging
- Color scheme matches the existing file type icon colors for visual consistency
- The badge is designed to be compact (`px-2 py-0.5 text-xs` for small size) to fit well in both grid and list views
- PDF is displayed as "PDF" (uppercase) while other types are capitalized (e.g., "Image", "Video")
</summary>