import React, { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle, FileVideo, Loader } from 'lucide-react'
import '../styles/VideoUpload.css'

const VideoUpload = () => {
    const [file, setFile] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState(null) // 'success' | 'error' | null
    const [message, setMessage] = useState('')
    const [responseJson, setResponseJson] = useState(null)
    const fileInputRef = useRef(null)

    // Use local proxy to avoid CORS issues
    const webhookUrl = '/api/n8n/webhook/ed9165ec-7dc6-4fcd-a4b8-2492b6aab8d0'

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFiles = e.dataTransfer.files

        if (droppedFiles.length > 0) {
            validateAndSetFile(droppedFiles[0])
        }
    }

    const validateAndSetFile = (selectedFile) => {
        // Reset status
        setStatus(null)
        setMessage('')

        // Check if file is a video
        if (!selectedFile.type.startsWith('video/')) {
            setStatus('error')
            setMessage('Please upload a valid video file.')
            return
        }

        setFile(selectedFile)
    }

    const handleFileSelect = (e) => {
        if (e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0])
        }
    }

    const removeFile = () => {
        setFile(null)
        setStatus(null)
        setMessage('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setResponseJson(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('filename', file.name)
        formData.append('type', file.type)

        try {
            // 25 minute timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 25 * 60 * 1000)

            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: formData,
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

            setFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''

        } catch (error) {
            console.error('Upload error:', error)
            setResponseJson('Error: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="upload-container">
            <h2 className="section-title">Upload Video</h2>

            <div className="upload-card">
                {!file ? (
                    <div
                        className={`upload-area ${isDragging ? 'drag-active' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="video/*"
                            onChange={handleFileSelect}
                        />
                        <Upload size={48} className="upload-icon" />
                        <span className="upload-text">Click to upload or drag and drop</span>
                        <span className="upload-subtext">MP4, MOV, or WEBM (Max size dependent on server)</span>
                    </div>
                ) : (
                    <div className="selected-file">
                        <div className="p-3 bg-gray-800 rounded-lg">
                            <FileVideo size={24} className="text-blue-400" />
                        </div>
                        <div className="file-info">
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">{formatFileSize(file.size)}</span>
                        </div>
                        <button
                            className="remove-file-btn"
                            onClick={removeFile}
                            disabled={uploading}
                            title="Remove file"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

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
                        disabled={!file || uploading}
                    >
                        {uploading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Upload size={18} />
                                Upload Video
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-8 text-sm text-gray-500 text-center">
                <p>Videos upload directly to the processing workflow.</p>
            </div>
        </div>
    )
}

export default VideoUpload
