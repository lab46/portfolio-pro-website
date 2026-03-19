import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './AuthenticationGuard.css';

interface AuthenticationGuardProps {
  children: React.ReactNode;
}

const AuthenticationGuard: React.FC<AuthenticationGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading) {
    return (
      <div className="auth-guard-loading">
        <div className="spinner large" />
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-guard-prompt">
        <div className="auth-prompt-card">
          <h1>Welcome to Portfolio Manager</h1>
          <p>Please log in to access your portfolio</p>
          <button 
            className="btn btn-primary btn-large"
            onClick={() => loginWithRedirect()}
          >
            Log In to Continue
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthenticationGuard;
