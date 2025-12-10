import { MediaItem } from '../App'
import { useState, useEffect, useRef } from 'react'
import { MediaViewer } from './MediaViewer'

interface MediaGridProps {
    media: MediaItem[]
}

const getFileUrl = (filepath: string) => {
    // Use custom protocol to bypass security restrictions
    // Add extra slash to ensure it's treated as absolute path with empty host
    return `media:///${filepath.replace(/\\/g, '/')}`;
}

export function MediaGrid({ media }: MediaGridProps) {
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="media-grid">
            {media.map((item) => (
                <div key={item.id} className="media-item">
                    <div
                        className="media-preview group"
                        onClick={() => setSelectedItem(item)}
                    >
                        {item.type === 'image' ? (
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
