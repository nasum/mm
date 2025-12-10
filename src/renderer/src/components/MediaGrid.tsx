import { MediaItem } from '../App'
import { useState, useEffect, useRef } from 'react'
import { MediaViewer } from './MediaViewer'

interface MediaGridProps {
    media: MediaItem[]
    onNavigate?: (path: string) => void
}

const getFileUrl = (filepath: string) => {
    // Use custom protocol to bypass security restrictions
    // Add extra slash to ensure it's treated as absolute path with empty host
    return `media:///${filepath.replace(/\\/g, '/')}`;
}

export function MediaGrid({ media, onNavigate }: MediaGridProps) {
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Sort: Directories first, then files
    const sortedMedia = [...media].sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        // Then by name or date? Let's use name for now or keep existing order (created_at desc)
        // Existing order comes from DB (created_at desc).
        // Let's rely on DB order but prioritize directories.
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
            // Simple logic for parent dir, robustness could be improved but sufficient for now
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

    return (
        <div className="media-grid">
            {sortedMedia.map((item) => (
                <div key={item.id} className="media-item">
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
                                            handleRename(item);
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
