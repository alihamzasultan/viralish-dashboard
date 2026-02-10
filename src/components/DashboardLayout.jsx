import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Video, Database, Settings, Globe, ChevronLeft, ChevronRight, Menu, Upload, Sparkles, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import clsx from 'clsx'
import '../styles/Dashboard.css'

const DashboardLayout = () => {
    const location = useLocation()
    const { user, signOut } = useAuth()
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [isMobileOpen, setIsMobileOpen] = React.useState(false)

    // Close mobile menu on route change
    React.useEffect(() => {
        setIsMobileOpen(false)
    }, [location.pathname])

    const navItems = [
        { label: 'Overview', path: '/', icon: LayoutDashboard },
        { label: 'Generated Videos', path: '/generated', icon: Video },
        { label: 'Source Videos', path: '/sources', icon: Database },
        { label: 'Source Pages', path: '/pages', icon: Globe },
        { label: 'My Generations', path: '/custom', icon: Sparkles },
        { label: 'Import Video', path: '/upload', icon: Upload },
    ]

    const userInitial = user?.email?.charAt(0).toUpperCase() || 'V'

    return (
        <div className="dashboard-container">
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div className="mobile-overlay" onClick={() => setIsMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={clsx('sidebar', isCollapsed && 'collapsed', isMobileOpen && 'mobile-open')}>
                <div className="sidebar-header">
                    {!isCollapsed && <h1 className="brand-title">Viralish AI</h1>}
                    <button
                        className="collapse-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>
                <nav className="nav-menu">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx('nav-item', isActive && 'active')}
                                title={isCollapsed ? item.label : ''}
                            >
                                <Icon size={20} />
                                {!isCollapsed && <span className="font-medium">{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>
                <div className="sidebar-footer">
                    {/* Public Mode: No Log Out needed */}
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-bar">
                    <div className="flex items-center space-x-3">
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="page-title">
                            {navItems.find((i) => i.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Public Mode: No avatar needed */}
                    </div>
                </header>
                <div className="content-area">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default DashboardLayout
