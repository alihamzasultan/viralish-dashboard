import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Activity, Bell, RefreshCcw, ShieldCheck, Zap, Video, CheckCircle2 } from 'lucide-react'

const ScraperStatus = () => {
    const [showSourceBubble, setShowSourceBubble] = useState(false)
    const [showGenBubble, setShowGenBubble] = useState(false)
    const [isPolling, setIsPolling] = useState(false)

    // Refs for real-time tracking
    const sourceCountRef = useRef(null)
    const generatedCountRef = useRef(null)
    const pollInterval = useRef(null)

    const checkSupabase = async () => {
        setIsPolling(true)
        try {
            // 1. Check source_videos
            const { count: currentSourceCount } = await supabase
                .from('source_videos')
                .select('*', { count: 'exact', head: true })

            if (sourceCountRef.current !== null && currentSourceCount > sourceCountRef.current) {
                setShowSourceBubble(true)
                setTimeout(() => setShowSourceBubble(false), 7000)
            }
            sourceCountRef.current = currentSourceCount

            // 2. Check generated_videos
            const { count: currentGenCount } = await supabase
                .from('generated_videos')
                .select('*', { count: 'exact', head: true })

            if (generatedCountRef.current !== null && currentGenCount > generatedCountRef.current) {
                setShowGenBubble(true)
                setTimeout(() => setShowGenBubble(false), 7000)
            }
            generatedCountRef.current = currentGenCount

        } catch (err) {
            console.error('System Check Error:', err)
        } finally {
            setTimeout(() => setIsPolling(false), 800)
        }
    }

    useEffect(() => {
        checkSupabase()
        pollInterval.current = setInterval(checkSupabase, 5000)
        return () => clearInterval(pollInterval.current)
    }, [])

    return (
        <div className="monitors-container">
            <div className="monitors-row">

                {/* Source Scraper Bar */}
                <div className="monitor-card scraper">
                    <div className="monitor-main-content">
                        <div className="monitor-icon scraper-icon">
                            <Zap size={18} />
                            <div className="pulse-dot" />
                        </div>
                        <div className="monitor-text-group">
                            <span className="monitor-title">Source Scraper</span>
                            <span className="monitor-desc">Monitoring for new social content...</span>
                        </div>
                    </div>
                    {isPolling && <RefreshCcw size={14} className="animate-spin text-indigo-400/40" />}

                    {showSourceBubble && (
                        <div className="monitor-bubble source">
                            <Bell size={14} className="animate-bounce" />
                            <span>New Source Scraped!</span>
                            <div className="bubble-line" />
                        </div>
                    )}
                </div>

                {/* Video Generation Bar */}
                <div className="monitor-card generator">
                    <div className="monitor-main-content">
                        <div className="monitor-icon generator-icon">
                            <Video size={18} />
                            <div className="pulse-dot" />
                        </div>
                        <div className="monitor-text-group">
                            <span className="monitor-title">Video Engine</span>
                            <span className="monitor-desc">AI generation pipeline active...</span>
                        </div>
                    </div>
                    {isPolling && <RefreshCcw size={14} className="animate-spin text-emerald-400/40" />}

                    {showGenBubble && (
                        <div className="monitor-bubble generator">
                            <CheckCircle2 size={14} className="animate-pulse" />
                            <span>New Video Generated!</span>
                            <div className="bubble-line" />
                        </div>
                    )}
                </div>
            </div>

            <style jsx="true">{`
                .monitors-container {
                    margin-bottom: 2.5rem;
                    width: 100%;
                }
                .monitors-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.25rem;
                    width: 100%;
                }
                .monitor-card {
                    background: rgba(15, 15, 25, 0.6);
                    backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 1.25rem 1.5rem;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 10px 30px -5px rgba(0,0,0,0.3);
                }
                .monitor-card:hover {
                    background: rgba(15, 15, 25, 0.8);
                    border-color: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                }
                .monitor-main-content {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                }
                .monitor-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    flex-shrink: 0;
                }
                .scraper-icon {
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    color: #818cf8;
                }
                .generator-icon {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    color: #10b981;
                }
                .pulse-dot {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 8px;
                    height: 8px;
                    background: currentColor;
                    border-radius: 50%;
                    box-shadow: 0 0 12px currentColor;
                    animation: dotPulse 2s infinite;
                }
                @keyframes dotPulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.6); opacity: 0.4; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .monitor-text-group {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .monitor-title {
                    font-size: 1rem;
                    font-weight: 900;
                    color: #fff;
                    letter-spacing: -0.01em;
                }
                .monitor-desc {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    font-weight: 500;
                    letter-spacing: 0.01em;
                }

                /* Bubble Styles */
                .monitor-bubble {
                    position: absolute;
                    top: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    white-space: nowrap;
                    padding: 0.75rem 1.5rem;
                    border-radius: 100px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.85rem;
                    font-weight: 950;
                    color: white;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    animation: bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    z-index: 10000;
                    pointer-events: none;
                }
                .monitor-bubble.source {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                }
                .monitor-bubble.generator {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }
                .bubble-line {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: rgba(255, 255, 255, 0.4);
                    animation: bubbleLine 7s linear forwards;
                }
                @keyframes bubbleIn {
                    from { transform: translate(-50%, 20px) scale(0.9); opacity: 0; }
                    to { transform: translate(-50%, 0) scale(1); opacity: 1; }
                }
                @keyframes bubbleLine {
                    from { width: 100%; }
                    to { width: 0%; }
                }

                @media (max-width: 1024px) {
                    .monitors-row { grid-template-columns: 1fr; gap: 1rem; }
                }

                @media (max-width: 480px) {
                    .monitor-card { padding: 1rem; }
                    .monitor-main-content { gap: 1rem; }
                    .monitor-title { font-size: 0.9rem; }
                    .monitor-desc { font-size: 0.7rem; }
                    .monitor-icon { width: 40px; height: 40px; }
                }
            `}</style>
        </div>
    )
}

export default ScraperStatus
