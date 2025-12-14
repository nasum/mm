import { useEffect, useState } from 'react'
import { MediaItem, Tag } from '../types'

interface MediaViewerProps {
    item: MediaItem
    onClose: () => void
    onNext?: () => void
    onPrevious?: () => void
    hasNext?: boolean
    hasPrevious?: boolean
}

const getFileUrl = (filepath: string) => {
    return `media:///${filepath.replace(/\\/g, '/')}`;
}

export function MediaViewer({ item, onClose, onNext, onPrevious, hasNext, hasPrevious }: MediaViewerProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [itemTags, setItemTags] = useState<Tag[]>(item.tags || []);
    const [newTagName, setNewTagName] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent interference with tag input
            if (isAddingTag && e.key !== 'Escape') return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowRight' && onNext && hasNext) {
                onNext();
            } else if (e.key === 'ArrowLeft' && onPrevious && hasPrevious) {
                onPrevious();
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
            </div>
        </div>
    )
}
