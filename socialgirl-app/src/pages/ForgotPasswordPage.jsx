import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import './LoginPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ForgotPasswordPage = () => {
  const { showToast, showErrorToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        showToast('Check your email for reset instructions', 'success');
      } else {
        showErrorToast(data.error || 'Something went wrong');
      }
    } catch (error) {
      showErrorToast('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">
              {isSubmitted
                ? 'Check your email'
                : 'Enter your email to receive reset instructions'}
            </p>
          </div>

          {isSubmitted ? (
            <div className="success-message">
              <p>
                If an account exists with <strong>{email}</strong>, you will receive
                a password reset link shortly.
              </p>
              <p>Check your spam folder if you don't see it.</p>
              <Link to="/login" className="aurora-btn aurora-btn-primary auth-submit-btn">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="aurora-btn aurora-btn-primary auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
