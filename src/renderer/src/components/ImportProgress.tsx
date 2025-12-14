import { useEffect, useState } from 'react'


interface ProgressData {
    status: 'processing' | 'completed' | 'error';
    filename: string;
    error?: string;
}

export function ImportProgress() {
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const removeListener = window.api.onImportProgress((_event, data) => {
            setProgress(data as ProgressData);
            setVisible(true);

            if (data.status === 'error') {
                // Keep error visible for longer
                setTimeout(() => setVisible(false), 5000);
            } else if (data.status === 'completed') {
                // Should handle completion signal if we emit one? 
                // Currently we only emit 'processing'.
                // Ideally, we'd want a "Done" message. 
                // But the main process loop finishes and returns.
                // We could rely on a timeout for now or update main to send 'completed'.
                // Since main sends 'processing' for each file, we know it's active.
            }
        });

        return () => {
            // Cleanup listener
            window.api.removeMediaListener('import-progress', removeListener as any);
        };
    }, []);

    // Auto-hide if no updates for a while? 
    // Or just use the fact that it's a stream of events.

    // Better UX: Show "Importing..." and the filename.
    // When done, maybe main process should send a "all-done" event?
    // For now, let's just show while 'processing'.

    useEffect(() => {
        if (progress?.status === 'processing') {
            const timer = setTimeout(() => {
                // If no new events come, hide it? No, wait for true completion.
                // But we don't have a completion event yet.
                // Let's just create a self-hiding mechanism for idle?
                setVisible(false);
            }, 3000); // Hide after 3s of inactivity (process likely done)
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [progress]);

    if (!visible || !progress) return null;

    const isError = progress.status === 'error';

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: isError ? '#cf6679' : '#333',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            maxWidth: '300px',
            transition: 'all 0.3s ease'
        }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {isError ? 'Import Error' : 'Importing...'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {progress.filename}
            </div>
            {isError && progress.error && (
                <div style={{ fontSize: '11px', marginTop: '4px', color: '#ffdddd' }}>
                    {progress.error}
                </div>
            )}
        </div>
    )
}
