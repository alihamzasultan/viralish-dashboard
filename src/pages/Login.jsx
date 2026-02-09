import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import '../styles/Auth.css'

const Login = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    // If user is already logged in, redirect them
    React.useEffect(() => {
        if (user) {
            const from = location.state?.from?.pathname || '/'
            navigate(from, { replace: true })
        }
    }, [user, navigate, location])

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

            // 2. If email exists, route request to custom n8n webhook for manual magic link delivery
            // We use the same redirect origin for the manual link creation in n8n
            const n8nWebhookUrl = '/api/n8n/webhook/ce4c96ea-25a3-4ae0-b0f0-7f19a72201d0'

            const response = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    redirectTo: `${window.location.origin}/`,
                    timestamp: new Date().toISOString()
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || 'Failed to trigger login webhook')
            }

            setMessage({
                type: 'success',
                text: 'Login request sent! Please check your email inbox shortly.'
            })
        } catch (error) {
            console.error('Login error:', error)

            let errorMsg = error.message || 'An error occurred during login.'

            // Handle specific Supabase Auth server errors
            if (errorMsg.includes('rate limit')) {
                errorMsg = 'Email limit reached. Supabase only allows 3 trial emails per hour. Please wait or connect a custom SMTP (Resend/SendGrid).'
            } else if (errorMsg.includes('magic link') || errorMsg.includes('confirmation email') || error.status === 500) {
                errorMsg = 'Supabase SMTP Error: The email server is rejecting this request. If you added a custom SMTP, check your credentials. If not, you may be globally blocked on the trial tier.'
            }

            setMessage({
                type: 'error',
                text: errorMsg
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
