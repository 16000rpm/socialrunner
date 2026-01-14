import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

/**
 * Context for managing decrypted API keys in memory during the session
 * This allows API keys to be accessed by API functions after user loads them in Settings
 */
const ApiKeyContext = createContext({
    setApiKeys: () => {},
    getApiKey: () => null,
    clearApiKeys: () => {}
});

export const useApiKeys = () => {
    const context = useContext(ApiKeyContext);
    if (!context) {
        throw new Error('useApiKeys must be used within an ApiKeyProvider');
    }
    return context;
};

export const ApiKeyProvider = ({ children }) => {
    // Initialize state from sessionStorage if available
    const [apiKeys, setApiKeysState] = useState(() => {
        try {
            const stored = sessionStorage.getItem('socialrunner_session_keys');
            if (stored) {
                console.log('[API Key Context] Loading API keys from session storage');
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('[API Key Context] Failed to load from session storage:', error);
        }
        return {};
    });

    // Fetch API keys from backend when authenticated
    useEffect(() => {
        const fetchApiKeys = async () => {
            // Check if user is authenticated
            const accessToken = localStorage.getItem('accessToken');

            if (!accessToken) {
                console.log('[API Key Context] No access token, skipping API key fetch');
                return;
            }

            try {
                console.log('[API Key Context] Fetching API keys from backend');
                const response = await api.get('/api/keys');
                const keys = response.data;

                console.log('[API Key Context] API keys fetched successfully');
                setApiKeysState(keys);

                // Also save to sessionStorage
                try {
                    sessionStorage.setItem('socialrunner_session_keys', JSON.stringify(keys));
                    console.log('[API Key Context] Saved API keys to session storage');
                } catch (error) {
                    console.error('[API Key Context] Failed to save to session storage:', error);
                }
            } catch (error) {
                console.error('[API Key Context] Failed to fetch API keys:', error);
                // Clear keys on fetch failure
                setApiKeysState({});
                sessionStorage.removeItem('socialrunner_session_keys');
            }
        };

        fetchApiKeys();
    }, []); // Run once on mount

    const setApiKeys = (keys) => {
        console.log('[API Key Context] Setting API keys:', {
            keyNames: Object.keys(keys),
            hasRapidApi: !!keys.rapidApiKey,
            rapidApiLength: keys.rapidApiKey?.length || 0
        });
        setApiKeysState(keys);
        
        // Also save to sessionStorage for persistence during the session
        try {
            sessionStorage.setItem('socialrunner_session_keys', JSON.stringify(keys));
            console.log('[API Key Context] Saved API keys to session storage');
        } catch (error) {
            console.error('[API Key Context] Failed to save to session storage:', error);
        }
    };

    const getApiKey = (keyName) => {
        const key = apiKeys[keyName];
        console.log('[API Key Context] Getting API key:', {
            keyName,
            hasKey: !!key,
            keyLength: key?.length || 0
        });
        return key || null;
    };

    const clearApiKeys = () => {
        console.log('[API Key Context] Clearing all API keys');
        setApiKeysState({});
        
        // Also clear from sessionStorage
        try {
            sessionStorage.removeItem('socialrunner_session_keys');
            console.log('[API Key Context] Cleared API keys from session storage');
        } catch (error) {
            console.error('[API Key Context] Failed to clear session storage:', error);
        }
    };

    const refetchApiKeys = async () => {
        try {
            console.log('[API Key Context] Refetching API keys from backend');
            const response = await api.get('/api/keys');
            const keys = response.data;

            console.log('[API Key Context] API keys refetched successfully');
            setApiKeysState(keys);

            // Also save to sessionStorage
            try {
                sessionStorage.setItem('socialrunner_session_keys', JSON.stringify(keys));
            } catch (error) {
                console.error('[API Key Context] Failed to save to session storage:', error);
            }

            return { success: true };
        } catch (error) {
            console.error('[API Key Context] Failed to refetch API keys:', error);
            return { success: false, error: error.message };
        }
    };

    const contextValue = {
        setApiKeys,
        getApiKey,
        clearApiKeys,
        refetchApiKeys
    };

    return (
        <ApiKeyContext.Provider value={contextValue}>
            {children}
        </ApiKeyContext.Provider>
    );
};

export default ApiKeyContext;