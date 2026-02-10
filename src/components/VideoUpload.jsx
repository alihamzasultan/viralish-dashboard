import React, { useState } from 'react'
import { Upload, Link, Loader, CheckCircle, AlertCircle } from 'lucide-react'
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
                    setResponseJson('✅ Video generation started successfully!\n\nVisit the custom videos tab for viewing the status.')
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
        <div className="upload-container">
            <h2 className="section-title">Import from Facebook Reel</h2>

            <div className="upload-card">
                <div className="url-input-container" style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="reel-url" className="input-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#e5e7eb' }}>
                        Facebook Reel URL
                    </label>
                    <div className="input-wrapper" style={{ position: 'relative' }}>
                        <div className="input-icon" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                            <Link size={20} />
                        </div>
                        <input
                            id="reel-url"
                            type="url"
                            value={reelUrl}
                            onChange={(e) => setReelUrl(e.target.value)}
                            placeholder="https://www.facebook.com/reel/..."
                            className="url-input"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 3rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #374151',
                                backgroundColor: '#1f2937',
                                color: '#fff',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            disabled={uploading}
                        />
                    </div>
                </div>

                {/* Show loading spinner while uploading */}
                {uploading && (
                    <div className="upload-steps">
                        <div className="step-item active">
                            <div className="step-icon">
                                <div className="step-spinner"></div>
                            </div>
                            <span>Processing... Please wait for response</span>
                        </div>
                    </div>
                )}

                {/* Show response when received */}
                {responseJson && (
                    <div className="response-container">
                        <h4 style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>Response:</h4>
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

            <div className="mt-8 text-sm text-gray-500 text-center">
                <p>Provide a Facebook Reel URL to start the processing workflow.</p>
            </div>
        </div>
    )
}

export default VideoUpload

