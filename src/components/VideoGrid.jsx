import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { AlertCircle, CheckCircle, Clock, ThumbsUp, ThumbsDown, ExternalLink, Loader } from 'lucide-react'
import '../styles/VideoGrid.css'
import '../styles/VideoGridModal.css'

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
                    seedance_video_comment,
                    kling_video_comment,
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

    const [modalState, setModalState] = useState({
        isOpen: false,
        videoId: null,
        modelType: null,
        newStatus: null,
        comment: ''
    })

    const openModal = (id, modelType, currentStatus) => {
        setModalState({
            isOpen: true,
            videoId: id,
            modelType,
            newStatus: !currentStatus,
            comment: ''
        })
    }

    const closeModal = () => {
        setModalState({
            isOpen: false,
            videoId: null,
            modelType: null,
            newStatus: null,
            comment: ''
        })
    }

    const submitStatusChange = async () => {
        const { videoId, modelType, newStatus, comment } = modalState

        if (!comment.trim()) {
            alert('Please enter a comment.')
            return
        }

        try {
            const updateField = modelType === 'seedance' ? 'seedance_approved' : 'kling_approved'
            const commentField = modelType === 'seedance' ? 'seedance_video_comment' : 'kling_video_comment'

            const { error } = await supabase
                .from('generated_videos')
                .update({
                    [updateField]: newStatus,
                    [commentField]: comment
                })
                .eq('id', videoId)

            if (error) throw error

            setVideos(videos.map(v => v.id === videoId ? {
                ...v,
                [updateField]: newStatus,
                [commentField]: comment
            } : v))

            closeModal()
        } catch (error) {
            console.error(`Error updating ${modelType} status:`, error)
            alert('Failed to update status.')
        }
    }

    if (loading) return <div className="text-center p-8">Loading videos...</div>

    const pendingVideos = videos.filter(v => v.generation_status === 'pending')
    const failedVideos = videos.filter(v => v.generation_status === 'failed')
    const completedVideos = videos.filter(v => v.generation_status !== 'pending' && v.generation_status !== 'failed')

    const displayedVideos = activeTab === 'pending' ? pendingVideos : activeTab === 'failed' ? failedVideos : completedVideos

    return (
        <div className="video-grid-container">
            {modalState.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">
                            {modalState.newStatus ? 'Approve' : 'Disapprove'} Video
                        </h3>
                        <p className="modal-subtitle">
                            Please provide a reason or comment for this action.
                        </p>
                        <textarea
                            className="modal-textarea"
                            value={modalState.comment}
                            onChange={(e) => setModalState({ ...modalState, comment: e.target.value })}
                            placeholder="Enter your comment here..."
                            rows={4}
                        />
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                            <button className="btn-primary" onClick={submitStatusChange}>Submit</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="video-grid-header">
                <div className="header-text">
                    <h2 className="section-title">
                        {activeTab === 'pending' ? 'Generation Queue' : activeTab === 'failed' ? 'Failed Generations' : 'Generated Videos'}
                    </h2>
                    <p className="section-subtitle">
                        {activeTab === 'pending'
                            ? 'Tracking active AI generation processes'
                            : activeTab === 'failed'
                                ? 'Review videos that failed to generate'
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
                    <button
                        onClick={() => setActiveTab('failed')}
                        className={`tab-btn ${activeTab === 'failed' ? 'active' : ''}`}
                    >
                        Failed
                        <span className="tab-count">{failedVideos.length}</span>
                        {failedVideos.length > 0 && <span className="failed-dot" style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }} />}
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
                                onApprove={openModal}
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
                <div className="video-header-top">
                    <h3 className="video-title" title={video.video_title || 'Untitled'}>
                        {video.video_title ? (
                            video.video_title
                        ) : isPending ? (
                            <span className="generating-title">
                                <span className="dot-pulse" />
                                Generating Title...
                            </span>
                        ) : (
                            'Untitled Video'
                        )}
                    </h3>
                    {isPending && (
                        <div className="status-badge generating">
                            <span className="dot-ping" />
                            Generating
                        </div>
                    )}
                </div>

                <div className="video-meta-row">
                    <div className="video-meta">
                        <span>{video.duration_seconds ? `${Math.round(video.duration_seconds)}s` : 'N/A'}</span>
                        <span className="separator">•</span>
                        <span>{video.generated_at ? formatDate(video.generated_at) : 'Date Unknown'}</span>
                    </div>

                    {sourceUrl && (
                        <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="view-source-btn"
                            title="View Source Video"
                        >
                            <ExternalLink size={14} />
                            <span>View Source</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Side-by-Side Video Outputs */}
            <div className="video-outputs">
                {/* Seedance Video Output */}
                <div className="video-output-item">
                    <div className="video-header">
                        <span className="model-label seedance">Seedance</span>
                    </div>
                    <div className="video-wrapper">
                        {video.seedance_video_url ? (
                            <video
                                src={video.seedance_video_url}
                                controls
                                className="video-element"
                                preload="metadata"
                            />
                        ) : isPending ? (
                            <div className="shimmer-wrapper">
                                <div className="video-element relative bg-black flex items-center justify-center">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                        <Loader className="spin" size={24} color="#6366f1" />
                                        <span className="loading-text">Processing</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-video-placeholder">
                                <AlertCircle size={24} />
                                <span>No Output</span>
                            </div>
                        )}
                    </div>
                    {video.seedance_video_url && (
                        <div className="output-actions">
                            <button
                                onClick={() => onApprove(video.id, 'seedance', video.seedance_approved)}
                                className={`action-btn ${video.seedance_approved ? 'btn-disapprove' : 'btn-approve'}`}
                            >
                                {video.seedance_approved ? (
                                    <><ThumbsDown size={16} /> Disapprove</>
                                ) : (
                                    <><ThumbsUp size={16} /> Approve</>
                                )}
                            </button>
                            <div className={`video-comment ${!video.seedance_video_comment ? 'empty' : ''}`}>
                                {video.seedance_video_comment ? `"${video.seedance_video_comment}"` : "No comment available"}
                            </div>
                        </div>
                    )}
                </div>

                {/* Kling Video Output */}
                <div className="video-output-item">
                    <div className="video-header">
                        <span className="model-label kling">Kling</span>
                    </div>
                    <div className="video-wrapper">
                        {video.kling_video_url ? (
                            <video
                                src={video.kling_video_url}
                                controls
                                className="video-element"
                                preload="metadata"
                            />
                        ) : isPending ? (
                            <div className="shimmer-wrapper">
                                <div className="video-element relative bg-black flex items-center justify-center">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                        <Loader className="spin" size={24} color="#a855f7" />
                                        <span className="loading-text">Processing</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-video-placeholder">
                                <AlertCircle size={24} />
                                <span>No Output</span>
                            </div>
                        )}
                    </div>
                    {video.kling_video_url && (
                        <div className="output-actions">
                            <button
                                onClick={() => onApprove(video.id, 'kling', video.kling_approved)}
                                className={`action-btn ${video.kling_approved ? 'btn-disapprove' : 'btn-approve'}`}
                            >
                                {video.kling_approved ? (
                                    <><ThumbsDown size={16} /> Disapprove</>
                                ) : (
                                    <><ThumbsUp size={16} /> Approve</>
                                )}
                            </button>
                            <div className={`video-comment ${!video.kling_video_comment ? 'empty' : ''}`}>
                                {video.kling_video_comment ? `"${video.kling_video_comment}"` : "No comment available"}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Target Account Footer */}
            {video.target_account && (
                <div className="target-account-badge">
                    <span className="target-account-label">Target Account:</span>
                    <span className="truncate">
                        {typeof video.target_account === 'object' ? JSON.stringify(video.target_account) : video.target_account}
                    </span>
                </div>
            )}
        </div>
    )
}

export default VideoGrid
