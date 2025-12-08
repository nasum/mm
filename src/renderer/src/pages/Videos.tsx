import { MediaItem } from '../App'
import { MediaGrid } from '../components/MediaGrid'

interface VideosProps {
    media: MediaItem[]
}

export function Videos({ media }: VideosProps) {
    const handleImport = () => {
        window.api.importMedia()
    }

    return (
        <div className="page videos-page">
            <header className="page-header">
                <h1>Videos</h1>
                <button className="btn btn-import" onClick={handleImport}>
                    Import files
                </button>
            </header>
            <MediaGrid media={media} />
        </div>
    )
}
