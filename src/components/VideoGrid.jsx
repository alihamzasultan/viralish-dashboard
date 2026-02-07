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

    const handleApprove = async (id, currentStatus) => {
        try {
            const newStatus = !currentStatus
            const { error } = await supabase
                .from('generated_videos')
                .update({ approved: newStatus })
                .eq('id', id)

            if (error) throw error

            setVideos(videos.map(v => v.id === id ? { ...v, approved: newStatus } : v))
        } catch (error) {
            console.error('Error updating approval status:', error)
            alert('Failed to update status.')
        }
    }

    // Helper to determine video source
    const getVideoSource = (video) => {
        if (video.cloudinary_video_url) return { src: video.cloudinary_video_url, type: 'direct' };
        if (video.secure_url) return { src: video.secure_url, type: 'direct' };
        if (video.url) return { src: video.url, type: 'direct' };
        return null;
    };

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
        <div>
            <h2 className="section-title">Generated Videos</h2>
            <div className="video-grid">
                {videos.map((video) => {
                    const videoSource = getVideoSource(video);
                    const sourceData = video.source_videos;
                    const sourceUrl = Array.isArray(sourceData)
                        ? sourceData[0]?.video_page_url
                        : sourceData?.video_page_url;

                    return (
                        <VideoCard
                            key={video.id}
                            video={video}
                            videoSource={videoSource}
                            sourceUrl={sourceUrl}
                            onApprove={handleApprove}
                        />
                    )
                })}
            </div>
        </div>
    )
}

const VideoCard = ({ video, videoSource, sourceUrl, onApprove }) => {
    const [showSource, setShowSource] = useState(false);

    // Determine source video type
    // If sourceUrl contains drive link pattern, treat as drive embed
    const isSourceDrive = sourceUrl && (sourceUrl.includes('drive.google.com') || sourceUrl.includes('/d/'));

    const activeUrl = showSource ? sourceUrl : videoSource?.src;
    const isDriveEmbed = (showSource && isSourceDrive) || (!showSource && videoSource?.type === 'drive');

    // Helper to get embeddable drive URL if needed
    const getDriveEmbedUrl = (url) => {
        if (!url) return null;
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
        }
        return url; // Fallback to original if regex fails, though likely won't work in iframe if not preview link
    };

    const finalSrc = isDriveEmbed ? getDriveEmbedUrl(activeUrl) : activeUrl;

    return (
        <div className="video-card">
            <div className="video-thumbnail">
                {finalSrc ? (
                    isDriveEmbed ? (
                        <iframe
                            src={finalSrc}
                            className="video-element w-full h-full border-0"
                            allow="autoplay"
                            title={showSource ? 'Source Video' : (typeof video.video_title === 'string' ? video.video_title : 'Video')}
                        ></iframe>
                    ) : (
                        <video
                            src={finalSrc}
                            controls
                            className="video-element"
                            poster={!showSource ? video.video_title?.thumbnail_url : undefined}
                            onError={(e) => console.error(`Error loading ${showSource ? 'source' : 'generated'} video:`, e)}
                            preload="metadata"
                        />
                    )
                ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                        {showSource ? 'No Source URL' : 'No Preview'}
                    </div>
                )}

                <div className="status-badge">
                    {video.posted ? (
                        <span className="badge success"><CheckCircle size={12} /> Posted</span>
                    ) : video.failed ? (
                        <span className="badge error"><AlertCircle size={12} /> Failed</span>
                    ) : (
                        <span className="badge pending"><Clock size={12} /> Ready</span>
                    )}
                </div>

                {/* Comparison Toggle Removed */}
            </div>

            <div className="video-info">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="video-title" title={typeof video.video_title === 'string' ? video.video_title : 'Untitled'}>
                        {typeof video.video_title === 'string' ? video.video_title : 'Untitled Video'}
                    </h3>
                    <a
                        href={video.cloudinary_video_url || video.google_drive_url || video.secure_url || video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="open-link-btn"
                        title="Open in new tab"
                    >
                        <ExternalLink size={16} />
                    </a>
                </div>

                <div className="video-meta">
                    <span>{video.duration_seconds ? `${Math.round(video.duration_seconds)}s` : 'N/A'}</span>
                    <span>•</span>
                    <span>{video.generated_at ? new Date(video.generated_at).toLocaleDateString() : 'Date Unknown'}</span>
                </div>

                <div className="approval-section">
                    <span className={video.approved ? 'status-text approved' : 'status-text not-approved'}>
                        {video.approved ? 'Approved' : 'Not Approved'}
                    </span>
                    <div className="flex gap-2">
                        {sourceUrl && (
                            <button
                                className="action-btn source-btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.open(sourceUrl, '_blank');
                                }}
                                title="Open Source Video"
                            >
                                <ExternalLink size={14} />
                                Source
                            </button>
                        )}
                        <button
                            onClick={() => onApprove(video.id, video.approved)}
                            className={`action-btn ${video.approved ? 'disapprove' : 'approve'}`}
                        >
                            {video.approved ? (
                                <><ThumbsDown size={14} /> Disapprove</>
                            ) : (
                                <><ThumbsUp size={14} /> Approve</>
                            )}
                        </button>
                    </div>
                </div>

                {video.target_account && (
                    <div className="target-account mt-2 truncate max-w-full">
                        Target: {typeof video.target_account === 'object' ? JSON.stringify(video.target_account) : video.target_account}
                    </div>
                )}
            </div>
        </div>
    )
}

export default VideoGrid
