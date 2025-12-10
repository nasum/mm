import { useState, useEffect, useRef } from 'react'

interface CreateFolderModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (name: string) => void
}

export function CreateFolderModal({ isOpen, onClose, onCreate }: CreateFolderModalProps) {
    const [folderName, setFolderName] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setFolderName('')
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (folderName.trim()) {
            onCreate(folderName.trim())
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Create New Folder</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="Folder Name"
                        className="modal-input"
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: '#fff' }}
                    />
                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary">Create</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
