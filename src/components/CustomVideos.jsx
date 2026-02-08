import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Clock, CheckCircle, Loader, Upload, Sparkles, AlertCircle, Share2 } from 'lucide-react'
import '../styles/CustomVideos.css'

const CustomVideos = () => {
    const [videos, setVideos] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploadingToPortal, setUploadingToPortal] = useState({}) // track loading per video URL

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

    const handlePortalUpload = async (videoUrl, id, videoTitle) => {
        setUploadingToPortal(prev => ({ ...prev, [videoUrl]: true }))
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
            alert('❌ Failed to upload to portal. Please try again.')
        } finally {
            setUploadingToPortal(prev => ({ ...prev, [videoUrl]: false }))
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
                <p>Upload a video to start generating AI content.</p>
            </div>
        )
    }

    return (
        <div className="custom-videos-container">
            <div className="custom-videos-grid">
                {videos.map((video) => (
                    <div key={video.id} className="custom-video-card">
                        {/* Header */}
                        <div className="card-header">
                            <div className="card-meta">
                                <span className="card-id">Generation #{video.id}</span>
                                <h3 className="video-title-text">{video.video_title || 'Untitled Video'}</h3>
                                <span className="card-date">{formatDate(video.created_at)}</span>
                            </div>
                            {getStatusBadge(video.generation_status)}
                        </div>

                        {/* Content */}
                        {(video.seedance_output_url || video.kling_output_url || video.generation_status === 'done' || video.generation_status === 'failed') ? (
                            <div className="video-outputs">
                                {/* Seedance Output */}
                                {video.seedance_output_url ? (
                                    <div className="video-output-item">
                                        <div className="video-label">Seedance Output</div>
                                        <div className="video-wrapper">
                                            <video src={video.seedance_output_url} controls />
                                        </div>
                                        <div className="output-actions">
                                            <button
                                                className={`btn-upload-small ${uploadingToPortal[video.seedance_output_url] ? 'uploading' : ''}`}
                                                onClick={() => handlePortalUpload(video.seedance_output_url, video.id, video.video_title)}
                                                disabled={uploadingToPortal[video.seedance_output_url]}
                                            >
                                                {uploadingToPortal[video.seedance_output_url] ? (
                                                    <Loader size={14} className="spin" />
                                                ) : (
                                                    <Upload size={14} />
                                                )}
                                                {uploadingToPortal[video.seedance_output_url] ? 'Uploading...' : 'Upload'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="video-output-item pending">
                                        <div className="video-label">Seedance Output</div>
                                        <div className="output-status">
                                            {video.generation_status === 'failed' ? (
                                                <span className="status-failed"><AlertCircle size={14} /> Generation Failed</span>
                                            ) : (
                                                <span className="status-pending"><Loader size={14} className="spin" /> Generating...</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Kling Output */}
                                {video.kling_output_url ? (
                                    <div className="video-output-item">
                                        <div className="video-label">Kling Output</div>
                                        <div className="video-wrapper">
                                            <video src={video.kling_output_url} controls />
                                        </div>
                                        <div className="output-actions">
                                            <button
                                                className={`btn-upload-small ${uploadingToPortal[video.kling_output_url] ? 'uploading' : ''}`}
                                                onClick={() => handlePortalUpload(video.kling_output_url, video.id, video.video_title)}
                                                disabled={uploadingToPortal[video.kling_output_url]}
                                            >
                                                {uploadingToPortal[video.kling_output_url] ? (
                                                    <Loader size={14} className="spin" />
                                                ) : (
                                                    <Upload size={14} />
                                                )}
                                                {uploadingToPortal[video.kling_output_url] ? 'Uploading...' : 'Upload'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="video-output-item pending">
                                        <div className="video-label">Kling Output</div>
                                        <div className="output-status">
                                            {video.generation_status === 'failed' ? (
                                                <span className="status-failed"><AlertCircle size={14} /> Generation Failed</span>
                                            ) : (
                                                <span className="status-pending"><Loader size={14} className="spin" /> Generating...</span>
                                            )}
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
                        {(video.posted || (video.post_url && video.post_url.includes('upload-failed'))) && (
                            <div className="posted-status-footer">
                                {video.post_url && video.post_url.includes('upload-failed') ? (
                                    <div className="posted-status-item failed">
                                        <AlertCircle size={14} />
                                        <span>Portal upload failed. Please try again.</span>
                                    </div>
                                ) : (
                                    <div className="posted-status-item success">
                                        <div className="status-info">
                                            <CheckCircle size={14} />
                                            <span>Posted {video.posted_at && `on ${formatDate(video.posted_at)}`}</span>
                                        </div>
                                        {video.post_url && (
                                            <a href={video.post_url} target="_blank" rel="noopener noreferrer" className="view-post-link">
                                                View Post <Share2 size={12} />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default CustomVideos
