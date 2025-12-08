import { MediaItem } from '../App'
import { MediaGrid } from '../components/MediaGrid'

interface PhotosProps {
    media: MediaItem[]
}

export function Photos({ media }: PhotosProps) {
    const handleImport = () => {
        window.api.importMedia()
    }

    return (
        <div className="page photos-page">
            <header className="page-header">
                <h1>Photos</h1>
                <button className="btn btn-import" onClick={handleImport}>
                    Import files
                </button>
            </header>
            <MediaGrid media={media} />
        </div>
    )
}
