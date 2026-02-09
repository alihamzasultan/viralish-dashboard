import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link2, Edit2, Check, X, AlertCircle, PauseCircle, PlayCircle, Trash2, Plus, Globe } from 'lucide-react'
import '../styles/SourceVideoTable.css'
import '../styles/SourcePages.css'

const SourcePagesList = () => {
    const [pages, setPages] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [editValue, setEditValue] = useState('')
    const [updating, setUpdating] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [newPageUrl, setNewPageUrl] = useState('')
    const [newPagePosts, setNewPagePosts] = useState('10')

    useEffect(() => {
        fetchPages()
    }, [])

    const fetchPages = async () => {
        try {
            const { data, error } = await supabase
                .from('source_pages')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setPages(data || [])
        } catch (error) {
            console.error('Error fetching source pages:', error)
        } finally {
            setLoading(false)
        }
    }

    const startEditing = (page) => {
        setEditingId(page.id)
        setEditValue(page.number_of_posts.toString())
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditValue('')
    }

    const handleUpdate = async (id) => {
        // Validation: must be an integer
        if (!/^\d+$/.test(editValue)) {
            alert('Please enter a valid positive integer for the number of posts.')
            return
        }

        const numValue = parseInt(editValue, 10)

        setUpdating(true)
        try {
            const { error } = await supabase
                .from('source_pages')
                .update({ number_of_posts: numValue })
                .eq('id', id)

            if (error) throw error

            setPages(pages.map(p => p.id === id ? { ...p, number_of_posts: numValue } : p))
            setEditingId(null)
        } catch (error) {
            console.error('Error updating page:', error)
            alert('Failed to update. Please try again.')
        } finally {
            setUpdating(false)
        }
    }

    const toggleStatus = async (page) => {
        const newStatus = page.status === 'paused' ? 'active' : 'paused'

        setUpdating(true)
        try {
            const { error } = await supabase
                .from('source_pages')
                .update({ status: newStatus })
                .eq('id', page.id)

            if (error) throw error

            setPages(pages.map(p => p.id === page.id ? { ...p, status: newStatus } : p))
        } catch (error) {
            console.error('Error toggling status:', error)
            alert('Failed to update status.')
        } finally {
            setUpdating(false)
        }
    }

    const deletePage = async (id) => {
        if (!window.confirm('Are you sure you want to delete this source page?')) return

        setUpdating(true)
        try {
            const { error } = await supabase
                .from('source_pages')
                .delete()
                .eq('id', id)

            if (error) throw error

            setPages(pages.filter(p => p.id !== id))
        } catch (error) {
            console.error('Error deleting page:', error)
            alert('Failed to delete page.')
        } finally {
            setUpdating(false)
        }
    }

    const addPage = async (e) => {
        e.preventDefault()
        if (!newPageUrl) {
            alert('Please enter a URL.')
            return
        }

        if (!/^\d+$/.test(newPagePosts)) {
            alert('Posts must be a valid integer.')
            return
        }

        setUpdating(true)
        try {
            const { data, error } = await supabase
                .from('source_pages')
                .insert([{
                    source_page_url: newPageUrl,
                    number_of_posts: parseInt(newPagePosts, 10),
                    status: 'active'
                }])
                .select()

            if (error) throw error

            if (data) {
                setPages([data[0], ...pages])
                setNewPageUrl('')
                setNewPagePosts('10')
                setIsAdding(false)
            }
        } catch (error) {
            console.error('Error adding page:', error)
            alert('Failed to add source page.')
        } finally {
            setUpdating(false)
        }
    }

    if (loading) return <div className="text-center p-8">Loading source pages...</div>

    return (
        <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="section-title" style={{ margin: 0 }}>Source Pages</h2>
                <button
                    className={isAdding ? "btn-ghost" : "btn-primary"}
                    onClick={() => setIsAdding(!isAdding)}
                >
                    {isAdding ? <X size={18} /> : <Plus size={18} />}
                    {isAdding ? 'Cancel' : 'Add New Source'}
                </button>
            </div>

            {isAdding && (
                <div className="add-source-form">
                    <form onSubmit={addPage} className="form-grid">
                        <div className="input-group">
                            <label>Source Page URL</label>
                            <div className="input-wrapper">
                                <Globe size={18} style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="url"
                                    placeholder="https://example.com/page"
                                    value={newPageUrl}
                                    onChange={(e) => setNewPageUrl(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Posts to Scrape</label>
                            <div className="input-wrapper">
                                <input
                                    type="number"
                                    value={newPagePosts}
                                    onChange={(e) => setNewPagePosts(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={updating}
                        >
                            {updating ? 'Adding...' : 'Save Source Page'}
                        </button>
                    </form>
                </div>
            )}
            <div className="table-container">
                <div className="table-scroll">
                    <table className="source-table">
                        <thead>
                            <tr>
                                <th>Source URL</th>
                                <th style={{ width: '220px' }}>Posts to Scrape</th>
                                <th>Status</th>
                                <th style={{ width: '180px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.length > 0 ? (
                                pages.map((page) => (
                                    <tr key={page.id}>
                                        <td>
                                            <div className="url-container">
                                                <Link2 size={18} style={{ color: 'var(--accent-primary)', opacity: 0.8 }} />
                                                <a
                                                    href={page.source_page_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="source-url-link"
                                                    title={page.source_page_url}
                                                >
                                                    {page.source_page_url}
                                                </a>
                                            </div>
                                        </td>
                                        <td>
                                            {editingId === page.id ? (
                                                <input
                                                    type="text"
                                                    className="edit-posts-input"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(page.id)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="post-count-display">
                                                    {page.number_of_posts}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${page.status === 'paused' ? 'pending' : 'analyzed'}`}>
                                                {page.status || 'active'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex" style={{ gap: '0.5rem' }}>
                                                {editingId === page.id ? (
                                                    <>
                                                        <button
                                                            className="action-icon-btn save"
                                                            onClick={() => handleUpdate(page.id)}
                                                            disabled={updating}
                                                            title="Save"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            className="action-icon-btn cancel"
                                                            onClick={cancelEditing}
                                                            disabled={updating}
                                                            title="Cancel"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="source-link-badge"
                                                            style={{ cursor: 'pointer', border: 'none' }}
                                                            onClick={() => startEditing(page)}
                                                        >
                                                            <Edit2 size={14} /> Edit
                                                        </button>
                                                        <button
                                                            className={`action-icon-btn ${page.status === 'paused' ? 'save' : 'cancel'}`}
                                                            onClick={() => toggleStatus(page)}
                                                            disabled={updating}
                                                            title={page.status === 'paused' ? 'Resume Scraping' : 'Pause Scraping'}
                                                        >
                                                            {page.status === 'paused' ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
                                                        </button>
                                                        <button
                                                            className="action-icon-btn cancel"
                                                            onClick={() => deletePage(page.id)}
                                                            disabled={updating}
                                                            title="Delete Page"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                                        <div className="flex flex-col items-center" style={{ gap: '0.5rem' }}>
                                            <AlertCircle size={32} />
                                            <span>No source pages found.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

export default SourcePagesList
