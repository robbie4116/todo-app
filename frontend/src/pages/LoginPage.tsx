import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

declare global {
  interface Window {
    google?: any;
  }
}

const LoginPage: React.FC = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, register, loginWithGoogle } = useAuth();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const googleReadyRef = useRef(false);

  useEffect(() => {
    if (isRegisterMode || !googleClientId) return;

    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential: string }) => {
          setError('');
          setSuccess('');
          setIsSubmitting(true);
          try {
            await loginWithGoogle(response.credential);
            setSuccess('Google sign in successful. Redirecting...');
          } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
          } finally {
            setIsSubmitting(false);
          }
        },
      });
      googleReadyRef.current = true;
    };

    const existing = document.getElementById('google-identity-script');
    if (existing) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
  }, [isRegisterMode, googleClientId, loginWithGoogle]);

  const clearMessages = () => {
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegisterMode) {
        await register(normalizedEmail, password, name.trim());
        setSuccess('Account created successfully. Redirecting...');
      } else {
        await login(normalizedEmail, password);
        setSuccess('Login successful. Redirecting...');
      }

      if (!rememberMe) {
        sessionStorage.setItem('token', localStorage.getItem('token') || '');
        sessionStorage.setItem('user', localStorage.getItem('user') || '');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
    clearMessages();
    if (!googleClientId) {
      setError('Google Client ID is missing. Set VITE_GOOGLE_CLIENT_ID in frontend .env');
      return;
    }

    if (!googleReadyRef.current || !window.google) {
      setError('Google Sign-In is not ready yet. Try again in a moment.');
      return;
    }

    window.google.accounts.id.prompt();
  };

  return (
    <div className="login-shell">
      <div className="login-container">
        <div className="login-card">
          <div className="logo-section">
            <div className="logo-icon">
              <CheckCircle2 size={48} />
            </div>
            <div className="logo-text">Todo Manager</div>
            <div className="logo-subtitle">Stay organized, stay productive</div>
          </div>

          <form id="login-form" onSubmit={handleSubmit}>
            <div className={`form-error ${error ? 'show' : ''}`}>{error}</div>
            <div className={`form-success ${success ? 'show' : ''}`}>{success}</div>

            {isRegisterMode ? (
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Your name"
                  required
                />
              </div>
            ) : null}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearMessages();
                }}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearMessages();
                }}
                placeholder="********"
                minLength={8}
                required
              />
            </div>

            <div className="remember-row">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
            </div>

            <button type="submit" className={`login-btn ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
              <span className="loading-spinner" />
              <span className="btn-text">{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
            </button>
          </form>

          {!isRegisterMode ? (
            <>
              <div className="divider">
                <span>Or continue with</span>
              </div>
              <button type="button" className="google-btn" id="google-btn" onClick={handleGoogleClick}>
                <span className="google-icon">
                  <Chrome size={18} />
                </span>
                <span>Continue with Google</span>
              </button>
            </>
          ) : null}

          <div className="signup-link">
            {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              className="link-btn inline-link"
              onClick={() => {
                clearMessages();
                setIsRegisterMode((prev) => !prev);
              }}
            >
              {isRegisterMode ? 'Sign in here' : 'Sign up here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
