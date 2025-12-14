import { useEffect, useState } from 'react'
import { MediaItem, Tag } from '../types'

interface MediaViewerProps {
    item: MediaItem
    items?: MediaItem[]
    onClose: () => void
    onNext?: () => void
    onPrevious?: () => void
    onJumpTo?: (item: MediaItem) => void
    hasNext?: boolean
    hasPrevious?: boolean
    autoPlay?: boolean
}

const getFileUrl = (filepath: string) => {
    return `media:///${filepath.replace(/\\/g, '/')}`;
}

export function MediaViewer({ item, items = [], onClose, onNext, onPrevious, onJumpTo, hasNext, hasPrevious, autoPlay = false }: MediaViewerProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [itemTags, setItemTags] = useState<Tag[]>(item.tags || []);
    const [newTagName, setNewTagName] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false); // Default to false (no auto-play)

    useEffect(() => {
        // Auto-maximize (fullscreen) on mount ONLY if in slideshow mode (autoPlay=true)
        if (autoPlay) {
            const enterFullscreen = async () => {
                try {
                    if (!document.fullscreenElement) {
                        await document.documentElement.requestFullscreen();
                    }
                } catch (err) {
                    console.warn('Failed to enter fullscreen:', err);
                }
            };
            enterFullscreen();
        }

        // Exit fullscreen on unmount if we were in fullscreen
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        };
    }, [autoPlay]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && onNext) {
            interval = setInterval(() => {
                onNext();
            }, 3000); // 3 seconds interval
        }
        return () => clearInterval(interval);
    }, [isPlaying, onNext, item]); // Depend on item to reset timer on change

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent interference with tag input
            if (isAddingTag && e.key !== 'Escape') return;

            if (e.key === 'Escape') {
                // If in fullscreen, Escape usually exits fullscreen first. 
                // If we are in fullscreen, browser handles Escape to exit fullscreen. 
                // We might need to handle closing the viewer separately or wait for fs change.
                // But for now, let's keep onClose. If browser catches Escape for fullscreen, this might not fire.
                onClose();
            } else if (e.key === 'ArrowRight' && onNext && hasNext) {
                onNext();
                setIsPlaying(false); // Stop auto-play on manual navigation
            } else if (e.key === 'ArrowLeft' && onPrevious && hasPrevious) {
                onPrevious();
                setIsPlaying(false);
            } else if (e.key === ' ') { // Space bar to toggle play/pause
                e.preventDefault();
                setIsPlaying(prev => !prev);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, onNext, onPrevious, hasNext, hasPrevious, isAddingTag]);

    useEffect(() => {
        // Reset state when item changes
        setItemTags(item.tags || []);
        setNewTagName('');
        setIsAddingTag(false);
        setHasError(false);
    }, [item]);

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        const allTags = await window.api.getTags();
        setTags(allTags);
    };

    const handleAddTag = async () => {
        if (!newTagName.trim()) return;

        // Check if tag exists or create it
        let tag = tags.find(t => t.name.toLowerCase() === newTagName.toLowerCase());

        if (!tag) {
            tag = await window.api.createTag(newTagName);
            setTags(prev => [...prev, tag!]);
        }

        if (tag) {
            // Check if already assigned
            if (!itemTags.find(t => t.id === tag!.id)) {
                await window.api.addTagToMedia(item.id, tag.id);
                setItemTags(prev => [...prev, tag!]);
                // Update the main media item object (hacky sync, ideally reload media)
                item.tags = [...(item.tags || []), tag];
            }
        }
        setNewTagName('');
        setIsAddingTag(false);
    };

    const handleRemoveTag = async (tagId: number) => {
        await window.api.removeTagFromMedia(item.id, tagId);
        setItemTags(prev => prev.filter(t => t.id !== tagId));
        item.tags = item.tags.filter(t => t.id !== tagId);
    };

    return (
        <div className="media-viewer-overlay" onClick={onClose}>
            <button className="close-viewer-btn" onClick={onClose}>×</button>
            <div className="media-viewer-content" onClick={(e) => e.stopPropagation()}>

                {hasPrevious && (
                    <button
                        className="nav-btn-prev"
                        onClick={(e) => { e.stopPropagation(); onPrevious?.(); }}
                        style={{
                            position: 'absolute',
                            left: '-60px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            fontSize: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1002
                        }}
                    >
                        ‹
                    </button>
                )}

                {hasError ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ff6b6b'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <div>File not found or cannot be loaded</div>
                        <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>{item.filename}</div>
                    </div>
                ) : item.type === 'image' ? (
                    <img
                        src={getFileUrl(item.filepath)}
                        alt={item.filename}
                        onError={() => setHasError(true)}
                    />
                ) : (
                    <video
                        src={getFileUrl(item.filepath)}
                        controls
                        autoPlay
                        onError={() => setHasError(true)}
                    />
                )}

                {hasNext && (
                    <button
                        className="nav-btn-next"
                        onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                        style={{
                            position: 'absolute',
                            right: '-60px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            fontSize: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1002
                        }}
                    >
                        ›
                    </button>
                )}

                {!autoPlay && (
                    <div className="media-tags-overlay">
                        <div className="tags-list">
                            {itemTags.map(tag => (
                                <span key={tag.id} className="media-tag">
                                    #{tag.name}
                                    <button
                                        className="remove-tag-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveTag(tag.id);
                                        }}
                                    >×</button>
                                </span>
                            ))}
                            {isAddingTag ? (
                                <div className="add-tag-input-container">
                                    <input
                                        type="text"
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddTag();
                                            if (e.key === 'Escape') setIsAddingTag(false);
                                            e.stopPropagation(); // Prevent viewer nav
                                        }}
                                        placeholder="Tag name"
                                        autoFocus
                                        list="existing-tags"
                                    />
                                    <datalist id="existing-tags">
                                        {tags.map(t => <option key={t.id} value={t.name} />)}
                                    </datalist>
                                    <button onClick={handleAddTag}>Add</button>
                                </div>
                            ) : (
                                <button className="add-tag-btn" onClick={() => setIsAddingTag(true)}>+</button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls Overlay (Play/Pause + Thumbnails) */}
            <div
                className="bottom-controls-container"
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '140px', // Increased height to accommodate button + strip
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    zIndex: 2000,
                    opacity: 0, // Hidden by default
                    transition: 'opacity 0.3s ease',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    pointerEvents: 'none', // Let clicks pass when hidden
                    paddingBottom: '20px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.pointerEvents = 'auto';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                    e.currentTarget.style.pointerEvents = 'none';
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Play/Pause Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsPlaying(prev => !prev);
                    }}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.4)',
                        borderRadius: '24px',
                        padding: '8px 24px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '10px',
                        pointerEvents: 'auto',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>

                {/* Thumbnail Strip */}
                {items.length > 0 && (
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        overflowX: 'auto',
                        padding: '0 10px',
                        maxWidth: '90%',
                        height: '70px',
                        scrollbarWidth: 'none',
                        pointerEvents: 'auto',
                        alignItems: 'center'
                    }}>
                        {items.map((m) => (
                            <div
                                key={m.id}
                                onClick={() => onJumpTo?.(m)}
                                style={{
                                    minWidth: '80px',
                                    height: '60px',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: m.id === item.id ? '2px solid var(--primary-color)' : '2px solid transparent',
                                    opacity: m.id === item.id ? 1 : 0.6,
                                    transition: 'opacity 0.2s',
                                    flexShrink: 0
                                }}
                            >
                                {m.type === 'video' ? (
                                    <video src={getFileUrl(m.filepath)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <img src={getFileUrl(m.filepath)} alt={m.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
