import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Navigation from './Navigation';
import '../styles/components/Header.css';

const Header = () => {
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const { onlineCount, onlineUsers, isConnected } = useSocket();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showOnlineUsers, setShowOnlineUsers] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Don't show header on login page
    if (location.pathname === '/login') {
        return null;
    }

    return (
        <div className={`header-v2 ${isMobileMenuOpen ? 'menu-open' : ''}`}>
            <div className="header-mobile-row">
                <div className="logo-morph">
                    <div className="morph-shape"></div>
                </div>
                <h1 className="gradient-wave">SOCIAL RUNNER</h1>
                <div
                    className="online-users"
                    onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                    title={isConnected ? 'Click to see who\'s online' : 'Disconnected'}
                >
                    <span className={`online-dot ${isConnected ? 'connected' : ''}`}></span>
                    <span className="online-count">{onlineCount} online</span>
                    {showOnlineUsers && onlineUsers.length > 0 && (
                        <div className="online-users-dropdown">
                            <div className="online-users-header">Online Users</div>
                            {onlineUsers.map((u, index) => (
                                <div key={u.id || index} className="online-user-item">
                                    {u.picture ? (
                                        <img src={u.picture} alt={u.name} className="online-user-avatar" />
                                    ) : (
                                        <div className="online-user-avatar-placeholder">
                                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <span className="online-user-name">{u.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {isAuthenticated && user && (
                    <div className="user-info">
                        {user.picture && (
                            <img src={user.picture} alt={user.name} className="user-avatar" />
                        )}
                        <span className="user-name">{user.name || user.email}</span>
                    </div>
                )}
                <button
                    className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
                    onClick={toggleMobileMenu}
                    aria-label="Toggle mobile menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>
            </div>
            {isMobileMenuOpen && (
                <div 
                    className="mobile-menu-overlay" 
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            <nav className={`nav-v2 ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
                <Navigation closeMenu={() => setIsMobileMenuOpen(false)} />
            </nav>
        </div>
    );
};

export default Header;