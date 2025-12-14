import { useState, useEffect } from 'react'
import { MediaItem } from '../types'

interface MoveToModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (targetPath: string) => void
    items: MediaItem[]
    allMedia: MediaItem[]
    rootPath?: string
}

export function MoveToModal({ isOpen, onClose, onConfirm, items, allMedia, rootPath }: MoveToModalProps) {
    const [currentPath, setCurrentPath] = useState<string>('')
    const [libraryPath, setLibraryPath] = useState<string>('')
    const [effectiveRoot, setEffectiveRoot] = useState<string>('')

    useEffect(() => {
        if (isOpen && items.length > 0) {
            window.api.getSettings().then((settings: any) => {
                const libPath = settings.libraryPath || '';
                setLibraryPath(libPath);

                const base = rootPath || libPath;
                setEffectiveRoot(base);

                // If single item, start at its parent. If multiple, start at root (safer/simpler)
                if (items.length === 1) {
                    const sep = items[0].filepath.includes('\\') ? '\\' : '/';
                    const parent = items[0].filepath.substring(0, items[0].filepath.lastIndexOf(sep));
                    // Ensure parent is within effective root
                    if (parent.startsWith(base)) {
                        setCurrentPath(parent);
                    } else {
                        setCurrentPath(base);
                    }
                } else {
                    setCurrentPath(base);
                }
            })
        }
    }, [isOpen, items, rootPath])

    if (!isOpen || items.length === 0) return null


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
    // For multiple items, if ANY item is basically "no-op" or invalid, we should probably allow it but just warn or filter?
    // Let's simplified: If we are in the same folder as ALL items, disable.
    // Actually, checking against one item is usually enough for the UI button "Current Location".
    // If we move 3 items to Folder A, and they are already in Folder A, it's a no-op.

    const isSameFolder = items.every(item => getParentPath(item.filepath) === currentPath);

    // Check if we are trying to move a directory INTO itself or its children
    // If any item is a directory AND currentPath starts with item.filepath, that's invalid.
    const isInvalidMove = items.some(item => {
        if (item.type === 'directory') {
            return currentPath === item.filepath || currentPath.startsWith(item.filepath + (item.filepath.includes('\\') ? '\\' : '/'));
        }
        return false;
    });

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ minWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <h3>Move {items.length} item{items.length > 1 ? 's' : ''} to...</h3>

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
                        disabled={isSameFolder || isInvalidMove}
                    >
                        {isSameFolder ? 'Current Location' : 'Move Here'}
                    </button>
                </div>
            </div>
        </div>
    )
}
