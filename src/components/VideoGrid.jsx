import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { AlertCircle, CheckCircle, Clock, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react'
import '../styles/VideoGrid.css'

const VideoGrid = () => {
    const [videos, setVideos] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('completed') // 'completed' or 'pending'

    useEffect(() => {
        fetchVideos()
    }, [])

    useEffect(() => {
        const tabTitle = activeTab === 'pending' ? 'Work in Progress' : 'Generated Videos'
        document.title = `Viralish AI | ${tabTitle}`
    }, [activeTab])

    const fetchVideos = async () => {
        try {
            const { data, error } = await supabase
                .from('generated_videos')
                .select(`
                    *,
                    source_videos (
                        video_page_url
                    )
                `)
                .order('generated_at', { ascending: false })

            if (error) throw error
            setVideos(data || [])
        } catch (error) {
            console.error('Error fetching videos:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id, modelType, currentStatus) => {
        try {
            const newStatus = !currentStatus
            const updateField = modelType === 'seedance' ? 'seedance_approved' : 'kling_approved'

            const { error } = await supabase
                .from('generated_videos')
                .update({ [updateField]: newStatus })
                .eq('id', id)

            if (error) throw error

            setVideos(videos.map(v => v.id === id ? { ...v, [updateField]: newStatus } : v))
        } catch (error) {
            console.error(`Error updating ${modelType} approval status:`, error)
            alert('Failed to update status.')
        }
    }

    if (loading) return <div className="text-center p-8">Loading videos...</div>

    const pendingVideos = videos.filter(v => v.generation_status === 'pending')
    const completedVideos = videos.filter(v => v.generation_status !== 'pending')

    const displayedVideos = activeTab === 'pending' ? pendingVideos : completedVideos

    return (
        <div className="video-grid-container">
            <div className="video-grid-header">
                <div className="header-text">
                    <h2 className="section-title">
                        {activeTab === 'pending' ? 'Generation Queue' : 'Generated Videos'}
                    </h2>
                    <p className="section-subtitle">
                        {activeTab === 'pending'
                            ? 'Tracking active AI generation processes'
                            : 'Manage and approve your AI generated content'}
                    </p>
                </div>

                <div className="video-tabs">
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                    >
                        Completed
                        <span className="tab-count">{completedVideos.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                    >
                        Pending
                        <span className="tab-count">{pendingVideos.length}</span>
                        {pendingVideos.length > 0 && <span className="pending-dot" />}
                    </button>
                </div>
            </div>

            {displayedVideos.length === 0 ? (
                <div className="empty-state py-20 text-center">
                    <Clock size={48} className="mx-auto mb-4 text-gray-600 opacity-20" />
                    <p className="text-gray-500">No {activeTab} videos found.</p>
                </div>
            ) : (
                <div className="video-grid">
                    {displayedVideos.map((video) => {
                        const sourceData = video.source_videos;
                        const sourceUrl = Array.isArray(sourceData)
                            ? sourceData[0]?.video_page_url
                            : sourceData?.video_page_url;

                        return (
                            <VideoCard
                                key={video.id}
                                video={video}
                                sourceUrl={sourceUrl}
                                onApprove={handleApprove}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

const VideoCard = ({ video, sourceUrl, onApprove }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        })
    }

    const isPending = video.generation_status === 'pending'

    return (
        <div className={`video-card ${isPending ? 'pending-card' : ''}`}>
            {/* Header with Info */}
            <div className="video-info">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="video-title" title={video.video_title || 'Untitled'}>
                        {video.video_title ? (
                            video.video_title
                        ) : isPending ? (
                            <span className="flex items-center gap-2 text-indigo-400/70 italic font-medium">
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                                Generating Title...
                            </span>
                        ) : (
                            'Untitled Video'
                        )}
                    </h3>
                    <div className="flex gap-2">
                        {isPending && (
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
                                Generating
                            </div>
                        )}
                        {sourceUrl && (
                            <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="open-link-btn"
                                title="View Source Video"
                            >
                                <ExternalLink size={16} />
                            </a>
                        )}
                    </div>
                </div>

                <div className="video-meta">
                    <span>{video.duration_seconds ? `${Math.round(video.duration_seconds)}s` : 'N/A'}</span>
                    <span>•</span>
                    <span>{video.generated_at ? formatDate(video.generated_at) : 'Date Unknown'}</span>
                </div>
            </div>

            {/* Side-by-Side Video Outputs */}
            <div className="video-outputs">
                {/* Seedance Video Output */}
                <div className="video-output-item">
                    <div className="video-wrapper">
                        <div className="video-label">Seedance</div>
                        {video.seedance_video_url ? (
                            <video
                                src={video.seedance_video_url}
                                controls
                                className="video-element"
                                preload="metadata"
                            />
                        ) : isPending ? (
                            <div className="shimmer-wrapper">
                                <div className="shimmer-shine" />
                                <div className="video-element relative bg-black flex items-center justify-center">
                                    {video.thumbnail_url && (
                                        <img src={video.thumbnail_url} alt="Thumbnail" className="video-element opacity-40 blur-[2px]" />
                                    )}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                        <div className="spinner" />
                                        <span className="text-[10px] text-indigo-300 font-black uppercase tracking-widest text-center px-4">
                                            Generating Seedance...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-video-placeholder">
                                <AlertCircle size={24} />
                                <span>No Seedance Output</span>
                            </div>
                        )}
                    </div>
                    {video.seedance_video_url && (
                        <div className="output-actions">
                            <button
                                onClick={() => onApprove(video.id, 'seedance', video.seedance_approved)}
                                className={`btn-model-approve ${video.seedance_approved ? 'approved' : ''}`}
                            >
                                {video.seedance_approved ? (
                                    <><ThumbsDown size={14} /> Disapprove</>
                                ) : (
                                    <><ThumbsUp size={14} /> Approve</>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Kling Video Output */}
                <div className="video-output-item">
                    <div className="video-wrapper">
                        <div className="video-label">Kling</div>
                        {video.kling_video_url ? (
                            <video
                                src={video.kling_video_url}
                                controls
                                className="video-element"
                                preload="metadata"
                            />
                        ) : isPending ? (
                            <div className="shimmer-wrapper">
                                <div className="shimmer-shine" />
                                <div className="video-element relative bg-black flex items-center justify-center">
                                    {video.thumbnail_url && (
                                        <img src={video.thumbnail_url} alt="Thumbnail" className="video-element opacity-40 blur-[2px]" />
                                    )}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                        <div className="spinner" />
                                        <span className="text-[10px] text-purple-300 font-black uppercase tracking-widest text-center px-4">
                                            Generating Kling...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-video-placeholder">
                                <AlertCircle size={24} />
                                <span>No Kling Output</span>
                            </div>
                        )}
                    </div>
                    {video.kling_video_url && (
                        <div className="output-actions">
                            <button
                                onClick={() => onApprove(video.id, 'kling', video.kling_approved)}
                                className={`btn-model-approve ${video.kling_approved ? 'approved' : ''}`}
                            >
                                {video.kling_approved ? (
                                    <><ThumbsDown size={14} /> Disapprove</>
                                ) : (
                                    <><ThumbsUp size={14} /> Approve</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Target Account Badge */}
            {video.target_account && (
                <div className="px-3 pb-3">
                    <div className="target-account truncate">
                        Target: {typeof video.target_account === 'object' ? JSON.stringify(video.target_account) : video.target_account}
                    </div>
                </div>
            )}
        </div>
    )
}

export default VideoGrid
