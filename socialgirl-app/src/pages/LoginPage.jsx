import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const { showToast, showErrorToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);

    try {
      const result = await loginWithGoogle(credentialResponse.credential);

      if (result.success) {
        showToast('Login successful!', 'success');
        navigate('/youtube');
      } else {
        showErrorToast(result.error || 'Login failed');
      }
    } catch (error) {
      showErrorToast('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    showErrorToast('Google sign-in failed. Please try again.');
  };

  return (
    <div className="auth-page">
      <div className="aurora-waves">
        <div className="aurora-layer"></div>
        <div className="aurora-layer"></div>
        <div className="aurora-layer"></div>
        <div className="noise-overlay"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome</h1>
            <p className="auth-subtitle">Sign in to Social Runner</p>
          </div>

          <div className="google-login-container">
            {isLoading ? (
              <div className="loading-state">
                <p>Signing in...</p>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                size="large"
                width="100%"
                text="signin_with"
                shape="rectangular"
              />
            )}
          </div>

          <div className="auth-footer">
            <p className="auth-disclaimer">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
