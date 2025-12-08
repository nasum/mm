import { Link, useLocation } from 'react-router-dom'

interface SidebarProps {
    isCollapsed: boolean
    onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const location = useLocation()

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
                <li className={location.pathname === '/photos' ? 'active' : ''}>
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
        </nav>
    )
}
