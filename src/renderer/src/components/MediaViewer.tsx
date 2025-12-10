import { useEffect } from 'react'
import { MediaItem } from '../App'

interface MediaViewerProps {
    item: MediaItem
    onClose: () => void
}

const getFileUrl = (filepath: string) => {
    return `media:///${filepath.replace(/\\/g, '/')}`;
}

export function MediaViewer({ item, onClose }: MediaViewerProps) {
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

    return (
        <div className="media-viewer-overlay" onClick={onClose}>
            <button className="close-viewer-btn" onClick={onClose}>×</button>
            <div className="media-viewer-content" onClick={(e) => e.stopPropagation()}>
                {item.type === 'image' ? (
                    <img src={getFileUrl(item.filepath)} alt={item.filename} />
                ) : (
                    <video src={getFileUrl(item.filepath)} controls autoPlay />
                )}
            </div>
        </div>
    )
}
