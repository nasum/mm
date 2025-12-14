import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MediaItem, Tag } from '../types'
import { MediaGrid } from '../components/MediaGrid'
import { CreateFolderModal } from '../components/CreateFolderModal'
import { MoveToModal } from '../components/MoveToModal'
import { RenameModal } from '../components/RenameModal'
import { AddTagModal } from '../components/AddTagModal'

interface PhotosProps {
    media: MediaItem[]
}

export function Photos({ media }: PhotosProps) {
    const [searchParams, setSearchParams] = useSearchParams()
    const [rootPath, setRootPath] = useState<string>('')
    const [libraryPath, setLibraryPath] = useState<string>('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Derived current path from URL or fallback to rootPath
    const currentPath = searchParams.get('path') || rootPath

    // Modal states
    const [moveItems, setMoveItems] = useState<MediaItem[]>([])
    const [renameItem, setRenameItem] = useState<MediaItem | null>(null)
    const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false)
    const [itemsToTag, setItemsToTag] = useState<MediaItem[]>([])
    const [clearSelectionCallback, setClearSelectionCallback] = useState<(() => void) | null>(null)

    // Tag state
    const [existingTags, setExistingTags] = useState<Tag[]>([])

    useEffect(() => {
        window.api.getSettings().then((settings: any) => {
            const libPath = settings.libraryPath;
            if (!libPath) return;

            const separator = libPath.includes('\\') ? '\\' : '/';
            const imagesPath = `${libPath}${separator}images`;

            setLibraryPath(libPath);
            setRootPath(imagesPath);

            // If no path in URL, set it to root (replace to avoid back button loop)
            if (!searchParams.get('path')) {
                setSearchParams({ path: imagesPath }, { replace: true });
            }
        })
        loadTags()
    }, [])

    const loadTags = async () => {
        const tags = await window.api.getTags()
        setExistingTags(tags)
    }

    const handleCreateFolder = async (name: string) => {
        const separator = currentPath.includes('\\') ? '\\' : '/'
        const newPath = `${currentPath}${separator}${name}`

        try {
            const success = await window.api.createDirectory(newPath)
            if (!success) {
                alert('Failed to create directory')
            }
            // Page will auto-refresh via parent or we need to trigger reload? 
            // The original code didn't trigger parent reload explicitly.
            // But media prop comes from parent. The parent (App.tsx) likely polls or listens to changes?
            // "window.api.onMediaAdded" is in preload.
            // For now, let's assume parent handles refresh or we might need to rely on that.
            // (Original code just closed modal)
        } catch (error) {
            console.error(error)
            alert('Error creating directory')
        }
        setIsCreateModalOpen(false)
    }

    const handleSlideshow = (item: MediaItem) => {
        if (item.type !== 'directory') return;
        setSearchParams({ path: item.filepath, slideshow: 'true' });
    }

    const handleMoveConfirm = async (targetPath: string) => {
        if (moveItems.length === 0) return

        const separator = targetPath.includes('\\') ? '\\' : '/'

        try {
            for (const item of moveItems) {
                const newPath = `${targetPath}${separator}${item.filename}`
                console.log('Move confirmed:', item.filepath, '->', newPath);
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

        return item.type === 'directory' || item.type === 'image';
    })

    const handleAddTags = (items: MediaItem[], clearSelection: () => void) => {
        setItemsToTag(items)
        setClearSelectionCallback(() => clearSelection)
        setIsAddTagModalOpen(true)
    }

    const handleConfirmAddTag = async (tagName: string) => {
        let tag = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
        if (!tag) {
            tag = await window.api.createTag(tagName)
            if (tag) {
                setExistingTags(prev => [...prev, tag!])
            }
        }

        if (tag) {
            for (const item of itemsToTag) {
                // Check if tag already exists on the item
                const hasTag = item.tags && item.tags.some(t => t.id === tag.id)
                if (!hasTag) {
                    await window.api.addTagToMedia(item.id, tag.id)
                }
            }
            if (clearSelectionCallback) {
                clearSelectionCallback()
                setClearSelectionCallback(null)
            }
            // Trigger refresh via some mechanism?
            // Since props come from top, we might rely on top refresh.
        }
    }

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
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setSearchParams({ path: currentPath, slideshow: 'true' })}
                        className="btn-new-folder"
                        style={{ backgroundColor: '#28a745' }}
                    >
                        ▶ Play Slideshow
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-new-folder">
                        + New Folder
                    </button>
                </div>
            </header>

            <MediaGrid
                media={currentItems}
                onNavigate={(path) => setSearchParams({ path })}
                onMove={(items) => {
                    setMoveItems(items);
                }}
                onRename={(item) => setRenameItem(item)}
                onSlideshow={handleSlideshow}
                onSlideshowClose={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('slideshow');
                    setSearchParams(newParams);
                }}
                onAddTags={handleAddTags}
                autoPlay={searchParams.get('slideshow') === 'true'}
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

            <AddTagModal
                isOpen={isAddTagModalOpen}
                onClose={() => setIsAddTagModalOpen(false)}
                onAdd={handleConfirmAddTag}
                existingTags={existingTags}
            />
        </div>
    )
}
