import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './Navigation';
import '../styles/components/Header.css';

const Header = () => {
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Don't show header on auth pages
    if (location.pathname === '/login' || location.pathname === '/signup') {
        return null;
    }

    return (
        <div className={`header-v2 ${isMobileMenuOpen ? 'menu-open' : ''}`}>
            <div className="header-mobile-row">
                <div className="logo-morph">
                    <div className="morph-shape"></div>
                </div>
                <h1 className="gradient-wave">SOCIAL RUNNER</h1>
                {isAuthenticated && user && (
                    <div className="user-info">
                        <span className="user-email">{user.email}</span>
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