import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MediaItem } from '../types'
import { MediaGrid } from '../components/MediaGrid'
import { CreateFolderModal } from '../components/CreateFolderModal'
import { MoveToModal } from '../components/MoveToModal'
import { RenameModal } from '../components/RenameModal'

interface VideosProps {
    media: MediaItem[]
}

export function Videos({ media }: VideosProps) {
    const [searchParams, setSearchParams] = useSearchParams()
    const [rootPath, setRootPath] = useState<string>('')
    const [libraryPath, setLibraryPath] = useState<string>('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Derived current path from URL or fallback to rootPath
    const currentPath = searchParams.get('path') || rootPath

    // Modal states
    const [moveItems, setMoveItems] = useState<MediaItem[]>([])
    const [renameItem, setRenameItem] = useState<MediaItem | null>(null)

    useEffect(() => {
        window.api.getSettings().then((settings: any) => {
            const libPath = settings.libraryPath;
            if (!libPath) return;

            const separator = libPath.includes('\\') ? '\\' : '/';
            const moviesPath = `${libPath}${separator}movies`;

            setLibraryPath(libPath);
            setRootPath(moviesPath);

            // If no path in URL, set it to root (replace to avoid back button loop)
            if (!searchParams.get('path')) {
                setSearchParams({ path: moviesPath }, { replace: true });
            }
        })
    }, [])

    const handleCreateFolder = async (name: string) => {
        const separator = currentPath.includes('\\') ? '\\' : '/'
        const newPath = `${currentPath}${separator}${name}`

        try {
            const success = await window.api.createDirectory(newPath)
            if (!success) {
                alert('Failed to create directory')
            }
        } catch (error) {
            console.error(error)
            alert('Error creating directory')
        }
        setIsCreateModalOpen(false)
    }

    const handleMoveConfirm = async (targetPath: string) => {
        if (moveItems.length === 0) return

        const separator = targetPath.includes('\\') ? '\\' : '/'

        try {
            for (const item of moveItems) {
                const newPath = `${targetPath}${separator}${item.filename}`
                await window.api.renameMedia(item.filepath, newPath)
            }
        } catch (error) {
            console.error('Move failed', error)
            alert('Failed to move some items')
        }
        setMoveItems([])
    }

    const handleRenameConfirm = async (newName: string) => {
        if (!renameItem) return

        const separator = renameItem.filepath.includes('\\') ? '\\' : '/'
        const parentPath = renameItem.filepath.substring(0, renameItem.filepath.lastIndexOf(separator))
        const newPath = `${parentPath}${separator}${newName}`

        try {
            await window.api.renameMedia(renameItem.filepath, newPath)
        } catch (error) {
            console.error('Rename failed', error)
            alert('Failed to rename item')
        }
        setRenameItem(null)
    }

    const handleNavigateUp = () => {
        if (currentPath === rootPath) return
        const separator = currentPath.includes('\\') ? '\\' : '/'
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf(separator))
        setSearchParams({ path: parentPath })
    }

    const getParentPath = (path: string) => {
        const separator = path.includes('\\') ? '\\' : '/'
        return path.substring(0, path.lastIndexOf(separator))
    }

    const currentItems = media.filter(item => {
        if (!currentPath) return false;

        const isChild = getParentPath(item.filepath) === currentPath;
        if (!isChild) return false;

        return item.type === 'directory' || item.type === 'video';
    })

    return (
        <div className="page videos-page">
            <header className="page-header">
                <div className="header-left">
                    <h1>Videos</h1>
                    {currentPath !== rootPath && (
                        <button onClick={handleNavigateUp} className="nav-btn">
                            ⬆ Up
                        </button>
                    )}
                    <span className="path-display" style={{ margin: 0 }}>
                        {currentPath.replace(libraryPath, '~')}
                    </span>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="btn-new-folder">
                    + New Folder
                </button>
            </header>

            <MediaGrid
                media={currentItems}
                onNavigate={(path) => setSearchParams({ path })}
                onMove={(items) => setMoveItems(items)}
                onRename={(item) => setRenameItem(item)}
            />

            <CreateFolderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateFolder}
            />

            <MoveToModal
                isOpen={moveItems.length > 0}
                onClose={() => setMoveItems([])}
                onConfirm={handleMoveConfirm}
                items={moveItems}
                allMedia={media}
                rootPath={rootPath}
            />

            <RenameModal
                isOpen={!!renameItem}
                onClose={() => setRenameItem(null)}
                onRename={handleRenameConfirm}
                currentName={renameItem ? renameItem.filename : ''}
            />
        </div>
    )
}
