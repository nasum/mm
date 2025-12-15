import { useEffect, useState } from 'react'
import { MediaItem } from '../types'
import { MediaGrid } from '../components/MediaGrid'

export function Favorites() {
    const [favorites, setFavorites] = useState<MediaItem[]>([])

    useEffect(() => {
        loadFavorites()
    }, [])

    useEffect(() => {
        const handleUpdate = () => {
            loadFavorites()
        }
        window.api.onMediaUpdated(handleUpdate)
        return () => {
            window.api.removeMediaListener('media-updated', handleUpdate)
        }
    }, [])

    const loadFavorites = async () => {
        const items = await window.api.getFavorites()
        setFavorites(items)
    }

    return (
        <div className="page favorites-page">
            <header className="page-header">
                <h1>⭐ Favorites</h1>
            </header>

            {favorites.length === 0 ? (
                <div className="empty-state">
                    <p>No favorites yet. Click the star icon on any image or video to add it to favorites.</p>
                </div>
            ) : (
                <MediaGrid media={favorites} />
            )}
        </div>
    )
}
