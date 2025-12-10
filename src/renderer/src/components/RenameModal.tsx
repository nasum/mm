import { useState, useEffect, useRef } from 'react'

interface RenameModalProps {
    isOpen: boolean
    onClose: () => void
    onRename: (newName: string) => void
    currentName: string
}

export function RenameModal({ isOpen, onClose, onRename, currentName }: RenameModalProps) {
    const [name, setName] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setName(currentName)
            setTimeout(() => inputRef.current?.select(), 100)
        }
    }, [isOpen, currentName])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim() && name !== currentName) {
            onRename(name.trim())
        } else {
            onClose()
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Rename</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="modal-input"
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: '#fff' }}
                    />
                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary">Rename</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
