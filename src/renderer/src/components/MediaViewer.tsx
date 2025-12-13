import { useEffect, useState } from 'react'
import { MediaItem, Tag } from '../App'

interface MediaViewerProps {
    item: MediaItem
    onClose: () => void
}

const getFileUrl = (filepath: string) => {
    return `media:///${filepath.replace(/\\/g, '/')}`;
}

export function MediaViewer({ item, onClose }: MediaViewerProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [itemTags, setItemTags] = useState<Tag[]>(item.tags || []);
    const [newTagName, setNewTagName] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

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
                {item.type === 'image' ? (
                    <img src={getFileUrl(item.filepath)} alt={item.filename} />
                ) : (
                    <video src={getFileUrl(item.filepath)} controls autoPlay />
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
