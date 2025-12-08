import { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import './assets/main.css?inline'
import { Sidebar } from './components/Sidebar'
import { Home } from './pages/Home'
import { Photos } from './pages/Photos'
import { Videos } from './pages/Videos'
import { Settings } from './pages/Settings'

export interface MediaItem {
  id: number
  filepath: string
  filename: string
  type: 'image' | 'video'
  size: number
  created_at: string
}

function App() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Initial fetch
    window.api.getAllMedia().then((items: MediaItem[]) => {
      setMedia(items)
    })

    // Listeners
    window.api.onMediaAdded((_event, item) => {
      console.log('Added raw:', item);
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

  return (
    <Router>
      <div className="app-container">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/photos" element={<Photos media={media.filter(m => m.type === 'image')} />} />
            <Route path="/videos" element={<Videos media={media.filter(m => m.type === 'video')} />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
