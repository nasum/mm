import { MediaItem } from '../App'
import { useState, useEffect, useRef } from 'react'
import { MediaViewer } from './MediaViewer'

interface MediaGridProps {
    media: MediaItem[]
    onNavigate?: (path: string) => void
    onMove?: (item: MediaItem) => void
    onRename?: (item: MediaItem) => void
}

const getFileUrl = (filepath: string) => {
    // Use custom protocol to bypass security restrictions
    // Add extra slash to ensure it's treated as absolute path with empty host
    return `media:///${filepath.replace(/\\/g, '/')}`;
}

export function MediaGrid({ media, onNavigate, onMove, onRename }: MediaGridProps) {
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Sort: Directories first, then files
    const sortedMedia = [...media].sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return 0;
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (media.length === 0) {
        return (
            <div className="empty-state">
                <p>No media found. Import files or drop them in the library folder.</p>
            </div>
        )
    }

    const handleDelete = (filepath: string) => {
        if (confirm('Are you sure you want to delete this file?')) {
            window.api.deleteMedia(filepath);
        }
        setActiveMenuId(null);
    };

    const handleRename = async (item: MediaItem) => {
        const newName = prompt('Enter new name:', item.filename);
        if (newName && newName !== item.filename) {
            const separator = item.filepath.includes('\\') ? '\\' : '/';
            const parentDir = item.filepath.lastIndexOf(separator) !== -1
                ? item.filepath.substring(0, item.filepath.lastIndexOf(separator))
                : '';

            if (parentDir) {
                const newPath = `${parentDir}${separator}${newName}`;
                await window.api.renameMedia(item.filepath, newPath);
            }
        }
        setActiveMenuId(null);
    };

    const handleDragStart = (e: React.DragEvent, item: MediaItem) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            filepath: item.filepath,
            filename: item.filename
        }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, item: MediaItem) => {
        if (item.type === 'directory') {
            e.preventDefault(); // Allow drop
            e.dataTransfer.dropEffect = 'move';
            if (dragOverId !== item.id) {
                setDragOverId(item.id);
            }
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Prevent flickering by ensuring we're leaving the actual drop target
        // For simplicity, we might just rely on checking dragOverId state updates carefully,
        // but here we can reset if needed or just let DragOver update it.
        // A simple way is to not reset it here but maybe reset it on drop or end.
        // Or check relatedTarget.
    };

    // Use onDragEnd to cleanup state if drag is cancelled or completes
    const handleDragEnd = () => {
        setDragOverId(null);
    }

    const handleDrop = async (e: React.DragEvent, targetItem: MediaItem) => {
        e.preventDefault();
        setDragOverId(null);

        if (targetItem.type !== 'directory') return;

        try {
            const data = e.dataTransfer.getData('application/json');
            if (!data) return;

            const sourceItem = JSON.parse(data);
            if (sourceItem.filepath === targetItem.filepath) return; // Dropped on self

            const separator = targetItem.filepath.includes('\\') ? '\\' : '/';
            const newPath = `${targetItem.filepath}${separator}${sourceItem.filename}`;

            // Prevent overwriting or invalid moves check can be added here or backend throws error
            await window.api.renameMedia(sourceItem.filepath, newPath);
        } catch (error) {
            console.error('Drop failed:', error);
        }
    };

    return (
        <div className="media-grid">
            {sortedMedia.map((item) => (
                <div
                    key={item.id}
                    className="media-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, item)}
                    onDrop={(e) => handleDrop(e, item)}
                    style={{
                        outline: dragOverId === item.id ? '2px solid var(--primary-color)' : 'none',
                        outlineOffset: '2px'
                    }}
                >
                    <div
                        className="media-preview group"
                        onClick={() => {
                            if (item.type === 'directory') {
                                onNavigate?.(item.filepath);
                            } else {
                                setSelectedItem(item);
                            }
                        }}
                    >
                        {item.type === 'directory' ? (
                            <div className="folder-icon" style={{ fontSize: '4rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>📁</div>
                        ) : item.type === 'image' ? (
                            <img src={getFileUrl(item.filepath)} alt={item.filename} />
                        ) : (
                            <video src={getFileUrl(item.filepath)} controls muted />
                        )}
                    </div>
                    <div className="media-info media-info-row">
                        <span className="media-name" title={item.filename}>{item.filename}</span>
                        <div className="menu-container">
                            <button
                                className="menu-btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === item.id ? null : item.id);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="19" cy="12" r="1"></circle>
                                    <circle cx="5" cy="12" r="1"></circle>
                                </svg>
                            </button>

                            {activeMenuId === item.id && (
                                <div ref={menuRef} className="dropdown-menu">
                                    <button
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.api.showInFolder(item.filepath);
                                            setActiveMenuId(null);
                                        }}
                                    >
                                        Show in Explorer
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(null);
                                            onMove?.(item);
                                        }}
                                    >
                                        Move to...
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(null);
                                            if (onRename) {
                                                onRename(item);
                                            }
                                        }}
                                    >
                                        Rename
                                    </button>
                                    <button
                                        className="dropdown-item delete-option"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item.filepath);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {selectedItem && (
                <MediaViewer item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
        </div>
    )
}
