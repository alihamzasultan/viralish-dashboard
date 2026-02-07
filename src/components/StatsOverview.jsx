import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const StatsOverview = () => {
    const [stats, setStats] = useState({
        totalGenerated: 0,
        posted: 0,
        failed: 0,
        sourceVideos: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: generatedData, error: generatedError } = await supabase
                    .from('generated_videos')
                    .select('id, posted, failed')

                if (generatedError) throw generatedError

                const { count: sourceCount, error: sourceError } = await supabase
                    .from('source_videos')
                    .select('*', { count: 'exact', head: true })

                if (sourceError) throw sourceError

                const totalGenerated = generatedData.length
                const posted = generatedData.filter(v => v.posted).length
                const failed = generatedData.filter(v => v.failed).length

                setStats({
                    totalGenerated,
                    posted,
                    failed,
                    sourceVideos: sourceCount || 0,
                })
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    if (loading) {
        return <div className="stats-grid"><p className="stat-label">Loading stats...</p></div>
    }

    return (
        <div className="stats-grid">
            <div className="stat-card">
                <h3 className="stat-label">Total Generated</h3>
                <p className="stat-value">{stats.totalGenerated}</p>
            </div>
            <div className="stat-card">
                <h3 className="stat-label">Videos Posted</h3>
                <p className="stat-value">{stats.posted}</p>
            </div>
            <div className="stat-card">
                <h3 className="stat-label">Failed</h3>
                <p className="stat-value">{stats.failed}</p>
            </div>
            <div className="stat-card">
                <h3 className="stat-label">Source Videos</h3>
                <p className="stat-value">{stats.sourceVideos}</p>
            </div>
        </div>
    )
}

export default StatsOverview
