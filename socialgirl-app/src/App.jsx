import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Preloader from './components/Preloader';
import YouTubePage from './pages/YouTubePage';
import InstagramPage from './pages/InstagramPage';
import TikTokPage from './pages/TikTokPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import usePlatformData from './hooks/usePlatformData';
import useSearch from './hooks/useSearch';
import { PLATFORMS, DEFAULT_PLATFORM } from './config/platforms';
import { AuthProvider } from './contexts/AuthContext';
import { ApiKeyProvider, useApiKeys } from './contexts/ApiKeyContext';
import { ToastProvider } from './contexts/ToastContext';
import { DialogProvider } from './contexts/DialogContext';
import { setApiKeyContextGetter } from './utils/apiKeyManager';
import './App.css';

function AppContent() {
    const platformData = usePlatformData();
    const { handleYouTubeSearch, handleTikTokSearch, handleInstagramSearch } = useSearch(platformData);
    const location = useLocation();
    const { getApiKey } = useApiKeys();

    // Set up the API key context getter for the apiKeyManager
    useEffect(() => {
        console.log('[App] Setting up API key context getter for apiKeyManager');
        setApiKeyContextGetter(getApiKey);
    }, [getApiKey]);

    const getPageTitle = () => {
        const platformId = location.pathname.slice(1);
        const platform = PLATFORMS[platformId];
        
        if (platform) {
            return platform.title;
        } else if (location.pathname === '/settings') {
            return 'Settings';
        } else {
            return 'Content Analytics Dashboard';
        }
    };


    return (
        <div className="aurora-waves">
            <div className="aurora-layer"></div>
            <div className="aurora-layer"></div>
            <div className="aurora-layer"></div>
            <div className="noise-overlay"></div>
            
            <div className="container">
                <Header />
                <main className="main-content">
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                    {/* Protected routes */}
                    <Route path="/" element={<Navigate to="/youtube" replace />} />
                    <Route
                        path="/youtube"
                        element={
                            <ProtectedRoute>
                                <div className="section">
                                    <div className="section-title-v1">{getPageTitle()}</div>
                                    <YouTubePage
                                        videosData={platformData.getPlatformData('youtube').videosData}
                                        usersData={platformData.getPlatformData('youtube').usersData}
                                        userVideosData={platformData.getPlatformData('youtube').userVideosData}
                                        isLoading={platformData.getPlatformData('youtube').isLoading}
                                        onSearch={handleYouTubeSearch}
                                        onClearData={() => platformData.clearPlatformData('youtube')}
                                    />
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/instagram"
                        element={
                            <ProtectedRoute>
                                <div className="section">
                                    <div className="section-title-v1">{getPageTitle()}</div>
                                    <InstagramPage
                                        videosData={platformData.getPlatformData('instagram').videosData}
                                        usersData={platformData.getPlatformData('instagram').usersData}
                                        userVideosData={platformData.getPlatformData('instagram').userVideosData}
                                        isLoading={platformData.getPlatformData('instagram').isLoading}
                                        onSearch={handleInstagramSearch}
                                        onClearData={() => platformData.clearPlatformData('instagram')}
                                    />
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tiktok"
                        element={
                            <ProtectedRoute>
                                <div className="section">
                                    <div className="section-title-v1">{getPageTitle()}</div>
                                    <TikTokPage
                                        videosData={platformData.getPlatformData('tiktok').videosData}
                                        usersData={platformData.getPlatformData('tiktok').usersData}
                                        userVideosData={platformData.getPlatformData('tiktok').userVideosData}
                                        isLoading={platformData.getPlatformData('tiktok').isLoading}
                                        onSearch={handleTikTokSearch}
                                        onClearData={() => platformData.clearPlatformData('tiktok')}
                                    />
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <div className="section">
                                    <div className="section-title-v1">{getPageTitle()}</div>
                                    <SettingsPage />
                                </div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
                </main>
                <footer className="app-footer">
                    <p>© 2025 Rahul Prakash Menon. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}

function App() {
    const [isLoading, setIsLoading] = useState(true);

    const handleLoadComplete = () => {
        setIsLoading(false);
    };

    return (
        <AuthProvider>
            <ApiKeyProvider>
                <DialogProvider>
                    <ToastProvider>
                        {isLoading && <Preloader onLoadComplete={handleLoadComplete} />}
                        <Router>
                            <AppContent />
                        </Router>
                    </ToastProvider>
                </DialogProvider>
            </ApiKeyProvider>
        </AuthProvider>
    );
}

export default App