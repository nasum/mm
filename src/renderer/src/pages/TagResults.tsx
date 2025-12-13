import { useLocation } from 'react-router-dom'
import { MediaItem } from '../App'
import { MediaGrid } from '../components/MediaGrid'
import { useMemo } from 'react'
import { MoveToModal } from '../components/MoveToModal'
import { RenameModal } from '../components/RenameModal'
import { useState, useEffect } from 'react'

interface TagResultsProps {
    media: MediaItem[]
}

export function TagResults({ media }: TagResultsProps) {
    const location = useLocation()
    const tagId = new URLSearchParams(location.search).get('tag')

    // Modal states
    const [moveItem, setMoveItem] = useState<MediaItem | null>(null)
    const [renameItem, setRenameItem] = useState<MediaItem | null>(null)
    const [rootPath, setRootPath] = useState<string>('')

    useEffect(() => {
        window.api.getSettings().then((settings: any) => {
            const libPath = settings.libraryPath;
            if (!libPath) return;
            // For mixed media, the "root" for move operations is somewhat ambiguous.
            // We'll set it to the library path itself or maybe we don't need to enforce a specific root 
            // for the move modal if we allow moving anywhere.
            // But the MoveToModal expects a rootPath to restrict navigation.
            // Let's use the library path as the root for now, so they can move between movies and images if they really want,
            // or just defaulting to libraryPath is safe.

            // Wait, the MoveToModal logic in previous conversations seemed to want to restrict Images to Images and Videos to Videos.
            // If we are in a mixed view, we might need to handle 'move' carefully.
            // For now, let's just pass the libraryPath.
            setRootPath(libPath);
        })
    }, [])


    const filteredMedia = useMemo(() => {
        if (!tagId) return []
        return media.filter(item =>
            item.tags && item.tags.some(t => t.id === Number(tagId))
        )
    }, [media, tagId])

    // We need to fetch the tag name for the header.
    // We can find it from the media items or a separate fetch.
    const tagName = useMemo(() => {
        if (!filteredMedia.length) return 'Tag'
        const tag = filteredMedia[0].tags.find(t => t.id === Number(tagId))
        return tag ? tag.name : 'Tag'
    }, [filteredMedia, tagId])

    const handleMoveConfirm = async (targetPath: string) => {
        if (!moveItem) return

        const separator = targetPath.includes('\\') ? '\\' : '/'
        const newPath = `${targetPath}${separator}${moveItem.filename}`

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


    return (
        <div className="page tag-results-page">
            <header className="page-header">
                <h1>#{tagName}</h1>
            </header>
            <MediaGrid
                media={filteredMedia}
                onMove={(item) => setMoveItem(item)}
                onRename={(item) => setRenameItem(item)}
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
