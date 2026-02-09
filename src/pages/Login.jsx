import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Mail, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import '../styles/Auth.css'

const Login = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            // 1. Check if email exists in authenticated_users table
            const { data, error: fetchError } = await supabase
                .from('authenticated_users')
                .select('email')
                .eq('email', email.toLowerCase().trim())
                .single()

            if (fetchError || !data) {
                setMessage({
                    type: 'error',
                    text: 'Unauthorized: This email does not have access to the dashboard.'
                })
                setLoading(false)
                return
            }

            // 2. If email exists, send magic link
            const { error: authError } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase().trim(),
                options: {
                    emailRedirectTo: window.location.origin,
                },
            })

            if (authError) throw authError

            setMessage({
                type: 'success',
                text: 'Check your email for the login link!'
            })
        } catch (error) {
            console.error('Login error:', error)
            setMessage({
                type: 'error',
                text: error.message || 'An error occurred during login.'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-glow-1" />
            <div className="auth-glow-2" />

            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo-box">
                        <Sparkles className="text-indigo-400" size={32} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <h1 className="auth-title">Viralish AI</h1>
                    <p className="auth-subtitle">Secure Dashboard Access</p>
                </div>

                <div className="auth-card">
                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-container">
                                <Mail className="input-icon" size={20} />
                                <input
                                    type="email"
                                    required
                                    className="auth-input"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {message.text && (
                            <div className={`auth-message ${message.type}`}>
                                {message.type === 'success' ? (
                                    <CheckCircle2 size={18} />
                                ) : (
                                    <AlertCircle size={18} />
                                )}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="auth-button"
                        >
                            {loading ? (
                                <div className="spinner" />
                            ) : (
                                <>
                                    Send Magic Link
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="auth-footer-text">
                    Only authorized emails can access this workspace.
                </p>
            </div>
        </div>
    )
}

export default Login
