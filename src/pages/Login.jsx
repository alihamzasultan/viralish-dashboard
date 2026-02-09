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

        const cleanEmail = email.toLowerCase().trim()

        try {
            // 1. Check if email exists in authenticated_users table
            const { data: authData, error: fetchError } = await supabase
                .from('authenticated_users')
                .select('email')
                .eq('email', cleanEmail)
                .single()

            if (fetchError || !authData) {
                setMessage({
                    type: 'error',
                    text: 'Unauthorized: This email does not have access to the dashboard.'
                })
                setLoading(false)
                return
            }

            // 2. Send Magic Link directly to user email using Supabase Auth (Direct way)
            let directSent = false
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: cleanEmail,
                options: {
                    emailRedirectTo: 'https://viralish-dashboard.vercel.app/'
                }
            })

            if (!otpError) {
                directSent = true
            } else {
                console.warn('Supabase direct email failed:', otpError.message)
            }

            // 3. Generate Magic Link for Webhook (Service Role) - Backup/Notification
            const { createClient } = await import('@supabase/supabase-js')
            const supabaseAdmin = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: cleanEmail,
                options: {
                    redirectTo: 'https://viralish-dashboard.vercel.app/'
                }
            })

            if (linkError && !directSent) throw linkError

            let webhookSent = false
            if (linkData) {
                const fullMagicLink = linkData.properties?.action_link || linkData.action_link

                // 4. Send the link to n8n webhook
                const n8nWebhookUrl = '/api/n8n/webhook/ce4c96ea-25a3-4ae0-b0f0-7f19a72201d0'
                try {
                    const n8nResponse = await fetch(n8nWebhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: cleanEmail,
                            magicLink: fullMagicLink,
                            timestamp: new Date().toISOString(),
                            source: 'frontend-admin-gen-combined'
                        })
                    })
                    if (n8nResponse.ok) {
                        webhookSent = true
                    }
                } catch (webhookErr) {
                    console.error('Webhook error:', webhookErr)
                }
            }

            if (directSent || webhookSent) {
                setMessage({
                    type: 'success',
                    text: directSent
                        ? 'Login link sent directly to your email! Please check your inbox.'
                        : 'Login request sent! If you don\'t receive it, please contact support.'
                })
            } else {
                throw new Error('Failed to send login link through all channels.')
            }
        } catch (error) {
            console.error('Login error:', error)

            let errorMsg = error.message || 'An error occurred during login.'

            if (errorMsg.includes('rate limit')) {
                errorMsg = 'Email limit reached. Please wait a while or check if you already received a link.'
            } else if (errorMsg.includes('magic link') || errorMsg.includes('confirmation email') || error.status === 500) {
                errorMsg = 'Auth Service Error: The email server encountered an issue. Please try again later.'
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
