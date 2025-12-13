import { useState, useEffect } from 'react'
import { MediaItem } from '../App'
import { MediaGrid } from '../components/MediaGrid'
import { CreateFolderModal } from '../components/CreateFolderModal'
import { MoveToModal } from '../components/MoveToModal'
import { RenameModal } from '../components/RenameModal'
import { useLocation } from 'react-router-dom'

interface PhotosProps {
    media: MediaItem[]
}

export function Photos({ media }: PhotosProps) {
    const [currentPath, setCurrentPath] = useState<string>('')
    const [rootPath, setRootPath] = useState<string>('')
    const [libraryPath, setLibraryPath] = useState<string>('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const location = useLocation()

    // Modal states
    const [moveItem, setMoveItem] = useState<MediaItem | null>(null)
    const [renameItem, setRenameItem] = useState<MediaItem | null>(null)

    useEffect(() => {
        window.api.getSettings().then((settings: any) => {
            const libPath = settings.libraryPath;
            if (!libPath) return;

            const separator = libPath.includes('\\') ? '\\' : '/';
            const imagesPath = `${libPath}${separator}images`;

            setLibraryPath(libPath);
            setRootPath(imagesPath);

            if (!currentPath) {
                setCurrentPath(imagesPath);
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
        if (!moveItem) return

        const separator = targetPath.includes('\\') ? '\\' : '/'
        const newPath = `${targetPath}${separator}${moveItem.filename}`

        console.log('Move confirmed:', moveItem.filepath, '->', newPath);

        try {
            await window.api.renameMedia(moveItem.filepath, newPath)
        } catch (error) {
            console.error('Move failed', error)
            alert('Failed to move item')
        }
        setMoveItem(null)
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
        setCurrentPath(parentPath)
    }

    const getParentPath = (path: string) => {
        const separator = path.includes('\\') ? '\\' : '/'
        return path.substring(0, path.lastIndexOf(separator))
    }

    const currentItems = media.filter(item => {
        const tagId = new URLSearchParams(location.search).get('tag');

        if (tagId) {
            const hasTag = item.tags && item.tags.some(t => t.id === Number(tagId));
            // Show images matching tag. 
            // Ideally we should also show videos if this page supported it, 
            // but this is Photos page so only images.
            return hasTag && item.type === 'image';
        }

        if (!currentPath) return false;

        const isChild = getParentPath(item.filepath) === currentPath;
        if (!isChild) return false;

        return item.type === 'directory' || item.type === 'image';
    })

    return (
        <div className="page photos-page">
            <header className="page-header">
                <div className="header-left">
                    <h1>Photos</h1>
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
                onNavigate={(path) => setCurrentPath(path)}
                onMove={(item) => {
                    console.log('Open Move Modal for:', item);
                    setMoveItem(item);
                }}
                onRename={(item) => setRenameItem(item)}
            />

            <CreateFolderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateFolder}
            />

            <MoveToModal
                isOpen={!!moveItem}
                onClose={() => setMoveItem(null)}
                onConfirm={handleMoveConfirm}
                item={moveItem}
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
