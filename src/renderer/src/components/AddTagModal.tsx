import { useState, useEffect, useRef } from 'react'
import { Tag } from '../types'

interface AddTagModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (tagName: string) => void
    existingTags: Tag[]
}

export function AddTagModal({ isOpen, onClose, onAdd, existingTags }: AddTagModalProps) {
    const [tagName, setTagName] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setTagName('')
            setTimeout(() => {
                inputRef.current?.focus()
            }, 100)
        }
    }, [isOpen])

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!tagName.trim()) return
        onAdd(tagName.trim())
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Add Tag to Selected Items</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={tagName}
                            onChange={e => setTagName(e.target.value)}
                            placeholder="Enter tag name"
                            list="bulk-tag-suggestions"
                            className="modal-input"
                            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
                        />
                        <datalist id="bulk-tag-suggestions">
                            {existingTags.map(t => (
                                <option key={t.id} value={t.name} />
                            ))}
                        </datalist>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={!tagName.trim()}>Add Tag</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
