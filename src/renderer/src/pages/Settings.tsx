import { useState, useEffect } from 'react'

export function Settings() {
    const [libraryPath, setLibraryPath] = useState('')
    const [userDataPath, setUserDataPath] = useState('')

    useEffect(() => {
        window.api.getSettings().then((settings) => {
            setLibraryPath(settings.libraryPath)
        })
        window.api.getUserDataPath().then((path: string) => {
            setUserDataPath(path)
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

    const handleOpenUserData = () => {
        window.api.openUserDataFolder();
    }

    const handleChangeUserData = async () => {
        const newPath = await window.api.selectDirectory();
        if (newPath) {
            const confirmed = confirm('Changing the data location will restart the application. Existing data will be copied to the new location.\n\nContinue?');
            if (confirmed) {
                const success = await window.api.changeUserDataPath(newPath);
                if (!success) {
                    alert('Failed to change data location.');
                }
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

                <div className="settings-section">
                    <h2>System</h2>
                    <div className="settings-row">
                        <label className="settings-label">App Data Location (Database & Settings)</label>
                        <div className="path-display">{userDataPath}</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-secondary" onClick={handleOpenUserData}>
                                Open Folder
                            </button>
                            <button className="btn btn-secondary" onClick={handleChangeUserData}>
                                Change Location...
                            </button>
                        </div>
                        <p className="settings-note">
                            Note: Changing this requires a restart. Data will be moved automatically.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
