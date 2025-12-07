import { MediaItem } from '../App'

interface HomeProps {
    media: MediaItem[]
}

const getFileUrl = (filepath: string) => {
    // Ensure properly formatted file URL
    return `file://${filepath.replace(/\\/g, '/')}`;
}

export function Home({ media }: HomeProps) {
    const handleImport = () => {
        window.api.importMedia()
    }

    return (
        <div className="page home-page">
            <header className="page-header">
                <h1>Library</h1>
                <button className="btn btn-import" onClick={handleImport}>
                    Import files
                </button>
            </header>

            {media.length === 0 ? (
                <div className="empty-state">
                    <p>No media found. Import files or drop them in the library folder.</p>
                </div>
            ) : (
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
            )}
        </div>
    )
}
