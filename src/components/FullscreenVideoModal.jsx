import React, { useEffect } from 'react';
import { X, Maximize2, Minimize2, Play, Pause, Download } from 'lucide-react';

const FullscreenVideoModal = ({ videoUrl, isOpen, onClose, title }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fullscreen-modal-overlay fade-in" onClick={onClose}>
            <div className="fullscreen-modal-content slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="fullscreen-modal-header">
                    <h3 className="fullscreen-video-title">{title || 'Preview'}</h3>
                    <button className="close-fullscreen-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="fullscreen-video-container">
                    <video
                        src={videoUrl}
                        controls
                        autoPlay
                        className="fullscreen-video-element"
                    />
                </div>
            </div>
        </div>
    );
};

export default FullscreenVideoModal;
