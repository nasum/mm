import { MediaItem } from '../App'

interface MediaGridProps {
    media: MediaItem[]
}

const getFileUrl = (filepath: string) => {
    // Use custom protocol to bypass security restrictions
    // Add extra slash to ensure it's treated as absolute path with empty host
    return `media:///${filepath.replace(/\\/g, '/')}`;
}

export function MediaGrid({ media }: MediaGridProps) {
    if (media.length === 0) {
        return (
            <div className="empty-state">
                <p>No media found. Import files or drop them in the library folder.</p>
            </div>
        )
    }

    return (
        <div className="media-grid">
            {media.map((item) => (
                <div key={item.id} className="media-item">
                    <div className="media-preview">
                        {item.type === 'image' ? (
                            <img src={getFileUrl(item.filepath)} alt={item.filename} />
                        ) : (
                            <video src={getFileUrl(item.filepath)} controls muted />
                        )}
                    </div>
                    <div className="media-info">
                        <span className="media-name" title={item.filename}>{item.filename}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}
