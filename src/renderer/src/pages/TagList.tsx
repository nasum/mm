import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '../types'

export function TagList() {
    const [tags, setTags] = useState<Tag[]>([])
    const [search, setSearch] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        window.api.getTags().then((fetchedTags: Tag[]) => {
            setTags(fetchedTags)
        })
    }, [])

    const filteredTags = useMemo(() => {
        return tags.filter(tag =>
            tag.name.toLowerCase().includes(search.toLowerCase())
        ).sort((a, b) => (b.count || 0) - (a.count || 0)) // Sort by count desc by default for list view? Or name? User didn't specify, but "tag list" usually implies alphabetical or count.
        // Let's sort by name for general list, or maybe count since "usage" is interesting. 
        // User asked to show count.
        // Let's default to Name ASC for easy finding, unless user wants "Most used".
        // The sidebar is "Recent".
        // Let's stick to Name ASC for the main list, but maybe Count DESC is better for "management".
        // Let's do Name ASC.
    }, [tags, search])

    return (
        <div className="page tag-list-page">
            <header className="page-header">
                <h1>All Tags</h1>
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search tags..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>
            </header>

            <div className="tags-grid">
                {filteredTags.map(tag => (
                    <div key={tag.id} className="tag-card" onClick={() => navigate(`/tags?tag=${tag.id}`)}>
                        <div className="tag-name">#{tag.name}</div>
                        <div className="tag-count">{tag.count || 0} items</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
