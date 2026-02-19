import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Clock, CheckCircle, Loader, Upload, Sparkles, AlertCircle, Share2, Maximize2, PauseCircle, ExternalLink, Check, X, RefreshCw } from 'lucide-react'
import FullscreenVideoModal from './FullscreenVideoModal'
import '../styles/CustomVideos.css'
import '../styles/VideoGridModal.css'

const CustomVideos = () => {
    const [videos, setVideos] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('completed')
    const [uploadErrors, setUploadErrors] = useState({}) // track errors per video URL
    const [uploadingToPortal, setUploadingToPortal] = useState({}) // track loading per video URL
    const [fullscreenVideo, setFullscreenVideo] = useState({ isOpen: false, url: '', title: '' })
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, videoId: null, videoUrl: null, videoTitle: '', feedback: '', modelType: null })
    const [refreshing, setRefreshing] = useState(false)

    const portalWebhookUrl = '/api/n8n/webhook/dd407330-7555-472e-bcda-0b35994e1b16'

    useEffect(() => {
        fetchVideos()
    }, [])

    const fetchVideos = async () => {
        try {
            const { data, error } = await supabase
                .from('custom_videos')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setVideos(data || [])
        } catch (error) {
            console.error('Error fetching custom videos:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        try {
            const { data, error } = await supabase
                .from('custom_videos')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            setVideos(data || [])
        } catch (error) {
            console.error('Error refreshing custom videos:', error)
        } finally {
            setRefreshing(false)
        }
    }

    const handlePortalUpload = async (videoUrl, id, videoTitle) => {
        setUploadingToPortal(prev => ({ ...prev, [videoUrl]: true }))
        setUploadErrors(prev => ({ ...prev, [videoUrl]: null })) // Clear any previous error

        try {
            const response = await fetch(portalWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_url: videoUrl,
                    generation_id: id,
                    video_title: videoTitle
                }),
            })

            if (!response.ok) throw new Error('Failed to upload to portal')

            // Optionally show success state
            alert('✅ Video sent to portal successfully!')
        } catch (error) {
            console.error('Error uploading to portal:', error)
            setUploadErrors(prev => ({ ...prev, [videoUrl]: 'Portal upload failed. Please try again.' }))
        } finally {
            setUploadingToPortal(prev => ({ ...prev, [videoUrl]: false }))
        }
    }

    const handleReject = async () => {
        const { videoId, feedback, modelType } = feedbackModal
        if (!feedback.trim()) {
            alert('Please enter feedback before submitting.')
            return
        }
        const feedbackColumn = modelType === 'seedance' ? 'seedance_feedback' : 'kling_feedback'
        try {
            const { error } = await supabase
                .from('custom_videos')
                .update({ [feedbackColumn]: feedback })
                .eq('id', videoId)
            if (error) throw error
            setVideos(prev => prev.map(v => v.id === videoId ? { ...v, [feedbackColumn]: feedback } : v))
            setFeedbackModal({ isOpen: false, videoId: null, videoUrl: null, videoTitle: '', feedback: '', modelType: null })
        } catch (error) {
            console.error('Error saving feedback:', error)
            alert('Failed to save feedback.')
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'started':
                return <span className="status-badge started"><Loader size={12} className="spin" /> Processing</span>
            case 'prompts-done':
                return <span className="status-badge prompts-done"><Sparkles size={12} /> Generating</span>
            case 'done':
                return <span className="status-badge done"><CheckCircle size={12} /> Complete</span>
            case 'failed':
                return <span className="status-badge failed"><AlertCircle size={12} /> Failed</span>
            default:
                return <span className="status-badge pending"><Clock size={12} /> Pending</span>
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="loading-container">
                <Loader size={36} className="spin" style={{ color: '#6366f1' }} />
                <p>Loading your generations...</p>
            </div>
        )
    }

    if (videos.length === 0) {
        return (
            <div className="empty-state">
                <Sparkles size={56} style={{ color: '#6366f1', marginBottom: '1.5rem' }} />
                <h3>No Generations Yet</h3>
                <p>Import a video to start generating AI content.</p>
            </div>
        )
    }

    const pendingVideos = videos.filter(v => ['pending', 'started', 'prompts-done'].includes(v.generation_status))
    const failedVideos = videos.filter(v => v.generation_status === 'failed')
    const completedVideos = videos.filter(v => v.generation_status === 'done' || (v.seedance_output_url && v.kling_output_url))

    const displayedVideos = activeTab === 'pending' ? pendingVideos : activeTab === 'failed' ? failedVideos : completedVideos

    return (
        <div className="custom-videos-container">
            <FullscreenVideoModal
                isOpen={fullscreenVideo.isOpen}
                videoUrl={fullscreenVideo.url}
                title={fullscreenVideo.title}
                onClose={() => setFullscreenVideo({ ...fullscreenVideo, isOpen: false })}
            />

            {/* Feedback Rejection Modal */}
            {feedbackModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">Reject Video</h3>
                        <p className="modal-subtitle">
                            Please provide feedback for why this video is being rejected.
                        </p>
                        <textarea
                            className="modal-textarea"
                            value={feedbackModal.feedback}
                            onChange={(e) => setFeedbackModal({ ...feedbackModal, feedback: e.target.value })}
                            placeholder="Enter your feedback here..."
                            rows={4}
                        />
                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setFeedbackModal({ isOpen: false, videoId: null, videoUrl: null, videoTitle: '', feedback: '', modelType: null })}
                            >
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleReject}>
                                Submit Feedback
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="video-grid-header" style={{ marginBottom: '2rem' }}>
                <div className="header-text">
                    <h2 className="section-title">
                        {activeTab === 'pending' ? 'Processing Queue' : activeTab === 'failed' ? 'Failed Generations' : 'My Generations'}
                    </h2>
                    <p className="section-subtitle">
                        {activeTab === 'pending'
                            ? 'Tracking active generation processes'
                            : activeTab === 'failed'
                                ? 'Review generations that encountered errors'
                                : 'Manage your custom AI generated videos'}
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
                <button
                    className={`btn-refresh ${refreshing ? 'refreshing' : ''}`}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Refresh videos"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {displayedVideos.length === 0 ? (
                <div className="empty-state">
                    <Sparkles size={56} style={{ color: '#6366f1', marginBottom: '1.5rem', opacity: 0.5 }} />
                    <h3>No {activeTab} Generations</h3>
                    <p>
                        {activeTab === 'pending'
                            ? 'No videos are currently being generated.'
                            : activeTab === 'failed'
                                ? 'No failed generations found.'
                                : 'Import a video to start generating AI content.'}
                    </p>
                </div>
            ) : (
                <div className="custom-videos-grid">
                    {displayedVideos.map((video) => (
                        <div key={video.id} className="custom-video-card">
                            {/* Header */}
                            <div className="card-header">
                                <div className="card-meta">
                                    <span className="card-id">Generation #{video.id}</span>
                                    <h3 className="video-title-text">{video.video_title || 'Untitled Video'}</h3>
                                    <span className="card-date">{formatDate(video.created_at)}</span>
                                </div>
                                <div className="card-header-actions">
                                    {video.source_video_url && (
                                        <button
                                            className="btn-source-video"
                                            onClick={() =>
                                                setFullscreenVideo({
                                                    isOpen: true,
                                                    url: video.source_video_url,
                                                    title: `${video.video_title || 'Untitled Video'} - Source`
                                                })
                                            }
                                        >
                                            <ExternalLink size={14} />
                                            View Source
                                        </button>
                                    )}
                                    {getStatusBadge(video.generation_status)}
                                </div>
                            </div>

                            {/* Content */}
                            {(video.seedance_output_url || video.kling_output_url || video.generation_status === 'done' || video.generation_status === 'failed') ? (
                                <div className="video-outputs">
                                    {/* Seedance Output */}
                                    {video.seedance_output_url ? (
                                        <div className="video-output-item">
                                            <div className="video-wrapper">
                                                <div className="video-label">Seedance</div>
                                                <video
                                                    src={video.seedance_output_url}
                                                    className="video-element"
                                                    preload="metadata"
                                                />
                                                <div className="video-overlay-actions">
                                                    <button
                                                        className="full-screen-btn"
                                                        onClick={() =>
                                                            setFullscreenVideo({
                                                                isOpen: true,
                                                                url: video.seedance_output_url,
                                                                title: `${video.video_title || 'Untitled Video'} - Seedance`
                                                            })
                                                        }
                                                    >
                                                        <Maximize2 size={16} />
                                                        Full View
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="output-actions">
                                                {!video.seedance_feedback && (
                                                    <div className="review-actions">
                                                        <button
                                                            className={`icon-btn btn-cv-approve ${uploadingToPortal[video.seedance_output_url] ? 'uploading' : ''}`}
                                                            onClick={() => handlePortalUpload(video.seedance_output_url, video.id, video.video_title)}
                                                            disabled={uploadingToPortal[video.seedance_output_url]}
                                                            title="Approve & Schedule Post"
                                                        >
                                                            {uploadingToPortal[video.seedance_output_url] ? (
                                                                <Loader size={16} className="spin" />
                                                            ) : (
                                                                <Check size={16} />
                                                            )}
                                                        </button>
                                                        <button
                                                            className="icon-btn btn-cv-reject"
                                                            onClick={() => setFeedbackModal({
                                                                isOpen: true,
                                                                videoId: video.id,
                                                                videoUrl: video.seedance_output_url,
                                                                videoTitle: video.video_title || 'Untitled Video',
                                                                feedback: '',
                                                                modelType: 'seedance'
                                                            })}
                                                            title="Reject with Feedback"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                                {video.seedance_feedback && (
                                                    <div className="feedback-display-inline">
                                                        <span className="feedback-label">Feedback</span>
                                                        <p className="feedback-text">"{video.seedance_feedback}"</p>
                                                    </div>
                                                )}
                                                {uploadErrors[video.seedance_output_url] && (
                                                    <div className="upload-error-msg">
                                                        <AlertCircle size={12} />
                                                        <span>{uploadErrors[video.seedance_output_url]}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="video-output-item">
                                            <div className="video-wrapper">
                                                <div className="video-label">Seedance</div>
                                                <div className="video-placeholder-content">
                                                    {video.generation_status === 'failed' ? (
                                                        <><AlertCircle size={20} /><span>Generation Failed</span></>
                                                    ) : (
                                                        <><PauseCircle size={20} style={{ color: '#f59e0b' }} /><span style={{ color: '#fbbf24' }}>Seedance is Paused</span></>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Kling Output */}
                                    {video.kling_output_url ? (
                                        <div className="video-output-item">
                                            <div className="video-wrapper">
                                                <div className="video-label">Kling</div>
                                                <video
                                                    src={video.kling_output_url}
                                                    className="video-element"
                                                    preload="metadata"
                                                />
                                                <div className="video-overlay-actions">
                                                    <button
                                                        className="full-screen-btn"
                                                        onClick={() =>
                                                            setFullscreenVideo({
                                                                isOpen: true,
                                                                url: video.kling_output_url,
                                                                title: `${video.video_title || 'Untitled Video'} - Kling`
                                                            })
                                                        }
                                                    >
                                                        <Maximize2 size={16} />
                                                        Full View
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="output-actions">
                                                {!video.kling_feedback && (
                                                    <div className="review-actions">
                                                        <button
                                                            className={`icon-btn btn-cv-approve ${uploadingToPortal[video.kling_output_url] ? 'uploading' : ''}`}
                                                            onClick={() => handlePortalUpload(video.kling_output_url, video.id, video.video_title)}
                                                            disabled={uploadingToPortal[video.kling_output_url]}
                                                            title="Approve & Schedule Post"
                                                        >
                                                            {uploadingToPortal[video.kling_output_url] ? (
                                                                <Loader size={16} className="spin" />
                                                            ) : (
                                                                <Check size={16} />
                                                            )}
                                                        </button>
                                                        <button
                                                            className="icon-btn btn-cv-reject"
                                                            onClick={() => setFeedbackModal({
                                                                isOpen: true,
                                                                videoId: video.id,
                                                                videoUrl: video.kling_output_url,
                                                                videoTitle: video.video_title || 'Untitled Video',
                                                                feedback: '',
                                                                modelType: 'kling'
                                                            })}
                                                            title="Reject with Feedback"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                                {video.kling_feedback && (
                                                    <div className="feedback-display-inline">
                                                        <span className="feedback-label">Feedback</span>
                                                        <p className="feedback-text">"{video.kling_feedback}"</p>
                                                    </div>
                                                )}
                                                {uploadErrors[video.kling_output_url] && (
                                                    <div className="upload-error-msg">
                                                        <AlertCircle size={12} />
                                                        <span>{uploadErrors[video.kling_output_url]}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="video-output-item">
                                            <div className="video-wrapper">
                                                <div className="video-label">Kling</div>
                                                <div className="video-placeholder-content">
                                                    {video.generation_status === 'failed' ? (
                                                        <><AlertCircle size={20} /><span>Generation Failed</span></>
                                                    ) : (
                                                        <><Loader size={20} className="spin" /><span>Generating...</span></>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : video.generation_status === 'failed' ? (
                                <div className="processing-placeholder failed">
                                    <div className="processing-icon failed">
                                        <AlertCircle size={24} style={{ color: '#ef4444' }} />
                                    </div>
                                    <p className="processing-text" style={{ color: '#f87171' }}>
                                        Generation failed.\nPlease try uploading again.
                                    </p>
                                </div>
                            ) : (
                                <div className="processing-placeholder">
                                    <div className="processing-icon">
                                        <Loader size={24} className="spin" style={{ color: '#8b5cf6' }} />
                                    </div>
                                    <p className="processing-text">
                                        {video.generation_status === 'started' && 'Generating prompts...\nThis may take a few minutes.'}
                                        {video.generation_status === 'prompts-done' && 'Generating video outputs...\nAlmost there!'}
                                        {!video.generation_status && 'Waiting to start processing...'}
                                    </p>
                                </div>
                            )}



                            {/* Posted Status */}
                            {video.posted && (
                                <div className="posted-status-footer">
                                    <div className="posted-status-item success">
                                        <div className="status-info">
                                            <CheckCircle size={14} />
                                            <span>Posted {video.posted_at && `on ${formatDate(video.posted_at)}`}</span>
                                        </div>
                                        {video.post_url && !video.post_url.includes('upload-failed') && (
                                            <a href={video.post_url} target="_blank" rel="noopener noreferrer" className="view-post-link">
                                                View Post <Share2 size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default CustomVideos
