import { useState, useEffect } from 'react'
import { MediaItem } from '../App'

interface MoveToModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (targetPath: string) => void
    item: MediaItem | null
    allMedia: MediaItem[]
    rootPath?: string
}

export function MoveToModal({ isOpen, onClose, onConfirm, item, allMedia, rootPath }: MoveToModalProps) {
    const [currentPath, setCurrentPath] = useState<string>('')
    const [libraryPath, setLibraryPath] = useState<string>('')
    const [effectiveRoot, setEffectiveRoot] = useState<string>('')

    useEffect(() => {
        if (isOpen && item) {
            window.api.getSettings().then((settings: any) => {
                const libPath = settings.libraryPath || '';
                setLibraryPath(libPath);

                // If rootPath provided (e.g. .../images), use it as the base constraint
                // Otherwise fallback to library path
                const base = rootPath || libPath;
                setEffectiveRoot(base);
                setCurrentPath(base);
                console.log('MoveToModal - Root:', base);
            })
        }
    }, [isOpen, item, rootPath])

    if (!isOpen || !item) return null


    const getParentPath = (path: string) => {
        const sep = path.includes('\\') ? '\\' : '/'
        return path.substring(0, path.lastIndexOf(sep))
    }

    // Get directories in current path
    const directories = allMedia.filter(m => {
        return m.type === 'directory' && getParentPath(m.filepath) === currentPath
    }).sort((a, b) => a.filename.localeCompare(b.filename));

    const handleNavigateUp = () => {
        // Stop navigation if at effective root
        if (currentPath === effectiveRoot || currentPath === libraryPath) return
        setCurrentPath(getParentPath(currentPath))
    }

    const handleEnterFolder = (path: string) => {
        setCurrentPath(path)
    }

    // Don't allow moving into itself if it's a directory
    // Don't allow moving into same folder it's already in
    const isSameFolder = getParentPath(item.filepath) === currentPath

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ minWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <h3>Move "{item.filename}" to...</h3>

                <div className="path-display" style={{ marginBottom: '10px', padding: '5px', background: '#222', borderRadius: '4px' }}>
                    {currentPath.replace(libraryPath, '~') || '/'}
                </div>

                <div className="folder-list" style={{ flex: 1, overflowY: 'auto', border: '1px solid #444', borderRadius: '4px', marginBottom: '15px' }}>
                    {currentPath !== effectiveRoot && (
                        <div
                            className="folder-item"
                            onClick={handleNavigateUp}
                            style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center' }}
                        >
                            <span>⬆ ..</span>
                        </div>
                    )}

                    {directories.map(dir => (
                        <div
                            key={dir.id}
                            className="folder-item"
                            onClick={() => handleEnterFolder(dir.filepath)}
                            style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span>📁</span>
                            <span>{dir.filename}</span>
                        </div>
                    ))}

                    {directories.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                            No subfolders
                        </div>
                    )}
                </div>

                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button
                        onClick={() => onConfirm(currentPath)}
                        className="btn btn-primary"
                        disabled={isSameFolder}
                    >
                        {isSameFolder ? 'Current Location' : 'Move Here'}
                    </button>
                </div>
            </div>
        </div>
    )
}
