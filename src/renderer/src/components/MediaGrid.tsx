import { MediaItem } from '../types'
import { useState, useEffect, useRef, forwardRef } from 'react'
import { MediaViewer } from './MediaViewer'
import { VirtuosoGrid } from 'react-virtuoso'

interface MediaGridProps {
    media: MediaItem[]
    onNavigate?: (path: string) => void
    onMove?: (items: MediaItem[]) => void
    onRename?: (item: MediaItem) => void
}

const getFileUrl = (filepath: string) => {
    // Use custom protocol to bypass security restrictions
    // Add extra slash to ensure it's treated as absolute path with empty host
    // Encode each segment to handle special characters (e.g. Japanese, spaces)
    const normalized = filepath.replace(/\\/g, '/');
    return `media:///${normalized.split('/').map(encodeURIComponent).join('/')}`;
}

const GridList = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(({ style, children, ...props }, ref) => (
    <div
        ref={ref}
        {...props}
        style={{
            ...style,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '20px',
            padding: '20px 40px',
            alignContent: 'start',
            boxSizing: 'border-box'
        }}
    >
        {children}
    </div>
));

const GridItemContainer = ({ children, ...props }: React.ComponentPropsWithoutRef<'div'>) => (
    <div {...props} style={{ ...props.style, minWidth: 0 }}>
        {children}
    </div>
);

export function MediaGrid({ media, onNavigate, onMove, onRename }: MediaGridProps) {
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const menuRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPressTriggered = useRef(false);

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

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectionMode(false);
                setSelectedIds(new Set());
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (media.length === 0) {
        return (
            <div className="empty-state">
                <p>No media found. Import files or drop them in the library folder.</p>
            </div>
        )
    }

    const handleDelete = async (items: MediaItem[]) => {
        if (confirm(`Are you sure you want to delete ${items.length} item(s)?`)) {
            for (const item of items) {
                await window.api.deleteMedia(item.filepath);
            }
            // Clear selection after delete
            setSelectionMode(false);
            setSelectedIds(new Set());
        }
        setActiveMenuId(null);
    };

    const handleDragStart = (e: React.DragEvent, item: MediaItem) => {
        if (selectionMode) {
            e.preventDefault(); // Disable drag in selection mode
            return;
        }

        e.dataTransfer.setData('application/json', JSON.stringify({
            filepath: item.filepath,
            filename: item.filename
        }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, item: MediaItem) => {
        if (selectionMode) return;
        if (item.type === 'directory') {
            e.preventDefault(); // Allow drop
            e.dataTransfer.dropEffect = 'move';
            if (dragOverId !== item.id) {
                setDragOverId(item.id);
            }
        }
    };

    // Use onDragEnd to cleanup state if drag is cancelled or completes
    const handleDragEnd = () => {
        setDragOverId(null);
    }

    const handleDrop = async (e: React.DragEvent, targetItem: MediaItem) => {
        if (selectionMode) return;
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

    // Long Press Logic
    const startLongPress = (item: MediaItem) => {
        if (selectionMode) return; // Already in selection mode
        isLongPressTriggered.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPressTriggered.current = true;
            setSelectionMode(true);
            toggleSelection(item.id);
        }, 500); // 500ms long press
    };

    const clearLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleItemClick = (_e: React.MouseEvent, item: MediaItem) => {
        if (isLongPressTriggered.current) {
            // Long press usage, ignore this click event usually firing after mouseup
            isLongPressTriggered.current = false;
            return;
        }

        if (selectionMode) {
            toggleSelection(item.id);
        } else {
            if (item.type === 'directory') {
                onNavigate?.(item.filepath);
            } else {
                setSelectedItem(item);
            }
        }
    };

    const getSelectedItems = () => {
        return media.filter(m => selectedIds.has(m.id));
    };

    return (
        <div style={{ flex: 1, height: '100%', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <VirtuosoGrid
                style={{ flex: 1 }}
                totalCount={sortedMedia.length}
                components={{
                    List: GridList,
                    Item: GridItemContainer // Optional, but can use standard div if needed
                }}
                itemContent={(index) => {
                    const item = sortedMedia[index];
                    const isSelected = selectedIds.has(item.id);
                    return (
                        <div
                            key={item.id}
                            className={`media-item ${isSelected ? 'selected' : ''} ${selectionMode ? 'selection-mode' : ''}`}
                            draggable={!selectionMode}
                            onDragStart={(e) => handleDragStart(e, item)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, item)}
                            onDrop={(e) => handleDrop(e, item)}
                            onMouseDown={() => startLongPress(item)}
                            onMouseUp={clearLongPress}
                            onMouseLeave={clearLongPress}
                            onClick={(e) => handleItemClick(e, item)}
                            style={{
                                outline: dragOverId === item.id ? '2px solid var(--primary-color)' : (isSelected ? '2px solid var(--primary-color)' : 'none'),
                                outlineOffset: '2px',
                                cursor: 'pointer',
                                height: 'auto'
                            }}
                        >
                            <div className="media-preview group">
                                {selectionMode && (
                                    <div className={`selection-checkbox ${isSelected ? 'checked' : ''}`} style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        border: '2px solid white',
                                        backgroundColor: isSelected ? 'var(--primary-color)' : 'rgba(0,0,0,0.3)',
                                        zIndex: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {isSelected && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                                    </div>
                                )}

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
                                {!selectionMode && (
                                    <div className="menu-container">
                                        <button
                                            className="menu-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                e.nativeEvent.stopImmediatePropagation(); // Prevent click logic?
                                                clearLongPress();
                                                setActiveMenuId(activeMenuId === item.id ? null : item.id);
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()} // Prevent long press on menu
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
                                                        onMove?.([item]); // Pass array
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
                                                        handleDelete([item]); // Pass array
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }}
            />

            {/* Bulk Action Bar */}
            {selectionMode && (
                <div className="bulk-action-bar" style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1a1a1a',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    zIndex: 2000,
                    border: '1px solid #333',
                    whiteSpace: 'nowrap',
                    flexWrap: 'nowrap'
                }}>
                    <div style={{ marginRight: '12px', fontWeight: 'bold', minWidth: '80px', whiteSpace: 'nowrap' }}>
                        {selectedIds.size} Selected
                    </div>

                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            if (selectedIds.size === media.length) {
                                setSelectedIds(new Set());
                            } else {
                                setSelectedIds(new Set(media.map(m => m.id)));
                            }
                        }}
                    >
                        {selectedIds.size === media.length ? 'Deselect All' : 'Select All'}
                    </button>

                    <div style={{ width: '1px', height: '24px', backgroundColor: '#444', margin: '0 4px' }}></div>

                    <button
                        className="btn btn-primary"
                        disabled={selectedIds.size === 0}
                        onClick={() => onMove?.(getSelectedItems())}
                    >
                        Move
                    </button>

                    <button
                        className="btn btn-danger"
                        disabled={selectedIds.size === 0}
                        onClick={() => handleDelete(getSelectedItems())}
                        style={{ backgroundColor: '#cf6679', color: 'white', border: 'none' }}
                    >
                        Delete
                    </button>

                    <div style={{ width: '1px', height: '24px', backgroundColor: '#444', margin: '0 4px' }}></div>

                    <button
                        className="btn"
                        style={{ background: 'transparent', border: '1px solid #555', color: '#eee' }}
                        onClick={() => {
                            setSelectionMode(false);
                            setSelectedIds(new Set());
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {selectedItem && (
                <MediaViewer item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
        </div>
    )
}
