import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { AlertCircle, CheckCircle, Clock, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react'
import '../styles/VideoGrid.css'

const VideoGrid = () => {
    const [videos, setVideos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchVideos()
    }, [])

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

    if (videos.length === 0) {
        return (
            <div className="text-center p-8">
                <h2 className="section-title">Generated Videos</h2>
                <div className="empty-state">
                    <p>No videos found in the database.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="video-grid-container">
            <h2 className="section-title">Generated Videos</h2>
            <div className="video-grid">
                {videos.map((video) => {
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
        </div>
    )
}

const VideoCard = ({ video, sourceUrl, onApprove }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        })
    }

    return (
        <div className="video-card">
            {/* Header with Info */}
            <div className="video-info">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="video-title" title={video.video_title || 'Untitled'}>
                        {video.video_title || 'Untitled Video'}
                    </h3>
                    <div className="flex gap-2">
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
                {/* Seedance Video */}
                <div className="video-output-item">
                    <div className="video-wrapper">
                        <div className="video-label">Seedance</div>
                        {video.seedance_video_url ? (
                            <video src={video.seedance_video_url} controls className="video-element" preload="metadata" />
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

                {/* Kling Video */}
                <div className="video-output-item">
                    <div className="video-wrapper">
                        <div className="video-label">Kling</div>
                        {video.kling_video_url ? (
                            <video src={video.kling_video_url} controls className="video-element" preload="metadata" />
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
