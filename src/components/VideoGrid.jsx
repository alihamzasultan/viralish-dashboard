import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { AlertCircle, CheckCircle, Clock, ThumbsUp, ThumbsDown, Loader, Check, X, Maximize2, ExternalLink } from 'lucide-react'
import FullscreenVideoModal from './FullscreenVideoModal'
import '../styles/VideoGrid.css'
import '../styles/VideoGridModal.css'
import '../styles/FullscreenVideoModal.css'

const VideoGrid = () => {
    const [videos, setVideos] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('completed') // 'completed' or 'pending'
    const [fullscreenVideo, setFullscreenVideo] = useState({ isOpen: false, url: '', title: '' })

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
    const [approveModal, setApproveModal] = useState({
        isOpen: false,
        videoId: null,
        modelType: null
    })

    const openModal = (id, modelType, newStatus) => {
        setModalState({
            isOpen: true,
            videoId: id,
            modelType,
            newStatus,
            comment: ''
        })
    }

    const handleApprove = async (id, modelType) => {
        try {
            const updateField = modelType === 'seedance' ? 'seedance_approved' : 'kling_approved'
            const commentField = modelType === 'seedance' ? 'seedance_video_comment' : 'kling_video_comment'

            const { error } = await supabase
                .from('generated_videos')
                .update({
                    [updateField]: true
                })
                .eq('id', id)

            if (error) throw error

            setVideos(prev =>
                prev.map(v =>
                    v.id === id
                        ? {
                            ...v,
                            [updateField]: true,
                            // keep any existing comment unchanged
                            [commentField]: v[commentField]
                        }
                        : v
                )
            )
        } catch (error) {
            console.error(`Error approving ${modelType} video:`, error)
            alert('Failed to approve video.')
        }
    }

    const handleReviewClick = (id, modelType, newStatus) => {
        if (newStatus) {
            // Approve with confirmation modal
            setApproveModal({
                isOpen: true,
                videoId: id,
                modelType
            })
        } else {
            // Disapprove with comment modal
            openModal(id, modelType, newStatus)
        }
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

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader className="animate-spin" size={40} color="var(--accent-primary)" />
            <p className="text-secondary font-medium">Fetching high-quality generations...</p>
        </div>
    )

    const pendingVideos = videos.filter(v => v.generation_status === 'pending')
    const failedVideos = videos.filter(v => v.generation_status === 'failed')
    const completedVideos = videos.filter(v => v.generation_status !== 'pending' && v.generation_status !== 'failed')

    const displayedVideos = activeTab === 'pending' ? pendingVideos : activeTab === 'failed' ? failedVideos : completedVideos

    return (
        <div className="video-grid-container fade-in">
            <FullscreenVideoModal
                isOpen={fullscreenVideo.isOpen}
                videoUrl={fullscreenVideo.url}
                title={fullscreenVideo.title}
                onClose={() => setFullscreenVideo({ ...fullscreenVideo, isOpen: false })}
            />

            {approveModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">
                            Approve Video
                        </h3>
                        <p className="modal-subtitle">
                            Are you sure you want to approve this video to be posted?
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setApproveModal({ isOpen: false, videoId: null, modelType: null })}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={async () => {
                                    if (!approveModal.videoId || !approveModal.modelType) return
                                    await handleApprove(approveModal.videoId, approveModal.modelType)
                                    setApproveModal({ isOpen: false, videoId: null, modelType: null })
                                }}
                            >
                                Yes, approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalState.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">
                            Disapprove Video
                        </h3>
                        <p className="modal-subtitle">
                            Please provide a reason or comment for this rejection.
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
                    <h2 className="section-title gradient-text">
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

                <div className="video-tabs glass">
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
                    </button>
                </div>
            </div>

            {displayedVideos.length === 0 ? (
                <div className="empty-state py-20 text-center glass rounded-xl">
                    <Clock size={64} className="mx-auto mb-6 text-muted opacity-20" />
                    <p className="text-secondary text-lg">No {activeTab} videos found in your library.</p>
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
                                onApprove={handleReviewClick}
                                onFullscreen={(url, title) => setFullscreenVideo({ isOpen: true, url, title })}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

const VideoCard = ({ video, sourceUrl, onApprove, onFullscreen }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        })
    }

    const isPending = video.generation_status === 'pending'
    const hasSeedanceVideo = !!video.seedance_video_url
    const hasKlingVideo = !!video.kling_video_url

    return (
        <div className={`video-card slide-up ${isPending ? 'pending-card' : ''}`}>
            {/* Header with Info */}
            <div className="video-info p-6 border-b border-white border-opacity-5">
                <div className="video-header-top flex justify-between items-start mb-4">
                    <h3 className="video-title text-xl font-bold truncate pr-4" title={video.video_title || 'Untitled'}>
                        {video.video_title ? (
                            video.video_title
                        ) : isPending ? (
                            <span className="flex items-center gap-2 text-muted">
                                Not generated yet
                            </span>
                        ) : (
                            'Untitled Video'
                        )}
                    </h3>
                    <div className="flex items-center gap-3">
                        {isPending && (
                            <div className="status-badge flex items-center gap-2 px-3 py-1 bg-indigo-500 bg-opacity-20 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                                Processing
                            </div>
                        )}
                        {sourceUrl && (
                            <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-source-btn"
                                title="View Source Video"
                            >
                                <ExternalLink size={14} />
                                <span>View source</span>
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted">
                    <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{video.duration_seconds ? `${Math.round(video.duration_seconds)}s` : 'N/A'}</span>
                    </div>
                    <span className="w-1 h-1 bg-white bg-opacity-20 rounded-full" />
                    <span>{video.generated_at ? formatDate(video.generated_at) : 'Date Unknown'}</span>
                </div>
            </div>

            {/* Side-by-Side Video Outputs */}
            <div className="video-outputs">
                {/* Seedance Video Output */}
                <div className="video-output-item">
                    <div className="flex items-center justify-between mb-3 min-h-[32px]">
                        <span className="model-label seedance px-3 py-1 bg-indigo-500 bg-opacity-10 text-indigo-400 rounded-md text-[10px] font-black uppercase tracking-widest">Seedance</span>
                        <div className="action-icon-group flex gap-2">
                            {hasSeedanceVideo && (video.seedance_approved === null || video.seedance_approved === undefined) ? (
                                <>
                                    <button
                                        onClick={() => onApprove(video.id, 'seedance', true)}
                                        className="icon-btn btn-approve w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 bg-opacity-10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => onApprove(video.id, 'seedance', false)}
                                        className="icon-btn btn-disapprove w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500 bg-opacity-10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </>
                            ) : hasSeedanceVideo ? (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${video.seedance_approved ? 'bg-emerald-500 bg-opacity-20 text-emerald-500' : 'bg-rose-500 bg-opacity-20 text-rose-500'}`}>
                                    {video.seedance_approved ? <Check size={14} /> : <X size={14} />}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="video-wrapper">
                        {video.seedance_video_url ? (
                            <>
                                <video src={video.seedance_video_url} className="video-element" preload="metadata" />
                                <div className="video-overlay-actions">
                                    <button
                                        className="full-screen-btn"
                                        onClick={() => onFullscreen(video.seedance_video_url, `${video.video_title || 'Untitled'} - Seedance`)}
                                    >
                                        <Maximize2 size={16} />
                                        Full View
                                    </button>
                                </div>
                            </>
                        ) : isPending ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 bg-white bg-opacity-5 animate-pulse">
                                <Loader className="animate-spin text-indigo-500" size={24} />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Processing</span>
                            </div>
                        ) : (
                            <div className="empty-video-placeholder">
                                <AlertCircle size={24} className="opacity-20" />
                                <span className="text-xs font-bold opacity-30 uppercase tracking-widest">No Output</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        {video.seedance_video_comment ? (
                            <div className="text-xs text-muted italic line-clamp-2 bg-black bg-opacity-20 p-3 rounded-xl border-l-2 border-indigo-500">
                                "{video.seedance_video_comment}"
                            </div>
                        ) : (
                            <div className="h-8 flex items-center px-3 text-[10px] text-muted opacity-30 italic">No feedback added</div>
                        )}
                    </div>
                </div>

                {/* Kling Video Output */}
                <div className="video-output-item">
                    <div className="flex items-center justify-between mb-3 min-h-[32px]">
                        <span className="model-label kling px-3 py-1 bg-purple-500 bg-opacity-10 text-purple-400 rounded-md text-[10px] font-black uppercase tracking-widest">Kling</span>
                        <div className="action-icon-group flex gap-2">
                            {hasKlingVideo && (video.kling_approved === null || video.kling_approved === undefined) ? (
                                <>
                                    <button
                                        onClick={() => onApprove(video.id, 'kling', true)}
                                        className="icon-btn btn-approve w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 bg-opacity-10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => onApprove(video.id, 'kling', false)}
                                        className="icon-btn btn-disapprove w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500 bg-opacity-10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </>
                            ) : hasKlingVideo ? (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${video.kling_approved ? 'bg-emerald-500 bg-opacity-20 text-emerald-500' : 'bg-rose-500 bg-opacity-20 text-rose-500'}`}>
                                    {video.kling_approved ? <Check size={14} /> : <X size={14} />}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="video-wrapper">
                        {video.kling_video_url ? (
                            <>
                                <video src={video.kling_video_url} className="video-element" preload="metadata" />
                                <div className="video-overlay-actions">
                                    <button
                                        className="full-screen-btn"
                                        onClick={() => onFullscreen(video.kling_video_url, `${video.video_title || 'Untitled'} - Kling`)}
                                    >
                                        <Maximize2 size={16} />
                                        Full View
                                    </button>
                                </div>
                            </>
                        ) : isPending ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 bg-white bg-opacity-5 animate-pulse">
                                <Loader className="animate-spin text-purple-500" size={24} />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400">Processing</span>
                            </div>
                        ) : (
                            <div className="empty-video-placeholder">
                                <AlertCircle size={24} className="opacity-20" />
                                <span className="text-xs font-bold opacity-30 uppercase tracking-widest">No Output</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        {video.kling_video_comment ? (
                            <div className="text-xs text-muted italic line-clamp-2 bg-black bg-opacity-20 p-3 rounded-xl border-l-2 border-purple-500">
                                "{video.kling_video_comment}"
                            </div>
                        ) : (
                            <div className="h-8 flex items-center px-3 text-[10px] text-muted opacity-30 italic">No feedback added</div>
                        )}
                    </div>
                </div>
            </div>

            {video.target_account && (
                <div className="p-4 bg-black bg-opacity-30 border-t border-white border-opacity-5">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold">
                        <span className="text-muted">Target Account</span>
                        <span className="text-indigo-400 truncate max-w-[200px]">
                            {typeof video.target_account === 'object' ? video.target_account.handle || 'Link' : video.target_account}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VideoGrid
