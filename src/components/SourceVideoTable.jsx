import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Search, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import '../styles/SourceVideoTable.css'

const SourceVideoTable = () => {
    const [sources, setSources] = useState([])
    const [loading, setLoading] = useState(true)

    // Tab states
    const [processedTab, setProcessedTab] = useState('pending') // 'pending' | 'processed'
    const [analyzedTab, setAnalyzedTab] = useState('pending')   // 'pending' | 'analyzed'

    useEffect(() => {
        fetchSources()
    }, [])

    const fetchSources = async () => {
        try {
            const { data, error } = await supabase
                .from('source_videos')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setSources(data || [])
        } catch (error) {
            console.error('Error fetching sources:', error)
        } finally {
            setLoading(false)
        }
    }

    const getProcessedVideos = () => {
        return sources.filter(v => processedTab === 'processed' ? v.processed : !v.processed)
    }

    const renderTable = (videos) => (
        <div className="table-container">
            <div className="table-scroll">
                <table className="source-table">
                    <thead>
                        <tr>
                            <th>Video URL</th>
                            <th>Views</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {videos.length > 0 ? (
                            videos.map((video) => (
                                <tr key={video.id}>
                                    <td>
                                        <a href={video.video_page_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 max-w-xs truncate block" title={video.video_page_url}>
                                            {video.video_page_url || 'No URL'}
                                        </a>
                                    </td>
                                    <td>{video.view_count?.toLocaleString() || '-'}</td>
                                    <td>
                                        <span className={`status-pill ${video.processed ? 'processed' : 'pending'}`}>
                                            {video.processed ? 'Processed' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="text-center py-8 text-gray-500">
                                    No videos found in this category.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )

    if (loading) return <div className="text-center p-8">Loading sources...</div>

    return (
        <div className="space-y-12">
            {/* Section 1: Processing Status */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="section-title mb-0">Processing Queue</h2>
                    <div className="tabs">
                        <button
                            className={`tab-btn ${processedTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setProcessedTab('pending')}
                        >
                            <Clock size={16} /> Pending
                            <span className="count-badge">{sources.filter(v => !v.processed).length}</span>
                        </button>
                        <button
                            className={`tab-btn ${processedTab === 'processed' ? 'active' : ''}`}
                            onClick={() => setProcessedTab('processed')}
                        >
                            <CheckCircle size={16} /> Processed
                            <span className="count-badge">{sources.filter(v => v.processed).length}</span>
                        </button>
                    </div>
                </div>
                {renderTable(getProcessedVideos())}
            </section>
        </div>
    )
}

export default SourceVideoTable
