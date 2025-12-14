import { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import './assets/main.css?inline'
import { Sidebar } from './components/Sidebar'
import { Home } from './pages/Home'
import { Photos } from './pages/Photos'
import { Videos } from './pages/Videos'
import { Settings } from './pages/Settings'
import { TagResults } from './pages/TagResults'
import { TagList } from './pages/TagList'
import { ImportProgress } from './components/ImportProgress'

import { MediaItem } from './types'

// Removed Tag and MediaItem interfaces as they are now in types.ts

function App() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  })
  const [isDragging, setIsDragging] = useState(false)

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  }

  useEffect(() => {
    // Initial fetch
    window.api.getAllMedia().then((items: MediaItem[]) => {
      setMedia(items)
    })

    // Listeners
    window.api.onMediaAdded((_event, item) => {
      setMedia((prev) => {
        // Avoid duplicates just in case
        if (prev.find(m => m.filepath === item.filepath)) return prev;
        return [item, ...prev]
      })
    })

    window.api.onMediaRemoved((_event, path) => {
      setMedia((prev) => prev.filter((m) => m.filepath !== path))
    })
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only show overlay if dragging files from OS
    if (e.dataTransfer.types.includes('Files') && !e.dataTransfer.types.includes('application/json')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we are leaving the window
    if (e.relatedTarget === null) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    // Use exposed webUtils to get the path (required due to context isolation)
    const paths = files.map(f => window.api.getFilePath(f));

    if (paths.length > 0) {
      await window.api.addDroppedFiles(paths);
    }
  };

  return (
    <Router>
      <div
        className="app-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="drop-overlay">
            <div className="drop-message">
              <div className="drop-icon">📂</div>
              <p>Drop files to import</p>
            </div>
          </div>
        )}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/photos" element={<Photos media={media} />} />
            <Route path="/videos" element={<Videos media={media} />} />
            <Route path="/tags" element={<TagResults media={media} />} />
            <Route path="/tags-list" element={<TagList />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <ImportProgress />
      </div>
    </Router>
  )
}

export default App
