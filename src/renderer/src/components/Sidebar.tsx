import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface Tag {
    id: number
    name: string
}

interface SidebarProps {
    isCollapsed: boolean
    onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const [tags, setTags] = useState<Tag[]>([])

    const fetchTags = async () => {
        const fetchedTags = await window.api.getTags()
        setTags(fetchedTags)
    }

    useEffect(() => {
        fetchTags()
        // Poll for tag updates or listen to events if we implemented them.
        // For now, simple polling or refresh on mount.
        const interval = setInterval(fetchTags, 2000)
        return () => clearInterval(interval)
    }, [])

    const handleTagClick = (tagId: number) => {
        // If we are already on a page that supports filtering, we append query param?
        // Actually, let's assume we want to view photos with this tag.
        // Or maybe a unified search page? 
        // Let's filter on the photos page for now as a default, or just pass it as state.
        // The plan said "Update Photos.tsx ... to respect filters".
        // Let's navigate to /photos?tag={id}
        navigate(`/photos?tag=${tagId}`)
    }

    const currentTagId = new URLSearchParams(location.search).get('tag');

    return (
        <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!isCollapsed && <h2>MM</h2>}
                <button className="collapse-btn" onClick={onToggle}>
                    {isCollapsed ? '»' : '«'}
                </button>
            </div>
            <ul className="sidebar-menu">
                <li className={location.pathname === '/' ? 'active' : ''}>
                    <Link to="/" title="Home">
                        <span className="icon">🏠</span>
                        {!isCollapsed && <span className="label">Home</span>}
                    </Link>
                </li>
                <li className={location.pathname === '/photos' && !currentTagId ? 'active' : ''}>
                    <Link to="/photos" title="Photos">
                        <span className="icon">🖼️</span>
                        {!isCollapsed && <span className="label">Photos</span>}
                    </Link>
                </li>
                <li className={location.pathname === '/videos' ? 'active' : ''}>
                    <Link to="/videos" title="Videos">
                        <span className="icon">🎬</span>
                        {!isCollapsed && <span className="label">Videos</span>}
                    </Link>
                </li>
                <li className={location.pathname === '/settings' ? 'active' : ''}>
                    <Link to="/settings" title="Settings">
                        <span className="icon">⚙️</span>
                        {!isCollapsed && <span className="label">Settings</span>}
                    </Link>
                </li>
            </ul>

            {!isCollapsed && (
                <div className="sidebar-section">
                    <h3>Tags</h3>
                    <ul className="tag-list">
                        <li className={location.search === '' && location.pathname === '/photos' ? '' : ''}>
                            <Link to="/photos" className={!currentTagId && location.pathname === '/photos' ? 'tag-item active' : 'tag-item'}>
                                All Photos
                            </Link>
                        </li>
                        {tags.map(tag => (
                            <li key={tag.id}>
                                <button
                                    className={`tag-item ${currentTagId === String(tag.id) ? 'active' : ''}`}
                                    onClick={() => handleTagClick(tag.id)}
                                >
                                    #{tag.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </nav>
    )
}
