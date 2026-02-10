import React, { useState } from 'react'
import { Upload, Link } from 'lucide-react'
import '../styles/VideoUpload.css'

const VideoUpload = () => {
    const [reelUrl, setReelUrl] = useState('')
    const [uploading, setUploading] = useState(false)
    const [responseJson, setResponseJson] = useState(null)

    // Use local proxy to avoid CORS issues
    const webhookUrl = '/api/n8n/webhook/ed9165ec-7dc6-4fcd-a4b8-2492b6aab8d0'

    const handleUpload = async () => {
        if (!reelUrl) return

        setUploading(true)
        setResponseJson(null)

        try {
            // 25 minute timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 25 * 60 * 1000)

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: reelUrl }),
                signal: controller.signal
            })

            clearTimeout(timeoutId)
            const text = await response.text()

            // Try to parse JSON and check generation_status
            try {
                const data = JSON.parse(text)
                const item = Array.isArray(data) ? data[0] : data

                if (item?.generation_status === 'started') {
                    setResponseJson('✅ Video generation started successfully!\n\nVisit the My Generations tab to track status.')
                } else if (item?.generation_status) {
                    setResponseJson(`Status: ${item.generation_status}\n\nPlease check back later.`)
                } else {
                    setResponseJson(text)
                }
            } catch {
                // Not JSON, show raw response
                setResponseJson(text)
            }

            setReelUrl('')
        } catch (error) {
            console.error('Upload error:', error)
            setResponseJson('Error: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="upload-container fade-in">
            <div className="upload-header">
                <h2 className="upload-title gradient-text">Import from Facebook Reel</h2>
                <p className="upload-subtitle">
                    Paste a public Facebook Reel URL. We will fetch the video, analyze it, and send it to your My Generations tab.
                </p>
            </div>

            <div className="upload-card">
                <div className="url-input-container">
                    <label htmlFor="reel-url" className="input-label">
                        Facebook Reel URL
                    </label>
                    <div className="input-wrapper">
                        <span className="input-icon">
                            <Link size={18} />
                        </span>
                        <input
                            id="reel-url"
                            type="url"
                            value={reelUrl}
                            onChange={(e) => setReelUrl(e.target.value)}
                            placeholder="https://www.facebook.com/reel/..."
                            className="url-input"
                            disabled={uploading}
                        />
                    </div>
                    <p className="input-helper">
                        Ensure the reel is public and accessible. Private or region-restricted content may fail to import.
                    </p>
                </div>

                {uploading && (
                    <div className="upload-steps">
                        <div className="step-item active">
                            <div className="step-icon">
                                <div className="step-spinner" />
                            </div>
                            <span>Processing... this can take up to a few minutes.</span>
                        </div>
                    </div>
                )}

                {responseJson && (
                    <div className="response-container">
                        <h4 className="response-title">Webhook response</h4>
                        <pre className="response-code">{responseJson}</pre>
                    </div>
                )}

                <div className="upload-actions">
                    <button
                        className="btn-primary"
                        onClick={handleUpload}
                        disabled={!reelUrl || uploading}
                    >
                        {uploading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Upload size={18} />
                                Import Video
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default VideoUpload

