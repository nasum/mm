import { useState, useEffect } from 'react'

export function Settings() {
    const [libraryPath, setLibraryPath] = useState('')

    useEffect(() => {
        window.api.getSettings().then((settings) => {
            setLibraryPath(settings.libraryPath)
        })
    }, [])

    const handleChangePath = async () => {
        const newPath = await window.api.selectDirectory();
        if (newPath) {
            const success = await window.api.setLibraryPath(newPath);
            if (success) {
                setLibraryPath(newPath);
            }
        }
    }

    return (
        <div className="page settings-page">
            <header className="page-header">
                <h1>Settings</h1>
            </header>

            <div className="page-content">
                <div className="settings-section">
                    <h2>Library</h2>
                    <div className="settings-row">
                        <label className="settings-label">Library Location</label>
                        <div className="path-display">{libraryPath}</div>
                        <button className="btn btn-secondary" onClick={handleChangePath}>
                            Change Location...
                        </button>
                        <p className="settings-note">
                            Note: Changing location will clear the current index.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
