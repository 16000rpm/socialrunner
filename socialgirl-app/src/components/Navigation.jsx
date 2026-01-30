import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/components/Navigation.css';

const Navigation = ({ closeMenu }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, isAuthenticated } = useAuth();

    const navItems = [
        { path: '/youtube', label: 'YouTube' },
        { path: '/instagram', label: 'Instagram' },
        { path: '/tiktok', label: 'TikTok' },
        { path: '/facebook-ads', label: 'FB Ads' },
        { path: '/settings', label: 'Settings' }
    ];

    const handleClick = () => {
        // Close mobile menu when a link is clicked
        if (closeMenu) {
            closeMenu();
        }
    };

    const handleLogout = async () => {
        await logout();
        if (closeMenu) {
            closeMenu();
        }
        navigate('/login');
    };

    return (
        <>
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item-v2 particle-menu ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={handleClick}
                >
                    {item.label}
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </Link>
            ))}
            {isAuthenticated && (
                <button
                    className="nav-item-v2 particle-menu logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            )}
        </>
    );
};

export default Navigation;