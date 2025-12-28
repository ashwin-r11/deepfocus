"use client"

import { useState, useEffect } from "react"
import { 
  FolderOpen, FileText, File, ChevronRight, ChevronLeft, 
  Search, X, Loader2, ExternalLink, Home, ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  iconLink?: string
  webViewLink?: string
  thumbnailLink?: string
  embedUrl?: string
}

interface DrivePanelProps {
  isExpanded?: boolean
  onToggle?: () => void
}

export function DrivePanel({ isExpanded = true, onToggle }: DrivePanelProps) {
  const [folders, setFolders] = useState<DriveFile[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string>("root")
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "My Drive" }
  ])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<DriveFile[]>([])
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null)
  const [viewMode, setViewMode] = useState<"browse" | "preview">("browse")

  useEffect(() => {
    if (isExpanded && viewMode === "browse" && !searchQuery) {
      fetchFiles(currentFolder)
    }
  }, [currentFolder, isExpanded, viewMode])

  const fetchFiles = async (folderId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/drive/files?folderId=${folderId}`)
      if (res.ok) {
        const data = await res.json()
        setFolders(data.folders || [])
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error("Error fetching files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/drive/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.files || [])
      }
    } catch (error) {
      console.error("Error searching files:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleFolderClick = (folder: DriveFile) => {
    setCurrentFolder(folder.id)
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }])
    setSearchQuery("")
    setSearchResults([])
  }

  const handleBreadcrumbClick = (index: number) => {
    const item = folderPath[index]
    setCurrentFolder(item.id)
    setFolderPath(prev => prev.slice(0, index + 1))
    setSearchQuery("")
    setSearchResults([])
  }

  const handleFileClick = async (file: DriveFile) => {
    // Get embed URL
    try {
      const res = await fetch(`/api/drive/file/${file.id}?action=embed`)
      if (res.ok) {
        const data = await res.json()
        setSelectedFile({ ...file, embedUrl: data.embedUrl })
        setViewMode("preview")
      }
    } catch (error) {
      console.error("Error getting file embed:", error)
      // Fallback to webViewLink
      window.open(file.webViewLink, "_blank")
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/vnd.google-apps.folder") {
      return <FolderOpen className="w-4 h-4 text-yellow-400" />
    }
    if (mimeType === "application/pdf") {
      return <FileText className="w-4 h-4 text-red-400" />
    }
    if (mimeType.startsWith("image/")) {
      return <File className="w-4 h-4 text-green-400" />
    }
    if (mimeType.includes("document") || mimeType.includes("word")) {
      return <FileText className="w-4 h-4 text-blue-400" />
    }
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
      return <FileText className="w-4 h-4 text-green-400" />
    }
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
      return <FileText className="w-4 h-4 text-orange-400" />
    }
    return <File className="w-4 h-4 text-neutral-400" />
  }

  if (!isExpanded) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-neutral-950 border-l border-neutral-900">
      {/* Header */}
      <div className="p-3 border-b border-neutral-900">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {viewMode === "preview" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setViewMode("browse")
                  setSelectedFile(null)
                }}
                className="text-neutral-400 hover:text-white h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-neutral-200">
              {viewMode === "preview" ? "Preview" : "Drive"}
            </span>
          </div>
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-neutral-500 hover:text-white h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {viewMode === "browse" && (
          <>
            {/* Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-neutral-900 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 text-sm h-8"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearch}
                className="text-neutral-400 hover:text-white h-8 w-8"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {/* Breadcrumbs */}
            {!searchQuery && (
              <div className="flex items-center gap-1 mt-2 overflow-x-auto text-xs">
                {folderPath.map((item, index) => (
                  <div key={item.id} className="flex items-center">
                    {index > 0 && <ChevronRight className="w-3 h-3 text-neutral-600 mx-1" />}
                    <button
                      onClick={() => handleBreadcrumbClick(index)}
                      className={`hover:text-white transition-colors truncate max-w-[80px] ${
                        index === folderPath.length - 1 ? "text-neutral-200" : "text-neutral-500"
                      }`}
                    >
                      {index === 0 ? <Home className="w-3 h-3" /> : item.name}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {viewMode === "preview" && selectedFile ? (
          <div className="h-full flex flex-col">
            {/* File name */}
            <div className="p-2 border-b border-neutral-900 flex items-center justify-between">
              <span className="text-xs text-neutral-300 truncate">{selectedFile.name}</span>
              <a
                href={selectedFile.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-white"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {/* Embed preview */}
            <div className="flex-1 min-h-[400px]">
              <iframe
                src={selectedFile.embedUrl}
                className="w-full h-full border-0"
                allow="autoplay"
                title={selectedFile.name}
              />
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
          </div>
        ) : searchQuery ? (
          // Search Results
          <div className="p-2 space-y-1">
            {searchResults.length > 0 ? (
              searchResults.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-900 transition-colors text-left"
                >
                  {getFileIcon(file.mimeType)}
                  <span className="text-sm text-neutral-300 truncate">{file.name}</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-neutral-600 text-center py-4">No results found</p>
            )}
          </div>
        ) : (
          // Folder Contents
          <div className="p-2 space-y-1">
            {/* Folders */}
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-900 transition-colors text-left"
              >
                <FolderOpen className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-neutral-300 truncate">{folder.name}</span>
                <ChevronRight className="w-4 h-4 text-neutral-600 ml-auto" />
              </button>
            ))}

            {/* Files */}
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => handleFileClick(file)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-900 transition-colors text-left"
              >
                {getFileIcon(file.mimeType)}
                <span className="text-sm text-neutral-300 truncate">{file.name}</span>
              </button>
            ))}

            {folders.length === 0 && files.length === 0 && (
              <p className="text-sm text-neutral-600 text-center py-4">Folder is empty</p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
