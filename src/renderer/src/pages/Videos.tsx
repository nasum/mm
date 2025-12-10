import { useState, useEffect } from 'react'
import { MediaItem } from '../App'
import { MediaGrid } from '../components/MediaGrid'
import { CreateFolderModal } from '../components/CreateFolderModal'

interface VideosProps {
    media: MediaItem[]
}

export function Videos({ media }: VideosProps) {
    const [currentPath, setCurrentPath] = useState<string>('')
    const [rootPath, setRootPath] = useState<string>('')
    const [libraryPath, setLibraryPath] = useState<string>('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    useEffect(() => {
        window.api.getSettings().then((settings: any) => {
            const libPath = settings.libraryPath;
            const separator = libPath.includes('\\') ? '\\' : '/';
            const moviesPath = `${libPath}${separator}movies`;

            setLibraryPath(libPath);
            setRootPath(moviesPath);

            if (!currentPath) {
                setCurrentPath(moviesPath);
            }
        })
    }, [])

    const handleCreateFolder = async (name: string) => {
        const separator = currentPath.includes('\\') ? '\\' : '/'
        const newPath = `${currentPath}${separator}${name}`

        try {
            const success = await window.api.createDirectory(newPath)
            if (!success) {
                alert('Failed to create directory')
            }
        } catch (error) {
            console.error(error)
            alert('Error creating directory')
        }
        setIsCreateModalOpen(false)
    }

    const handleNavigateUp = () => {
        if (currentPath === rootPath) return
        const separator = currentPath.includes('\\') ? '\\' : '/'
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf(separator))
        setCurrentPath(parentPath)
    }

    const getParentPath = (path: string) => {
        const separator = path.includes('\\') ? '\\' : '/'
        return path.substring(0, path.lastIndexOf(separator))
    }

    const currentItems = media.filter(item => {
        if (!currentPath) return false;

        const isChild = getParentPath(item.filepath) === currentPath;
        if (!isChild) return false;

        return item.type === 'directory' || item.type === 'video';
    })

    return (
        <div className="page videos-page">
            <header className="page-header">
                <div className="header-left">
                    <h1>Videos</h1>
                    {currentPath !== rootPath && (
                        <button onClick={handleNavigateUp} className="nav-btn">
                            ⬆ Up
                        </button>
                    )}
                    <span className="path-display" style={{ margin: 0 }}>
                        {currentPath.replace(libraryPath, '~')}
                    </span>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="btn-new-folder">
                    + New Folder
                </button>
            </header>

            <MediaGrid
                media={currentItems}
                onNavigate={(path) => setCurrentPath(path)}
            />

            <CreateFolderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateFolder}
            />
        </div>
    )
}
