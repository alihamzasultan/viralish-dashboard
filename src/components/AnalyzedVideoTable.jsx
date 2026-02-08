import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Search, Filter, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import '../styles/SourceVideoTable.css'

const AnalyzedVideoTable = () => {
    const [sources, setSources] = useState([])
    const [loading, setLoading] = useState(true)
    const [analyzedTab, setAnalyzedTab] = useState('analyzed')   // 'pending' | 'analyzed'

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

    const getAnalyzedVideos = () => {
        return sources.filter(v => analyzedTab === 'analyzed' ? v.video_analyzed : !v.video_analyzed)
    }

    const renderTable = (videos) => (
        <div className="table-container">
            <div className="table-scroll">
                <table className="source-table">
                    <thead>
                        <tr>
                            <th className="thumbnail-cell">Preview</th>
                            <th>Video URL</th>
                            <th>Views</th>
                            <th>Analysis</th>
                            <th>Processing</th>
                        </tr>
                    </thead>
                    <tbody>
                        {videos.length > 0 ? (
                            videos.map((video) => (
                                <tr key={video.id}>
                                    <td className="thumbnail-cell">
                                        <div className="thumbnail-container">
                                            {(video.first_frame_url || video.thumbnail_url) ? (
                                                <img
                                                    src={video.first_frame_url || video.thumbnail_url}
                                                    alt="Preview"
                                                    className="thumbnail-preview"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div className="thumbnail-placeholder" style={{ display: (video.first_frame_url || video.thumbnail_url) ? 'none' : 'flex' }}>
                                                <AlertCircle size={16} />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <a href={video.video_page_url} target="_blank" rel="noopener noreferrer" className="source-link-badge" title={video.video_page_url}>
                                            View Source Video <ExternalLink size={12} />
                                        </a>
                                    </td>
                                    <td>{video.view_count?.toLocaleString() || '-'}</td>
                                    <td>
                                        <span className={`status-pill ${video.video_analyzed ? 'analyzed' : 'pending'}`}>
                                            {video.video_analyzed ? 'Analyzed' : 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${video.processed ? 'processed' : 'pending'}`}>
                                            {video.processed ? 'Processed' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-8 text-gray-500">
                                    No videos found in this category.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )

    if (loading) return <div className="text-center p-8">Loading analysis data...</div>

    return (
        <div className="space-y-12">
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="section-title mb-0">Analysis Queue</h2>
                    <div className="tabs">
                        <button
                            className={`tab-btn ${analyzedTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setAnalyzedTab('pending')}
                        >
                            <AlertCircle size={16} /> Not Analyzed
                            <span className="count-badge">{sources.filter(v => !v.video_analyzed).length}</span>
                        </button>
                        <button
                            className={`tab-btn ${analyzedTab === 'analyzed' ? 'active' : ''}`}
                            onClick={() => setAnalyzedTab('analyzed')}
                        >
                            <CheckCircle size={16} /> Analyzed
                            <span className="count-badge">{sources.filter(v => v.video_analyzed).length}</span>
                        </button>
                    </div>
                </div>
                {renderTable(getAnalyzedVideos())}
            </section>
        </div>
    )
}

export default AnalyzedVideoTable
