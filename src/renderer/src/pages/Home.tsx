import { useNavigate } from 'react-router-dom'


export function Home() {
    const navigate = useNavigate()

    return (
        <div className="page home-page">
            <header className="page-header">
                <h1>Home</h1>
            </header>

            <div className="dashboard-content">
                <div className="dashboard-card" onClick={() => navigate('/photos')}>
                    <div className="card-icon">🖼️</div>
                    <h2>Photos</h2>
                    <p>View your image collection</p>
                </div>

                <div className="dashboard-card" onClick={() => navigate('/videos')}>
                    <div className="card-icon">🎬</div>
                    <h2>Videos</h2>
                    <p>View your video collection</p>
                </div>
            </div>
        </div>
    )
}
